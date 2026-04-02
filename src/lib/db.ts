import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Character, UserPreferences } from './types';
import { createDefaultCharacter } from './character-factory';

interface CharSheetDB extends DBSchema {
  characters: {
    key: string;
    value: Character;
    indexes: { 'by-updated': string };
  };
  images: {
    key: string; // character ID
    value: { id: string; data: string }; // base64
  };
  compendium: {
    key: string;
    value: { id: string; type: string; data: any; fetchedAt: string };
    indexes: { 'by-type': string };
  };
}

const DB_NAME = 'dnd-character-sheet';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<CharSheetDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<CharSheetDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const charStore = db.createObjectStore('characters', { keyPath: 'id' });
        charStore.createIndex('by-updated', 'updatedAt');
        db.createObjectStore('images', { keyPath: 'id' });
        const compStore = db.createObjectStore('compendium', { keyPath: 'id' });
        compStore.createIndex('by-type', 'type');
      },
    });
  }
  return dbPromise;
}

// Character CRUD
export async function getAllCharacters(): Promise<Character[]> {
  const db = await getDB();
  const chars = await db.getAll('characters');
  return chars.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getCharacter(id: string): Promise<Character | undefined> {
  const db = await getDB();
  return db.get('characters', id);
}

export async function saveCharacter(char: Character): Promise<void> {
  const db = await getDB();
  // Nunca persiste o base64 dentro do objeto Character — mantém portrait como null no store
  const toSave: Character = { ...char, portrait: null, updatedAt: new Date().toISOString() };
  await db.put('characters', toSave);
}

export async function deleteCharacter(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('characters', id);
  await db.delete('images', id);
}

export async function duplicateCharacter(id: string): Promise<Character | null> {
  const char = await getCharacter(id);
  if (!char) return null;
  const newId = crypto.randomUUID();
  const newChar: Character = {
    ...char,
    id: newId,
    name: `${char.name} (Copy)`,
    portrait: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await saveCharacter(newChar);
  // Copia a imagem separadamente
  const img = await getCharacterImage(id);
  if (img) await saveCharacterImage(newId, img);
  return { ...newChar, portrait: img };
}

// Images — fonte única de verdade para portraits
export async function saveCharacterImage(charId: string, data: string): Promise<void> {
  const db = await getDB();
  await db.put('images', { id: charId, data });
}

export async function getCharacterImage(charId: string): Promise<string | null> {
  const db = await getDB();
  const img = await db.get('images', charId);
  return img?.data ?? null;
}

// Carrega personagem com portrait injetado do store images
export async function getCharacterWithPortrait(id: string): Promise<Character | undefined> {
  const char = await getCharacter(id);
  if (!char) return undefined;
  const portrait = await getCharacterImage(id);
  return { ...char, portrait };
}

// Export/Import
export async function exportCharacter(id: string): Promise<string> {
  const char = await getCharacter(id);
  const image = await getCharacterImage(id);
  // portrait não fica duplicado: char.portrait é null no store, image é o base64 separado
  return JSON.stringify({ character: char, image }, null, 2);
}

function validateCharacterShape(data: unknown): data is Partial<Character> {
  if (!data || typeof data !== 'object') return false;
  const c = data as Record<string, unknown>;
  return (
    typeof c.name === 'string' &&
    typeof c.id === 'string' &&
    Array.isArray(c.classes) &&
    c.classes.length > 0
  );
}

export async function importCharacter(json: string): Promise<Character> {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON file.');
  }

  const raw = (data as any)?.character ?? data;
  if (!validateCharacterShape(raw)) {
    throw new Error('File does not contain a valid character. Missing required fields.');
  }

  // Merge com defaults garante que campos novos/ausentes nunca fiquem undefined
  const char = createDefaultCharacter({
    ...(raw as Partial<Character>),
    id: crypto.randomUUID(),
    portrait: null, // portrait vive no store images, não no objeto
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await saveCharacter(char);

  // Suporta portrait tanto no campo legado raw.portrait quanto no campo image separado
  const imageData = (data as any)?.image ?? (raw as any)?.portrait;
  if (imageData && typeof imageData === 'string' && imageData.startsWith('data:')) {
    await saveCharacterImage(char.id, imageData);
    char.portrait = imageData; // injeta em memória para uso imediato
  }

  return char;
}

export async function exportAllCharacters(): Promise<string> {
  const chars = await getAllCharacters();
  const results = [];
  for (const c of chars) {
    const image = await getCharacterImage(c.id);
    // char.portrait é null no store — image é o base64 separado, sem duplicação
    results.push({ character: c, image });
  }
  return JSON.stringify({ characters: results, exportedAt: new Date().toISOString() }, null, 2);
}

// Preferences (localStorage for small data)
const PREFS_KEY = 'dnd-cs-prefs';

export function getPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { theme: 'system', lastCharacterId: null, sessionMode: false };
}

export function savePreferences(prefs: Partial<UserPreferences>): void {
  const current = getPreferences();
  localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...prefs }));
}
