import type { Character, AbilityName, AppMode } from '@/lib/types';
import { ABILITY_NAMES, ABILITY_LABELS, SKILL_LABELS, SKILL_ABILITY_MAP } from '@/lib/types';
import { abilityModifier, formatModifier, proficiencyBonus, calcSavingThrow, calcSkillBonus, passivePerception } from '@/lib/calculations';
import { useI18n } from '@/lib/i18n';

interface Props {
  character: Character;
  updateCharacter: (updates: Partial<Character> | ((prev: Character) => Character)) => void;
  mode: AppMode;
}

const STAT_COLORS: Record<AbilityName, string> = {
  str: 'border-stat-str/50 bg-stat-str/5',
  dex: 'border-stat-dex/50 bg-stat-dex/5',
  con: 'border-stat-con/50 bg-stat-con/5',
  int: 'border-stat-int/50 bg-stat-int/5',
  wis: 'border-stat-wis/50 bg-stat-wis/5',
  cha: 'border-stat-cha/50 bg-stat-cha/5',
};

export function StatsTab({ character, updateCharacter, mode }: Props) {
  const { t } = useI18n();
  const prof = proficiencyBonus(character);

  const setAbility = (ability: AbilityName, value: number) => {
    updateCharacter(prev => ({
      ...prev,
      abilities: { ...prev.abilities, [ability]: Math.max(1, Math.min(30, value)) },
    }));
  };

  const toggleSkillProficiency = (skillName: string) => {
    updateCharacter(prev => ({
      ...prev,
      skills: prev.skills.map(s => s.name === skillName ? { ...s, proficient: !s.proficient } : s),
    }));
  };

  const toggleSkillExpertise = (skillName: string) => {
    updateCharacter(prev => ({
      ...prev,
      skills: prev.skills.map(s => s.name === skillName ? { ...s, expertise: !s.expertise } : s),
    }));
  };

  const toggleSaveProficiency = (ability: AbilityName) => {
    updateCharacter(prev => ({
      ...prev,
      savingThrowProficiencies: prev.savingThrowProficiencies.includes(ability)
        ? prev.savingThrowProficiencies.filter(a => a !== ability)
        : [...prev.savingThrowProficiencies, ability],
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section>
        <h3 className="section-title">{t.abilityScores}</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ABILITY_NAMES.map(ab => {
            const mod = abilityModifier(character.abilities[ab]);
            return (
              <div key={ab} className={`stat-block ${STAT_COLORS[ab]}`}>
                <span className="stat-label">{ABILITY_LABELS[ab].slice(0, 3)}</span>
                {mode === 'edit' ? (
                  <input type="number" value={character.abilities[ab]}
                    onChange={e => setAbility(ab, parseInt(e.target.value) || 10)}
                    className="stat-value w-12 text-center bg-transparent outline-none" />
                ) : (
                  <span className="stat-value">{character.abilities[ab]}</span>
                )}
                <span className="stat-modifier text-muted-foreground">{formatModifier(mod)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="section-title">{t.savingThrows}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
          {ABILITY_NAMES.map(ab => {
            const isProficient = character.savingThrowProficiencies.includes(ab);
            const bonus = calcSavingThrow(character, ab);
            return (
              <div key={ab} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-secondary/50">
                {mode === 'edit' && (
                  <button onClick={() => toggleSaveProficiency(ab)}
                    className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${isProficient ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                )}
                <span className="text-sm flex-1">{ABILITY_LABELS[ab]}</span>
                <span className="text-sm font-semibold">{formatModifier(bonus)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="section-title">{t.skills}</h3>
        <div className="space-y-0.5">
          {character.skills.map(skill => {
            const bonus = calcSkillBonus(character, skill.name);
            const abilityLabel = SKILL_ABILITY_MAP[skill.name].toUpperCase();
            return (
              <div key={skill.name} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-secondary/50">
                {mode === 'edit' && (
                  <div className="flex gap-1">
                    <button onClick={() => toggleSkillProficiency(skill.name)}
                      className={`w-3 h-3 rounded-full border-2 shrink-0 ${skill.proficient ? 'bg-primary border-primary' : 'border-muted-foreground'}`}
                      title={t.proficiency} />
                    <button onClick={() => toggleSkillExpertise(skill.name)}
                      className={`w-3 h-3 rounded-sm border-2 shrink-0 ${skill.expertise ? 'bg-gold border-gold' : 'border-muted-foreground/30'}`}
                      title="Expertise" />
                  </div>
                )}
                <span className="text-sm flex-1">
                  {SKILL_LABELS[skill.name]}
                  <span className="text-xs text-muted-foreground ml-1">({abilityLabel})</span>
                </span>
                <span className="text-sm font-semibold">{formatModifier(bonus)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="section-title">{t.passiveScores}</h3>
        <div className="flex gap-3">
          <div className="quick-stat">
            <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">{t.passivePerception}</span>
            <span className="text-lg font-bold">{passivePerception(character)}</span>
          </div>
          <div className="quick-stat">
            <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">{t.proficiency}</span>
            <span className="text-lg font-bold">{formatModifier(prof)}</span>
          </div>
        </div>
      </section>

      {mode === 'edit' && (
        <>
          <EditableList title={t.languages} placeholder={t.addLanguage} items={character.languages} onChange={languages => updateCharacter({ languages })} />
          <EditableList title={t.toolProficiencies} placeholder={t.addTool} items={character.toolProficiencies} onChange={toolProficiencies => updateCharacter({ toolProficiencies })} />
        </>
      )}
      {mode === 'session' && character.languages.length > 0 && (
        <section>
          <h3 className="section-title">{t.languages}</h3>
          <div className="flex flex-wrap gap-1">{character.languages.map(l => <span key={l} className="px-2 py-0.5 rounded bg-secondary text-xs">{l}</span>)}</div>
        </section>
      )}
    </div>
  );
}

function EditableList({ title, placeholder, items, onChange }: { title: string; placeholder: string; items: string[]; onChange: (items: string[]) => void }) {
  return (
    <section>
      <h3 className="section-title">{title}</h3>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((item, i) => (
          <span key={i} className="px-2 py-0.5 rounded bg-secondary text-xs flex items-center gap-1">
            {item}
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">×</button>
          </span>
        ))}
      </div>
      <input placeholder={placeholder} className="px-2 py-1 text-xs border rounded bg-background w-full sm:w-48"
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
            onChange([...items, (e.target as HTMLInputElement).value.trim()]);
            (e.target as HTMLInputElement).value = '';
          }
        }} />
    </section>
  );
}
