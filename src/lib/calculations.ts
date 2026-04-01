import type { Character, AbilityName, SkillName, SKILL_ABILITY_MAP } from './types';
import { SKILL_ABILITY_MAP as skillMap } from './types';

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function totalLevel(char: Character): number {
  return char.classes.reduce((sum, c) => sum + c.level, 0);
}

export function proficiencyBonus(char: Character): number {
  const level = totalLevel(char);
  return Math.ceil(level / 4) + 1;
}

export function calcSavingThrow(char: Character, ability: AbilityName): number {
  const mod = abilityModifier(char.abilities[ability]);
  const prof = char.savingThrowProficiencies.includes(ability) ? proficiencyBonus(char) : 0;
  return mod + prof;
}

export function calcSkillBonus(char: Character, skill: SkillName): number {
  const ability = skillMap[skill];
  const mod = abilityModifier(char.abilities[ability]);
  const sp = char.skills.find(s => s.name === skill);
  if (!sp) return mod;
  let bonus = mod;
  if (sp.proficient) bonus += proficiencyBonus(char);
  if (sp.expertise) bonus += proficiencyBonus(char);
  return bonus;
}

export function passivePerception(char: Character): number {
  return 10 + calcSkillBonus(char, 'perception');
}

export function calcInitiative(char: Character): number {
  if (char.manualOverrides['initiative']) return char.initiative;
  return abilityModifier(char.abilities.dex);
}

export function calcArmorClass(char: Character): number {
  if (char.manualOverrides['armorClass']) return char.armorClass;
  return 10 + abilityModifier(char.abilities.dex);
}

export function calcHpMax(char: Character): number {
  if (char.manualOverrides['hpMax']) return char.hpMax;
  const conMod = abilityModifier(char.abilities.con);
  const lvl = totalLevel(char);
  if (char.classes.length === 0) return 10 + conMod;
  const primary = char.classes[0];
  const firstLevelHp = primary.hitDieSize + conMod;
  const avgPerLevel = Math.floor(primary.hitDieSize / 2) + 1 + conMod;
  return firstLevelHp + avgPerLevel * (lvl - 1);
}

export function calcSpellSaveDC(char: Character): number {
  if (!char.spellcastingAbility) return 0;
  return 8 + proficiencyBonus(char) + abilityModifier(char.abilities[char.spellcastingAbility]);
}

export function calcSpellAttackBonus(char: Character): number {
  if (!char.spellcastingAbility) return 0;
  return proficiencyBonus(char) + abilityModifier(char.abilities[char.spellcastingAbility]);
}

export function applyAutoCalculations(char: Character): Character {
  const updated = { ...char };
  if (!updated.manualOverrides['initiative']) {
    updated.initiative = calcInitiative(updated);
  }
  if (!updated.manualOverrides['armorClass']) {
    updated.armorClass = calcArmorClass(updated);
  }
  if (!updated.manualOverrides['hpMax']) {
    updated.hpMax = calcHpMax(updated);
  }
  return updated;
}

// Spell slots by class level (simplified - single class caster)
export function getSpellSlotsByLevel(casterLevel: number): Record<number, number> {
  const table: Record<number, number[]> = {
    1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2],
    6: [4, 3, 3], 7: [4, 3, 3, 1], 8: [4, 3, 3, 2], 9: [4, 3, 3, 3, 1],
    10: [4, 3, 3, 3, 2], 11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1],
    13: [4, 3, 3, 3, 2, 1, 1], 14: [4, 3, 3, 3, 2, 1, 1],
    15: [4, 3, 3, 3, 2, 1, 1, 1], 16: [4, 3, 3, 3, 2, 1, 1, 1],
    17: [4, 3, 3, 3, 2, 1, 1, 1, 1], 18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
    19: [4, 3, 3, 3, 3, 2, 1, 1, 1], 20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
  };
  const slots = table[casterLevel] || [];
  const result: Record<number, number> = {};
  slots.forEach((count, i) => { result[i + 1] = count; });
  return result;
}
