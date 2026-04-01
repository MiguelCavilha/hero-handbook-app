import type { DiceRoll } from './types';

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function parseDiceExpression(expr: string): { count: number; sides: number; modifier: number } | null {
  const match = expr.trim().match(/^(\d+)?d(\d+)\s*([+-]\s*\d+)?$/i);
  if (!match) return null;
  return {
    count: parseInt(match[1] || '1'),
    sides: parseInt(match[2]),
    modifier: match[3] ? parseInt(match[3].replace(/\s/g, '')) : 0,
  };
}

export function rollDice(expression: string, label?: string): DiceRoll {
  const parsed = parseDiceExpression(expression);
  if (!parsed) {
    return {
      id: crypto.randomUUID(),
      expression,
      results: [],
      total: 0,
      timestamp: new Date().toISOString(),
      label: label || 'Invalid',
    };
  }
  const results: number[] = [];
  for (let i = 0; i < parsed.count; i++) {
    results.push(rollDie(parsed.sides));
  }
  const total = results.reduce((a, b) => a + b, 0) + parsed.modifier;
  return {
    id: crypto.randomUUID(),
    expression,
    results,
    total,
    timestamp: new Date().toISOString(),
    label,
  };
}
