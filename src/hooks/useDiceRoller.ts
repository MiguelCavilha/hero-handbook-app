import { useState, useCallback } from 'react';
import type { DiceRoll } from '@/lib/types';
import { rollDice } from '@/lib/dice';

export function useDiceRoller() {
  const [history, setHistory] = useState<DiceRoll[]>([]);
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const roll = useCallback((expression: string, label?: string) => {
    setIsRolling(true);
    setTimeout(() => {
      const result = rollDice(expression, label);
      setLastRoll(result);
      setHistory(prev => [result, ...prev].slice(0, 50));
      setIsRolling(false);
    }, 300);
  }, []);

  const clear = useCallback(() => {
    setHistory([]);
    setLastRoll(null);
  }, []);

  return { roll, history, lastRoll, isRolling, clear };
}
