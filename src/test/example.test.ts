import { describe, it, expect } from 'vitest';
import {
  abilityModifier,
  proficiencyBonus,
  calcHpMax,
  calcSkillBonus,
  calcSavingThrow,
  calcSpellSaveDC,
  passivePerception,
  getNextLevelFromXp,
  xpToNextLevel,
} from '@/lib/calculations';
import { parseDiceExpression, rollDice } from '@/lib/dice';
import { createDefaultCharacter } from '@/lib/character-factory';

// ─── abilityModifier ────────────────────────────────────────────────────────
describe('abilityModifier', () => {
  it('returns 0 for score 10', () => expect(abilityModifier(10)).toBe(0));
  it('returns 0 for score 11', () => expect(abilityModifier(11)).toBe(0));
  it('returns +1 for score 12', () => expect(abilityModifier(12)).toBe(1));
  it('returns +5 for score 20', () => expect(abilityModifier(20)).toBe(5));
  it('returns -1 for score 8', () => expect(abilityModifier(8)).toBe(-1));
  it('returns -5 for score 1', () => expect(abilityModifier(1)).toBe(-5));
});

// ─── proficiencyBonus ───────────────────────────────────────────────────────
describe('proficiencyBonus', () => {
  it('+2 at level 1', () => {
    const c = createDefaultCharacter({ classes: [{ name: 'Fighter', subclass: '', level: 1, hitDieSize: 10, hitDiceUsed: 0 }] });
    expect(proficiencyBonus(c)).toBe(2);
  });
  it('+3 at level 5', () => {
    const c = createDefaultCharacter({ classes: [{ name: 'Fighter', subclass: '', level: 5, hitDieSize: 10, hitDiceUsed: 0 }] });
    expect(proficiencyBonus(c)).toBe(3);
  });
  it('+6 at level 20', () => {
    const c = createDefaultCharacter({ classes: [{ name: 'Fighter', subclass: '', level: 20, hitDieSize: 10, hitDiceUsed: 0 }] });
    expect(proficiencyBonus(c)).toBe(6);
  });
});

describe('xp-based progression', () => {
  it('maps XP to next level correctly', () => {
    expect(getNextLevelFromXp(0)).toBe(1);
    expect(getNextLevelFromXp(299)).toBe(1);
    expect(getNextLevelFromXp(300)).toBe(2);
    expect(getNextLevelFromXp(899)).toBe(2);
    expect(getNextLevelFromXp(900)).toBe(3);
    expect(getNextLevelFromXp(355000)).toBe(20);
  });

  it('returns XP needed to the next level', () => {
    expect(xpToNextLevel(0)).toBe(300);
    expect(xpToNextLevel(300)).toBe(600);
    expect(xpToNextLevel(6500)).toBe(7500); // to level 6
    expect(xpToNextLevel(355000)).toBe(0);
  });

  it('createDefaultCharacter sets class from XP if classes absent', () => {
    const c = createDefaultCharacter({ experience: 6500 });
    expect(c.classes[0].level).toBe(5);
  });
});

// ─── calcHpMax ──────────────────────────────────────────────────────────────
describe('calcHpMax', () => {
  it('single class Fighter level 1 with CON 10', () => {
    const c = createDefaultCharacter({
      classes: [{ name: 'Fighter', subclass: '', level: 1, hitDieSize: 10, hitDiceUsed: 0 }],
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    });
    // Level 1: max die (10) + CON mod (0) = 10
    expect(calcHpMax(c)).toBe(10);
  });

  it('single class Fighter level 3 with CON 14 (+2)', () => {
    const c = createDefaultCharacter({
      classes: [{ name: 'Fighter', subclass: '', level: 3, hitDieSize: 10, hitDiceUsed: 0 }],
      abilities: { str: 10, dex: 10, con: 14, int: 10, wis: 10, cha: 10 },
    });
    // calcHpMax implementation in this app uses simplified fixed-average formula, currently returns 28.
    expect(calcHpMax(c)).toBe(28);
  });

  it('multiclass Fighter 5 / Wizard 3 with CON 10', () => {
    const c = createDefaultCharacter({
      classes: [
        { name: 'Fighter', subclass: '', level: 5, hitDieSize: 10, hitDiceUsed: 0 },
        { name: 'Wizard', subclass: '', level: 3, hitDieSize: 6, hitDiceUsed: 0 },
      ],
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    });
    // Fighter L1: 10; Fighter L2-5: 4×(5+1+0)=4×6=24; Wizard L1-3: 3×(3+1+0)=3×4=12 → 10+24+12=46
    expect(calcHpMax(c)).toBe(46);
  });

  it('respects manual override', () => {
    const c = createDefaultCharacter({
      classes: [{ name: 'Fighter', subclass: '', level: 1, hitDieSize: 10, hitDiceUsed: 0 }],
      hpMax: 99,
      manualOverrides: { hpMax: true },
    });
    expect(calcHpMax(c)).toBe(99);
  });
});

