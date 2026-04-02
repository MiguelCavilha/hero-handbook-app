// Hardcoded SRD data for offline use
// This can be replaced/augmented by API calls to dnd5eapi.co
import type { AbilityScores } from './types';

type RaceEntry = {
  name: string;
  speed: number;
  abilityBonuses: Partial<AbilityScores>;
  subraces: string[];
};

export const SRD_RACES: RaceEntry[] = [
  { name: 'Human', speed: 30, abilityBonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 }, subraces: [] },
  { name: 'Elf', speed: 30, abilityBonuses: { dex: 2 }, subraces: ['High Elf', 'Wood Elf', 'Dark Elf (Drow)'] },
  { name: 'Dwarf', speed: 25, abilityBonuses: { con: 2 }, subraces: ['Hill Dwarf', 'Mountain Dwarf'] },
  { name: 'Halfling', speed: 25, abilityBonuses: { dex: 2 }, subraces: ['Lightfoot', 'Stout'] },
  { name: 'Dragonborn', speed: 30, abilityBonuses: { str: 2, cha: 1 }, subraces: [] },
  { name: 'Gnome', speed: 25, abilityBonuses: { int: 2 }, subraces: ['Forest Gnome', 'Rock Gnome'] },
  { name: 'Half-Elf', speed: 30, abilityBonuses: { cha: 2 }, subraces: [] },
  { name: 'Half-Orc', speed: 30, abilityBonuses: { str: 2, con: 1 }, subraces: [] },
  { name: 'Tiefling', speed: 30, abilityBonuses: { cha: 2, int: 1 }, subraces: [] },
];

export const SRD_CLASSES = [
  { name: 'Barbarian', hitDie: 12, primaryAbility: 'str' as const, savingThrows: ['str', 'con'] as const, subclasses: ['Path of the Berserker'], spellcaster: false },
  { name: 'Bard', hitDie: 8, primaryAbility: 'cha' as const, savingThrows: ['dex', 'cha'] as const, subclasses: ['College of Lore'], spellcaster: true, spellcastingAbility: 'cha' as const },
  { name: 'Cleric', hitDie: 8, primaryAbility: 'wis' as const, savingThrows: ['wis', 'cha'] as const, subclasses: ['Life Domain'], spellcaster: true, spellcastingAbility: 'wis' as const },
  { name: 'Druid', hitDie: 8, primaryAbility: 'wis' as const, savingThrows: ['int', 'wis'] as const, subclasses: ['Circle of the Land'], spellcaster: true, spellcastingAbility: 'wis' as const },
  { name: 'Fighter', hitDie: 10, primaryAbility: 'str' as const, savingThrows: ['str', 'con'] as const, subclasses: ['Champion'], spellcaster: false },
  { name: 'Monk', hitDie: 8, primaryAbility: 'dex' as const, savingThrows: ['str', 'dex'] as const, subclasses: ['Way of the Open Hand'], spellcaster: false },
  { name: 'Paladin', hitDie: 10, primaryAbility: 'str' as const, savingThrows: ['wis', 'cha'] as const, subclasses: ['Oath of Devotion'], spellcaster: true, spellcastingAbility: 'cha' as const },
  { name: 'Ranger', hitDie: 10, primaryAbility: 'dex' as const, savingThrows: ['str', 'dex'] as const, subclasses: ['Hunter'], spellcaster: true, spellcastingAbility: 'wis' as const },
  { name: 'Rogue', hitDie: 8, primaryAbility: 'dex' as const, savingThrows: ['dex', 'int'] as const, subclasses: ['Thief'], spellcaster: false },
  { name: 'Sorcerer', hitDie: 6, primaryAbility: 'cha' as const, savingThrows: ['con', 'cha'] as const, subclasses: ['Draconic Bloodline'], spellcaster: true, spellcastingAbility: 'cha' as const },
  { name: 'Warlock', hitDie: 8, primaryAbility: 'cha' as const, savingThrows: ['wis', 'cha'] as const, subclasses: ['The Fiend'], spellcaster: true, spellcastingAbility: 'cha' as const },
  { name: 'Wizard', hitDie: 6, primaryAbility: 'int' as const, savingThrows: ['int', 'wis'] as const, subclasses: ['School of Evocation'], spellcaster: true, spellcastingAbility: 'int' as const },
];

export const SRD_BACKGROUNDS = [
  'Acolyte', 'Charlatan', 'Criminal', 'Entertainer', 'Folk Hero',
  'Guild Artisan', 'Hermit', 'Noble', 'Outlander', 'Sage',
  'Sailor', 'Soldier', 'Urchin',
];

export const SRD_ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

export const SRD_CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened',
  'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified',
  'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious',
];

export const SRD_LANGUAGES = [
  'Common', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish', 'Goblin',
  'Halfling', 'Orc', 'Abyssal', 'Celestial', 'Draconic', 'Deep Speech',
  'Infernal', 'Primordial', 'Sylvan', 'Undercommon',
];

export const DEFAULT_AVATARS = [
  { id: 'warrior', label: 'Warrior', emoji: '⚔️' },
  { id: 'mage', label: 'Mage', emoji: '🧙' },
  { id: 'rogue', label: 'Rogue', emoji: '🗡️' },
  { id: 'cleric', label: 'Cleric', emoji: '✨' },
  { id: 'ranger', label: 'Ranger', emoji: '🏹' },
  { id: 'bard', label: 'Bard', emoji: '🎵' },
  { id: 'druid', label: 'Druid', emoji: '🌿' },
  { id: 'paladin', label: 'Paladin', emoji: '🛡️' },
  { id: 'monk', label: 'Monk', emoji: '👊' },
  { id: 'warlock', label: 'Warlock', emoji: '🔮' },
  { id: 'sorcerer', label: 'Sorcerer', emoji: '⚡' },
  { id: 'barbarian', label: 'Barbarian', emoji: '🪓' },
];
