import { useState, useEffect, useCallback } from 'react';
import type { Character } from '@/lib/types';
import { getAllCharacters, deleteCharacter as dbDelete, duplicateCharacter as dbDuplicate } from '@/lib/db';

export function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const chars = await getAllCharacters();
      setCharacters(chars);
    } catch (e) {
      console.error('Failed to load characters:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await dbDelete(id);
    await refresh();
  }, [refresh]);

  const duplicate = useCallback(async (id: string) => {
    await dbDuplicate(id);
    await refresh();
  }, [refresh]);

  return { characters, loading, refresh, remove, duplicate };
}
