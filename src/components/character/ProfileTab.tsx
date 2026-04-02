import { useState } from 'react';
import type { Character, AppMode } from '@/lib/types';
import { SRD_RACES, SRD_CLASSES, SRD_BACKGROUNDS, SRD_ALIGNMENTS } from '@/lib/srd-data';
import { Camera } from 'lucide-react';
import { usePortraitUpload } from '@/hooks/usePortraitUpload';
import { useI18n } from '@/lib/i18n';

interface Props {
  character: Character;
  updateCharacter: (updates: Partial<Character> | ((prev: Character) => Character)) => void;
  mode: AppMode;
}

export function ProfileTab({ character, updateCharacter, mode }: Props) {
  const { t } = useI18n();
  const { handleUpload } = usePortraitUpload(character.id, updateCharacter);

  if (mode === 'session') {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex gap-4 items-start">
          <div className="w-24 h-24 rounded-xl bg-secondary flex items-center justify-center text-4xl overflow-hidden">
            {character.portrait?.startsWith('data:') ? <img src={character.portrait} alt="" className="w-full h-full object-cover" /> : <span>🐉</span>}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">{character.name}</h2>
            <p className="text-sm text-muted-foreground">{character.race}{character.subrace ? ` (${character.subrace})` : ''}</p>
            <p className="text-sm text-muted-foreground">{character.classes.map(c => `${c.name} ${c.level}`).join(' / ')}</p>
            <p className="text-sm text-muted-foreground">{character.background} · {character.alignment}</p>
          </div>
        </div>
        {character.personalityTraits && <ReadonlyBlock title={t.personalityTraits} text={character.personalityTraits} />}
        {character.ideals && <ReadonlyBlock title={t.ideals} text={character.ideals} />}
        {character.bonds && <ReadonlyBlock title={t.bonds} text={character.bonds} />}
        {character.flaws && <ReadonlyBlock title={t.flaws} text={character.flaws} />}
        {character.backstory && <ReadonlyBlock title={t.backstory} text={character.backstory} />}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <section>
        <h3 className="section-title">{t.portrait}</h3>
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 rounded-xl bg-secondary flex items-center justify-center text-4xl overflow-hidden group">
            {character.portrait?.startsWith('data:') ? <img src={character.portrait} alt="" className="w-full h-full object-cover" /> : <span>🐉</span>}
            <label className="absolute inset-0 flex items-center justify-center bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-background" />
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>{t.uploadPortrait}</p>
            {character.portrait && <button onClick={() => updateCharacter({ portrait: null })} className="text-destructive hover:underline text-xs mt-1">{t.removePortrait}</button>}
          </div>
        </div>
      </section>

      <section>
        <h3 className="section-title">{t.identity}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t.characterName} value={character.name} onChange={name => updateCharacter({ name })} />
          <Field label={t.playerName} value={character.playerName} onChange={playerName => updateCharacter({ playerName })} />
          <SelectField label={t.race} value={character.race} onChange={race => updateCharacter({ race })} options={SRD_RACES.map(r => r.name)} allowCustom />
          <Field label={t.subrace} value={character.subrace} onChange={subrace => updateCharacter({ subrace })} />
          <SelectField label={t.background} value={character.background} onChange={background => updateCharacter({ background })} options={SRD_BACKGROUNDS} allowCustom />
          <SelectField label={t.alignment} value={character.alignment} onChange={alignment => updateCharacter({ alignment })} options={SRD_ALIGNMENTS} placeholder={t.selectOption} />
        </div>
      </section>

      <section>
        <h3 className="section-title">{t.classLabel}</h3>
        {character.classes.map((cls, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 mb-2">
            <SelectField label={t.classLabel} value={cls.name} onChange={name => {
              const classData = SRD_CLASSES.find(c => c.name === name);
              updateCharacter(prev => ({ ...prev, classes: prev.classes.map((c, j) => j === i ? { ...c, name, hitDieSize: classData?.hitDie ?? c.hitDieSize } : c) }));
            }} options={SRD_CLASSES.map(c => c.name)} allowCustom />
            <Field label={t.subclass} value={cls.subclass} onChange={subclass => updateCharacter(prev => ({ ...prev, classes: prev.classes.map((c, j) => j === i ? { ...c, subclass } : c) }))} />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t.levelLabel}</label>
              <input type="number" value={cls.level} min={1} max={20}
                onChange={e => updateCharacter(prev => ({ ...prev, classes: prev.classes.map((c, j) => j === i ? { ...c, level: parseInt(e.target.value) || 1 } : c) }))}
                className="w-full px-2 py-1.5 text-sm border rounded bg-background" />
            </div>
          </div>
        ))}
        <button onClick={() => updateCharacter(prev => ({ ...prev, classes: [...prev.classes, { name: '', subclass: '', level: 1, hitDieSize: 8, hitDiceUsed: 0 }] }))} className="text-xs text-primary hover:underline">{t.addMulticlass}</button>
      </section>

      <section>
        <h3 className="section-title">{t.appearance}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label={t.age} value={character.age} onChange={age => updateCharacter({ age })} />
          <Field label={t.height} value={character.height} onChange={height => updateCharacter({ height })} />
          <Field label={t.weightLabel} value={character.weight} onChange={weight => updateCharacter({ weight })} />
          <Field label={t.eyes} value={character.eyes} onChange={eyes => updateCharacter({ eyes })} />
          <Field label={t.skin} value={character.skin} onChange={skin => updateCharacter({ skin })} />
          <Field label={t.hair} value={character.hair} onChange={hair => updateCharacter({ hair })} />
        </div>
        <div className="mt-3"><FieldArea label={t.appearanceNotes} value={character.appearanceNotes} onChange={appearanceNotes => updateCharacter({ appearanceNotes })} /></div>
      </section>

      <section>
        <h3 className="section-title">{t.otherDetails}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t.deity} value={character.deity} onChange={deity => updateCharacter({ deity })} />
          <Field label={t.faction} value={character.faction} onChange={faction => updateCharacter({ faction })} />
          <Field label={t.experience} value={String(character.experience)} onChange={v => updateCharacter({ experience: parseInt(v) || 0 })} />
        </div>
      </section>

      <section>
        <h3 className="section-title">{t.personalityBackground}</h3>
        <div className="space-y-3">
          <FieldArea label={t.personalityTraits} value={character.personalityTraits} onChange={personalityTraits => updateCharacter({ personalityTraits })} />
          <FieldArea label={t.ideals} value={character.ideals} onChange={ideals => updateCharacter({ ideals })} />
          <FieldArea label={t.bonds} value={character.bonds} onChange={bonds => updateCharacter({ bonds })} />
          <FieldArea label={t.flaws} value={character.flaws} onChange={flaws => updateCharacter({ flaws })} />
          <FieldArea label={t.backstory} value={character.backstory} onChange={backstory => updateCharacter({ backstory })} rows={6} />
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} className="w-full px-2 py-1.5 text-sm border rounded bg-background" />
    </div>
  );
}

function FieldArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className="w-full px-2 py-1.5 text-sm border rounded bg-background resize-none" />
    </div>
  );
}

function SelectField({ label, value, onChange, options, allowCustom, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: string[]; allowCustom?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      {allowCustom ? (
        <input value={value} onChange={e => onChange(e.target.value)} list={`${label}-opts`} className="w-full px-2 py-1.5 text-sm border rounded bg-background" />
      ) : (
        <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-2 py-1.5 text-sm border rounded bg-background">
          <option value="">{placeholder ?? '—'}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {allowCustom && <datalist id={`${label}-opts`}>{options.map(o => <option key={o} value={o} />)}</datalist>}
    </div>
  );
}

function ReadonlyBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="border rounded-lg p-3 bg-card">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{title}</h4>
      <p className="text-sm whitespace-pre-wrap">{text}</p>
    </div>
  );
}
