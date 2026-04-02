import { useState, useEffect, useCallback, useRef } from 'react';
import type { Character } from '@/lib/types';
import { getCharacterWithPortrait, saveCharacter } from '@/lib/db';
import { applyAutoCalculations } from '@/lib/calculations';

export function useCharacter(id: string | undefined) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  // Ref sempre aponta para o valor mais recente — evita stale closure no save
  const latestCharacter = useRef<Character | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    getCharacterWithPortrait(id)
      .then(c => {
        setCharacter(c ?? null);
        latestCharacter.current = c ?? null;
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

      // Sempre salva o estado mais recente via ref — sem stale closure
      latestCharacter.current = calculated;

      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        const toSave = latestCharacter.current;
        if (!toSave) return;
        saveCharacter(toSave)
          .then(() => setLastSaved(new Date()))
          .catch(e => console.error('Auto-save failed:', String(e)));
      }, 500);

      return calculated;
    });
  }, []);

  const forceSave = useCallback(async () => {
    const toSave = latestCharacter.current;
    if (!toSave) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    await saveCharacter(toSave);
    setLastSaved(new Date());
  }, []);

  // Limpa o timeout ao desmontar para evitar setState em componente desmontado
  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  return { character, loading, error, updateCharacter, forceSave, lastSaved };
}
