import type { Character } from './types';

export interface ClassVisual {
  emoji: string;
  label: string;
}

const CLASS_VISUAL_MAP: Record<string, ClassVisual> = {
  Barbarian: { emoji: '🪓', label: 'Barbarian' },
  Bard:      { emoji: '🎵', label: 'Bard' },
  Cleric:    { emoji: '✨', label: 'Cleric' },
  Druid:     { emoji: '🌿', label: 'Druid' },
  Fighter:   { emoji: '⚔️', label: 'Fighter' },
  Monk:      { emoji: '👊', label: 'Monk' },
  Paladin:   { emoji: '🛡️', label: 'Paladin' },
  Ranger:    { emoji: '🏹', label: 'Ranger' },
  Rogue:     { emoji: '🗡️', label: 'Rogue' },
  Sorcerer:  { emoji: '⚡', label: 'Sorcerer' },
  Warlock:   { emoji: '🔮', label: 'Warlock' },
  Wizard:    { emoji: '🧙', label: 'Wizard' },
};

/** Fallback neutro — só usado quando nenhuma classe foi selecionada */
const NO_CLASS_FALLBACK: ClassVisual = { emoji: '🧙', label: '' };

/**
 * Retorna o visual canônico de um personagem.
 * - Se tiver portrait customizado (base64), retorna null (o caller deve renderizar a imagem)
 * - Se tiver classe selecionada, retorna o emoji da classe primária
 * - Se não tiver classe, retorna o fallback neutro (🧙)
 * Nunca retorna 🐉 quando uma classe já foi escolhida.
 */
export function getCharacterVisual(character: Character): ClassVisual | null {
  if (character.portrait?.startsWith('data:')) return null; // usar imagem
  const primaryClass = character.classes[0]?.name;
  if (primaryClass && CLASS_VISUAL_MAP[primaryClass]) {
    return CLASS_VISUAL_MAP[primaryClass];
  }
  // Classe customizada (não está no mapa) — usa inicial maiúscula como fallback
  if (primaryClass && primaryClass.trim() !== '') {
    return { emoji: primaryClass.trim()[0].toUpperCase(), label: primaryClass };
  }
  return NO_CLASS_FALLBACK;
}

/** Versão simples que retorna só o emoji — para uso em listas */
export function getClassEmoji(className: string): string {
  return CLASS_VISUAL_MAP[className]?.emoji ?? '🧙';
}