// ─── calcSkillBonus ─────────────────────────────────────────────────────────
describe('calcSkillBonus', () => {
  it('no proficiency returns only ability mod', () => {
    const c = createDefaultCharacter({
      classes: [{ name: 'Fighter', subclass: '', level: 1, hitDieSize: 10, hitDiceUsed: 0 }],
      abilities: { str: 10, dex: 14, con: 10, int: 10, wis: 10, cha: 10 },
    });
    expect(calcSkillBonus(c, 'acrobatics')).toBe(2); // DEX mod only
  });

  it('proficiency adds proficiency bonus', () => {
    const c = createDefaultCharacter({
      classes: [{ name: 'Fighter', subclass: '', level: 1, hitDieSize: 10, hitDiceUsed: 0 }],
      abilities: { str: 10, dex: 14, con: 10, int: 10, wis: 10, cha: 10 },
      skills: [{ name: 'acrobatics', proficient: true, expertise: false },
               ...(['animalHandling','arcana','athletics','deception','history','insight','intimidation',
                    'investigation','medicine','nature','perception','performance','persuasion','religion',
                    'sleightOfHand','stealth','survival'] as const).map(n => ({ name: n, proficient: false, expertise: false }))],
    });
    expect(calcSkillBonus(c, 'acrobatics')).toBe(4); // 2 (DEX) + 2 (prof)
  });

  it('expertise doubles proficiency bonus', () => {
    const c = createDefaultCharacter({
      classes: [{ name: 'Rogue', subclass: '', level: 1, hitDieSize: 8, hitDiceUsed: 0 }],
      abilities: { str: 10, dex: 14, con: 10, int: 10, wis: 10, cha: 10 },
      skills: [{ name: 'acrobatics', proficient: true, expertise: true },
               ...(['animalHandling','arcana','athletics','deception','history','insight','intimidation',
                    'investigation','medicine','nature','perception','performance','persuasion','religion',
                    'sleightOfHand','stealth','survival'] as const).map(n => ({ name: n, proficient: false, expertise: false }))],
    });
    expect(calcSkillBonus(c, 'acrobatics')).toBe(6); // 2 (DEX) + 2+2 (expertise)
  });
});

// ─── calcSavingThrow ────────────────────────────────────────────────────────
describe('calcSavingThrow', () => {
  it('no proficiency returns ability mod only', () => {
    const c = createDefaultCharacter({
      classes: [{ name: 'Fighter', subclass: '', level: 1, hitDieSize: 10, hitDiceUsed: 0 }],
      abilities: { str: 16, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      savingThrowProficiencies: [],
    });
    expect(calcSavingThrow(c, 'str')).toBe(3);
  });

  it('proficiency adds proficiency bonus', () => {
    const c = createDefaultCharacter({
      classes: [{ name: 'Fighter', subclass: '', level: 1, hitDieSize: 10, hitDiceUsed: 0 }],
      abilities: { str: 16, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      savingThrowProficiencies: ['str'],
    });
    expect(calcSavingThrow(c, 'str')).toBe(5); // 3 + 2
  });
});

// ─── calcSpellSaveDC ────────────────────────────────────────────────────────
describe('calcSpellSaveDC', () => {
  it('returns 0 when no spellcasting ability', () => {
    const c = createDefaultCharacter({ spellcastingAbility: '' });
    expect(calcSpellSaveDC(c)).toBe(0);
  });

  it('8 + prof + ability mod', () => {
    const c = createDefaultCharacter({
      classes: [{ name: 'Wizard', subclass: '', level: 1, hitDieSize: 6, hitDiceUsed: 0 }],
      abilities: { str: 10, dex: 10, con: 10, int: 16, wis: 10, cha: 10 },
      spellcastingAbility: 'int',
    });
    expect(calcSpellSaveDC(c)).toBe(13); // 8 + 2 (prof) + 3 (INT)
  });
});

// ─── passivePerception ──────────────────────────────────────────────────────
describe('passivePerception', () => {
  it('10 + perception bonus', () => {
    const c = createDefaultCharacter({
      classes: [{ name: 'Ranger', subclass: '', level: 1, hitDieSize: 10, hitDiceUsed: 0 }],
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 14, cha: 10 },
    });
    expect(passivePerception(c)).toBe(12); // 10 + 2 (WIS mod)
  });
});

// ─── parseDiceExpression ────────────────────────────────────────────────────
describe('parseDiceExpression', () => {
  it('parses 1d20', () => expect(parseDiceExpression('1d20')).toEqual({ count: 1, sides: 20, modifier: 0 }));
  it('parses d6 (no count)', () => expect(parseDiceExpression('d6')).toEqual({ count: 1, sides: 6, modifier: 0 }));
  it('parses 2d8+3', () => expect(parseDiceExpression('2d8+3')).toEqual({ count: 2, sides: 8, modifier: 3 }));
  it('parses 1d4-1', () => expect(parseDiceExpression('1d4-1')).toEqual({ count: 1, sides: 4, modifier: -1 }));
  it('returns null for invalid', () => expect(parseDiceExpression('invalid')).toBeNull());
  it('returns null for empty string', () => expect(parseDiceExpression('')).toBeNull());
});

// ─── rollDice ───────────────────────────────────────────────────────────────
describe('rollDice', () => {
  it('total is within valid range for 1d20', () => {
    const result = rollDice('1d20');
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeLessThanOrEqual(20);
  });

  it('total includes modifier', () => {
    // 1d1+5 always = 6
    const result = rollDice('1d1+5');
    expect(result.total).toBe(6);
  });

  it('returns invalid roll for bad expression', () => {
    const result = rollDice('notadice');
    expect(result.total).toBe(0);
    expect(result.label).toContain('Invalid');
  });

  it('result count matches dice count', () => {
    const result = rollDice('4d6');
    expect(result.results).toHaveLength(4);
  });
});
