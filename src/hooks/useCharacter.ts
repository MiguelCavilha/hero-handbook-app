import { useState, useEffect, useCallback, useRef } from 'react';
import type { Character } from '@/lib/types';
import { getCharacter, saveCharacter } from '@/lib/db';
import { applyAutoCalculations } from '@/lib/calculations';

export function useCharacter(id: string | undefined) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    getCharacter(id)
      .then(c => {
        setCharacter(c ?? null);
        setError(null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const updateCharacter = useCallback((updates: Partial<Character> | ((prev: Character) => Character)) => {
    setCharacter(prev => {
      if (!prev) return prev;
      const next = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      const calculated = applyAutoCalculations(next);

      // Debounced auto-save — surface errors via console (non-blocking)
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        saveCharacter(calculated)
          .then(() => setLastSaved(new Date()))
          .catch(e => console.error('Auto-save failed:', e));
      }, 500);

      return calculated;
    });
  }, []);

  const forceSave = useCallback(async () => {
    if (!character) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    await saveCharacter(character);
    setLastSaved(new Date());
  }, [character]);

  return { character, loading, error, updateCharacter, forceSave, lastSaved };
}
