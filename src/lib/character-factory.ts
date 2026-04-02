import type { Character, SkillName, SkillProficiency } from './types';
import { getNextLevelFromXp } from './calculations';

const ALL_SKILLS: SkillName[] = [
  'acrobatics', 'animalHandling', 'arcana', 'athletics', 'deception',
  'history', 'insight', 'intimidation', 'investigation', 'medicine',
  'nature', 'perception', 'performance', 'persuasion', 'religion',
  'sleightOfHand', 'stealth', 'survival',
];

export function createDefaultCharacter(partial?: Partial<Character>): Character {
  const skills: SkillProficiency[] = ALL_SKILLS.map(name => ({
    name, proficient: false, expertise: false,
  }));

  const xpLevel = partial?.experience ? getNextLevelFromXp(partial.experience) : 1;
  const defaultClassLevel = Math.max(1, Math.min(20, xpLevel));

  return {
    id: crypto.randomUUID(),
    name: 'New Character',
    playerName: '',
    portrait: null,
    race: '',
    subrace: '',
    classes: partial?.classes?.length
      ? partial.classes.map(cls => ({ ...cls, level: Math.max(1, Math.min(20, cls.level)) }))
      : [{ name: '', subclass: '', level: defaultClassLevel, hitDieSize: 8, hitDiceUsed: 0 }],
    background: '',
    alignment: '',
    experience: 0,
    age: '', height: '', weight: '', eyes: '', skin: '', hair: '',
    deity: '', faction: '', appearanceNotes: '',
    personalityTraits: '', ideals: '', bonds: '', flaws: '', backstory: '',

    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    skills,
    savingThrowProficiencies: [],
    languages: ['Common'],
    toolProficiencies: [],

    armorClass: 10,
    initiative: 0,
    speed: 30,
    hpMax: 10,
    hpCurrent: 10,
    hpTemp: 0,
    deathSaves: { successes: 0, failures: 0 },

    weapons: [],
    conditions: [],
    resources: [],
    features: [],
    feats: [],

    spellcastingAbility: '',
    spells: [],
    spellSlots: {},

    inventory: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },

    resistances: [],
    immunities: [],
    vulnerabilities: [],
    senses: [],

    notes: '',
    journal: [],

    manualOverrides: {},
    pinnedItems: [],

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}
