import { useState, useCallback, useRef, useEffect } from 'react';
import type { DiceRoll } from '@/lib/types';
import { rollDice } from '@/lib/dice';

interface RollOptions {
  keepHighest?: number;
  keepLowest?: number;
  modifier?: number;
}

export function useDiceRoller() {
  const [history, setHistory] = useState<DiceRoll[]>([]);
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const roll = useCallback((expression: string, label?: string, options?: RollOptions) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRolling(true);
    timerRef.current = setTimeout(() => {
      let result = rollDice(expression, label);

      // Apply keepHighest / keepLowest for advantage/disadvantage
      if (options && result.results.length > 1) {
        const sorted = [...result.results].sort((a, b) => b - a);
        let kept: number[];
        if (options.keepHighest) {
          kept = sorted.slice(0, options.keepHighest);
        } else if (options.keepLowest) {
          kept = sorted.slice(-options.keepLowest);
        } else {
          kept = result.results;
        }
        const base = kept.reduce((a, b) => a + b, 0);
        const mod = options.modifier ?? 0;
        result = {
          ...result,
          results: result.results, // show all dice rolled
          total: base + mod,
          expression: options.keepHighest
            ? `${expression} (${label ?? ''})${mod !== 0 ? (mod > 0 ? `+${mod}` : mod) : ''}`
            : `${expression} (${label ?? ''})${mod !== 0 ? (mod > 0 ? `+${mod}` : mod) : ''}`,
        };
      } else if (options?.modifier) {
        result = { ...result, total: result.total + options.modifier };
      }

      setLastRoll(result);
      setHistory(prev => [result, ...prev].slice(0, 50));
      setIsRolling(false);
    }, 280);
  }, []);

  const clear = useCallback(() => {
    setHistory([]);
    setLastRoll(null);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return { roll, history, lastRoll, isRolling, clear };
}
