export type AbilityName = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export const ABILITY_NAMES: AbilityName[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const ABILITY_LABELS: Record<AbilityName, string> = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
};

export type SkillName =
  | 'acrobatics' | 'animalHandling' | 'arcana' | 'athletics'
  | 'deception' | 'history' | 'insight' | 'intimidation'
  | 'investigation' | 'medicine' | 'nature' | 'perception'
  | 'performance' | 'persuasion' | 'religion' | 'sleightOfHand'
  | 'stealth' | 'survival';

export const SKILL_ABILITY_MAP: Record<SkillName, AbilityName> = {
  acrobatics: 'dex', animalHandling: 'wis', arcana: 'int', athletics: 'str',
  deception: 'cha', history: 'int', insight: 'wis', intimidation: 'cha',
  investigation: 'int', medicine: 'wis', nature: 'int', perception: 'wis',
  performance: 'cha', persuasion: 'cha', religion: 'int', sleightOfHand: 'dex',
  stealth: 'dex', survival: 'wis',
};

export const SKILL_LABELS: Record<SkillName, string> = {
  acrobatics: 'Acrobatics', animalHandling: 'Animal Handling', arcana: 'Arcana',
  athletics: 'Athletics', deception: 'Deception', history: 'History',
  insight: 'Insight', intimidation: 'Intimidation', investigation: 'Investigation',
  medicine: 'Medicine', nature: 'Nature', perception: 'Perception',
  performance: 'Performance', persuasion: 'Persuasion', religion: 'Religion',
  sleightOfHand: 'Sleight of Hand', stealth: 'Stealth', survival: 'Survival',
};

export interface AbilityScores {
  str: number; dex: number; con: number;
  int: number; wis: number; cha: number;
}

export interface SkillProficiency {
  name: SkillName;
  proficient: boolean;
  expertise: boolean;
}

export interface Weapon {
  id: string;
  name: string;
  attackBonus: number;
  damage: string;
  damageType: string;
  properties: string;
  isFavorite: boolean;
}

export interface SpellEntry {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  isPrepared: boolean;
  isFavorite: boolean;
  isRitual: boolean;
  isConcentration: boolean;
  source: 'srd' | 'custom';
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  description: string;
  isEquipped: boolean;
  isAttuned: boolean;
  isMagical: boolean;
  isFavorite: boolean;
}

export interface Currency {
  cp: number; sp: number; ep: number; gp: number; pp: number;
}

export interface Feature {
  id: string;
  name: string;
  source: string; // "Race", "Class", "Subclass", "Feat", "Background"
  level: number;
  description: string;
  usesMax: number;
  usesCurrent: number;
  rechargeOn: 'short' | 'long' | 'none';
}

export interface Resource {
  id: string;
  name: string;
  current: number;
  max: number;
  rechargeOn: 'short' | 'long' | 'none';
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface CharacterClass {
  name: string;
  subclass: string;
  level: number;
  hitDieSize: number;
  hitDiceUsed: number;
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

export interface SpellSlots {
  [level: number]: { max: number; used: number };
}

export interface ManualOverride {
  field: string;
  value: any;
}

export interface Character {
  id: string;
  name: string;
  playerName: string;
  portrait: string | null; // stored as base64 data URL or avatar key
  race: string;
  subrace: string;
  classes: CharacterClass[];
  background: string;
  alignment: string;
  experience: number;
  age: string;
  height: string;
  weight: string;
  eyes: string;
  skin: string;
  hair: string;
  deity: string;
  faction: string;
  appearanceNotes: string;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  backstory: string;

  abilities: AbilityScores;
  skills: SkillProficiency[];
  savingThrowProficiencies: AbilityName[];
  languages: string[];
  toolProficiencies: string[];

  armorClass: number;
  initiative: number;
  speed: number;
  hpMax: number;
  hpCurrent: number;
  hpTemp: number;
  deathSaves: DeathSaves;

  weapons: Weapon[];
  conditions: string[];
  resources: Resource[];
  features: Feature[];
  feats: string[];

  spellcastingAbility: AbilityName | '';
  spells: SpellEntry[];
  spellSlots: SpellSlots;

  inventory: InventoryItem[];
  currency: Currency;

  resistances: string[];
  immunities: string[];
  vulnerabilities: string[];
  senses: string[];

  notes: string;
  journal: JournalEntry[];

  manualOverrides: Record<string, boolean>; // field -> isManuallyOverridden
  pinnedItems: string[]; // IDs of pinned spells/items/weapons

  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  lastCharacterId: string | null;
  sessionMode: boolean;
}

export interface DiceRoll {
  id: string;
  expression: string;
  results: number[];
  total: number;
  timestamp: string;
  label?: string;
}

export type AppMode = 'edit' | 'session';
