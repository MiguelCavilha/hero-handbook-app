import type { Character, AppMode } from '@/lib/types';
import { totalLevel, proficiencyBonus, abilityModifier, formatModifier } from '@/lib/calculations';
import { Camera } from 'lucide-react';
import { saveCharacterImage } from '@/lib/db';

interface Props {
  character: Character;
  updateCharacter: (updates: Partial<Character>) => void;
  mode: AppMode;
}

export function CharacterHeader({ character, updateCharacter, mode }: Props) {
  const level = totalLevel(character);
  const prof = proficiencyBonus(character);
  const hpPercent = character.hpMax > 0 ? (character.hpCurrent / character.hpMax) * 100 : 100;

  const handlePortraitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      updateCharacter({ portrait: dataUrl });
      await saveCharacterImage(character.id, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="px-4 py-4 border-b bg-card">
      <div className="flex items-start gap-4">
        {/* Portrait */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-secondary flex items-center justify-center text-3xl shrink-0 overflow-hidden group">
          {character.portrait?.startsWith('data:') ? (
            <img src={character.portrait} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>🐉</span>
          )}
          {mode === 'edit' && (
            <label className="absolute inset-0 flex items-center justify-center bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-5 h-5 text-background" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePortraitUpload} />
            </label>
          )}
        </div>

        {/* Name and class */}
        <div className="flex-1 min-w-0">
          {mode === 'edit' ? (
            <input
              value={character.name}
              onChange={e => updateCharacter({ name: e.target.value })}
              className="font-display text-xl font-bold bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none w-full"
            />
          ) : (
            <h2 className="font-display text-xl font-bold truncate">{character.name}</h2>
          )}
          <p className="text-sm text-muted-foreground truncate">
            {character.race}{character.subrace ? ` (${character.subrace})` : ''}
            {character.classes[0]?.name ? ` · ${character.classes.map(c => `${c.name} ${c.level}`).join(' / ')}` : ''}
          </p>
          <p className="text-xs text-muted-foreground">Level {level} · Prof. {formatModifier(prof)}</p>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-thin">
        {/* HP */}
        <div className="quick-stat min-w-[5rem]">
          <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">HP</span>
          {mode === 'session' ? (
            <div className="flex items-center gap-1">
              <button onClick={() => updateCharacter({ hpCurrent: Math.max(0, character.hpCurrent - 1) })}
                className="w-5 h-5 rounded bg-destructive/20 text-destructive text-xs font-bold">−</button>
              <span className="text-sm font-bold">{character.hpCurrent}/{character.hpMax}</span>
              <button onClick={() => updateCharacter({ hpCurrent: Math.min(character.hpMax, character.hpCurrent + 1) })}
                className="w-5 h-5 rounded bg-primary/20 text-primary text-xs font-bold">+</button>
            </div>
          ) : (
            <span className="text-sm font-bold">{character.hpCurrent}/{character.hpMax}</span>
          )}
          <div className="w-full h-1 rounded-full bg-secondary mt-1">
            <div className="h-full rounded-full transition-all" style={{
              width: `${hpPercent}%`,
              backgroundColor: hpPercent > 50 ? 'hsl(120, 40%, 45%)' : hpPercent > 25 ? 'hsl(40, 70%, 50%)' : 'hsl(0, 60%, 50%)',
            }} />
          </div>
        </div>

        <div className="quick-stat">
          <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">AC</span>
          <span className="text-lg font-bold">{character.armorClass}</span>
        </div>
        <div className="quick-stat">
          <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">Init</span>
          <span className="text-lg font-bold">{formatModifier(character.initiative)}</span>
        </div>
        <div className="quick-stat">
          <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">Speed</span>
          <span className="text-lg font-bold">{character.speed}</span>
        </div>
        {character.hpTemp > 0 && (
          <div className="quick-stat">
            <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">Temp</span>
            <span className="text-lg font-bold text-primary">{character.hpTemp}</span>
          </div>
        )}
      </div>
    </div>
  );
}
