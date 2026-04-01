import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Character, UserPreferences } from './types';

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
  char.updatedAt = new Date().toISOString();
  await db.put('characters', char);
}

export async function deleteCharacter(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('characters', id);
  await db.delete('images', id);
}

export async function duplicateCharacter(id: string): Promise<Character | null> {
  const char = await getCharacter(id);
  if (!char) return null;
  const newChar: Character = {
    ...char,
    id: crypto.randomUUID(),
    name: `${char.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await saveCharacter(newChar);
  return newChar;
}

// Images
export async function saveCharacterImage(charId: string, data: string): Promise<void> {
  const db = await getDB();
  await db.put('images', { id: charId, data });
}

export async function getCharacterImage(charId: string): Promise<string | null> {
  const db = await getDB();
  const img = await db.get('images', charId);
  return img?.data ?? null;
}

// Export/Import
export async function exportCharacter(id: string): Promise<string> {
  const char = await getCharacter(id);
  const img = await getCharacterImage(id);
  return JSON.stringify({ character: char, image: img }, null, 2);
}

export async function importCharacter(json: string): Promise<Character> {
  const data = JSON.parse(json);
  const char: Character = data.character;
  char.id = crypto.randomUUID();
  char.createdAt = new Date().toISOString();
  char.updatedAt = new Date().toISOString();
  await saveCharacter(char);
  if (data.image) {
    await saveCharacterImage(char.id, data.image);
  }
  return char;
}

export async function exportAllCharacters(): Promise<string> {
  const chars = await getAllCharacters();
  const results = [];
  for (const c of chars) {
    const img = await getCharacterImage(c.id);
    results.push({ character: c, image: img });
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
