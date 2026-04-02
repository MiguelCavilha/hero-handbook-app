import type { Character, AppMode } from '@/lib/types';
import { totalLevel, proficiencyBonus, formatModifier } from '@/lib/calculations';
import { Camera } from 'lucide-react';
import { usePortraitUpload } from '@/hooks/usePortraitUpload';
import { useI18n } from '@/lib/i18n';
import { translateApiTerm } from '@/lib/i18n/api-translation';
import { getCharacterVisual } from '@/lib/character-visual';

interface Props {
  character: Character;
  updateCharacter: (updates: Partial<Character>) => void;
  mode: AppMode;
}

export function CharacterHeader({ character, updateCharacter, mode }: Props) {
  const { t } = useI18n();
  const level = totalLevel(character);
  const prof = proficiencyBonus(character);
  const hpPercent = character.hpMax > 0 ? Math.min(100, (character.hpCurrent / character.hpMax) * 100) : 100;
  const { handleUpload } = usePortraitUpload(character.id, updateCharacter);
  const visual = getCharacterVisual(character);

  const raceLabel = translateApiTerm(t, 'races', character.race);
  const subraceLabel = character.subrace ? translateApiTerm(t, 'subraces', character.subrace) : '';
  const classLabel = character.classes.length
    ? character.classes
        .map(cls => {
          const clsName = translateApiTerm(t, 'classes', cls.name);
          const sub = cls.subclass ? ` (${translateApiTerm(t, 'subclasses', cls.subclass)})` : '';
          return `${clsName}${sub} ${cls.level}`;
        })
        .join(' / ')
    : '';

  const hpColor = hpPercent > 60
    ? 'hsl(142, 45%, 42%)'
    : hpPercent > 30
    ? 'hsl(38, 80%, 48%)'
    : 'hsl(4, 68%, 52%)';

  return (
    <div className="px-4 py-4 border-b" style={{ background: 'hsl(var(--card))' }}>
      <div className="flex items-start gap-4">
        {/* Portrait */}
        <div
          className="relative shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-3xl group"
          style={{
            width: '4.5rem', height: '4.5rem',
            background: 'hsl(var(--secondary))',
            border: '2px solid hsl(var(--border))',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {character.portrait?.startsWith('data:') ? (
            <img src={character.portrait} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="select-none text-3xl">{visual?.emoji}</span>
          )}
          {mode === 'edit' && (
            <label className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150"
              style={{ background: 'hsl(var(--foreground) / 0.55)' }}>
              <Camera className="w-5 h-5" style={{ color: 'hsl(var(--background))' }} />
              <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
            </label>
          )}
        </div>

        {/* Name and info */}
        <div className="flex-1 min-w-0 pt-0.5">
          {mode === 'edit' ? (
            <input
              value={character.name}
              onChange={e => updateCharacter({ name: e.target.value })}
              className="font-display text-xl font-bold bg-transparent w-full outline-none
                         border-b border-transparent hover:border-border focus:border-primary
                         transition-colors duration-150 pb-0.5"
              aria-label="Character name"
            />
          ) : (
            <h2 className="font-display text-xl font-bold truncate">{character.name}</h2>
          )}
          <p className="text-xs text-muted-foreground truncate mt-1">
            {raceLabel}{subraceLabel ? ` (${subraceLabel})` : ''}
            {classLabel ? ` · ${classLabel}` : ''}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--gold))' }}>
            Level {level} · Prof. {formatModifier(prof)}
          </p>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-thin pb-0.5">
        {/* HP — wider with bar */}
        <div className="quick-stat min-w-[5.5rem]">
          <span className="stat-label">HP</span>
          {mode === 'session' ? (
            <div className="flex items-center gap-1 my-0.5">
              <button
                onClick={() => updateCharacter({ hpCurrent: Math.max(0, character.hpCurrent - 1) })}
                className="w-5 h-5 rounded-md text-xs font-bold transition-colors active:scale-90"
                style={{ background: 'hsl(var(--destructive) / 0.15)', color: 'hsl(var(--destructive))' }}
                aria-label="Decrease HP"
              >−</button>
              <span className="text-sm font-bold tabular-nums">{character.hpCurrent}/{character.hpMax}</span>
              <button
                onClick={() => updateCharacter({ hpCurrent: Math.min(character.hpMax, character.hpCurrent + 1) })}
                className="w-5 h-5 rounded-md text-xs font-bold transition-colors active:scale-90"
                style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}
                aria-label="Increase HP"
              >+</button>
            </div>
          ) : (
            <span className="text-sm font-bold tabular-nums my-0.5">{character.hpCurrent}/{character.hpMax}</span>
          )}
          <div className="hp-bar-track w-full mt-1">
            <div
              className="hp-bar-fill"
              style={{ width: `${hpPercent}%`, background: hpColor }}
              role="progressbar"
              aria-valuenow={character.hpCurrent}
              aria-valuemax={character.hpMax}
            />
          </div>
        </div>

        <div className="quick-stat">
          <span className="stat-label">AC</span>
          <span className="text-lg font-bold leading-none mt-1">{character.armorClass}</span>
        </div>
        <div className="quick-stat">
          <span className="stat-label">Init</span>
          <span className="text-lg font-bold leading-none mt-1">{formatModifier(character.initiative)}</span>
        </div>
        <div className="quick-stat">
          <span className="stat-label">Speed</span>
          <span className="text-lg font-bold leading-none mt-1">{character.speed}</span>
        </div>
        {character.hpTemp > 0 && (
          <div className="quick-stat" style={{ borderColor: 'hsl(var(--arcane) / 0.4)' }}>
            <span className="stat-label">Temp</span>
            <span className="text-lg font-bold leading-none mt-1 text-arcane">{character.hpTemp}</span>
          </div>
        )}
      </div>
    </div>
  );
}
