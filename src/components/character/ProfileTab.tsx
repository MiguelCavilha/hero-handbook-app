import { useState } from 'react';
import type { Character, AppMode } from '@/lib/types';
import { SRD_RACES, SRD_CLASSES, SRD_BACKGROUNDS, SRD_ALIGNMENTS } from '@/lib/srd-data';
import { ABILITY_NAMES } from '@/lib/types';
import { Camera } from 'lucide-react';
import { saveCharacterImage } from '@/lib/db';

interface Props {
  character: Character;
  updateCharacter: (updates: Partial<Character> | ((prev: Character) => Character)) => void;
  mode: AppMode;
}

export function ProfileTab({ character, updateCharacter, mode }: Props) {
  const handlePortraitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be smaller than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      updateCharacter({ portrait: dataUrl });
      await saveCharacterImage(character.id, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  if (mode === 'session') {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex gap-4 items-start">
          <div className="w-24 h-24 rounded-xl bg-secondary flex items-center justify-center text-4xl overflow-hidden">
            {character.portrait?.startsWith('data:') ? (
              <img src={character.portrait} alt="" className="w-full h-full object-cover" />
            ) : <span>🐉</span>}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">{character.name}</h2>
            <p className="text-sm text-muted-foreground">{character.race}{character.subrace ? ` (${character.subrace})` : ''}</p>
            <p className="text-sm text-muted-foreground">{character.classes.map(c => `${c.name} ${c.level}`).join(' / ')}</p>
            <p className="text-sm text-muted-foreground">{character.background} · {character.alignment}</p>
          </div>
        </div>
        {character.personalityTraits && <ReadonlyBlock title="Personality" text={character.personalityTraits} />}
        {character.ideals && <ReadonlyBlock title="Ideals" text={character.ideals} />}
        {character.bonds && <ReadonlyBlock title="Bonds" text={character.bonds} />}
        {character.flaws && <ReadonlyBlock title="Flaws" text={character.flaws} />}
        {character.backstory && <ReadonlyBlock title="Backstory" text={character.backstory} />}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Portrait */}
      <section>
        <h3 className="section-title">Portrait</h3>
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 rounded-xl bg-secondary flex items-center justify-center text-4xl overflow-hidden group">
            {character.portrait?.startsWith('data:') ? (
              <img src={character.portrait} alt="" className="w-full h-full object-cover" />
            ) : <span>🐉</span>}
            <label className="absolute inset-0 flex items-center justify-center bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-background" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePortraitUpload} />
            </label>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Upload an image for your character portrait.</p>
            {character.portrait && (
              <button onClick={() => updateCharacter({ portrait: null })} className="text-destructive hover:underline text-xs mt-1">Remove portrait</button>
            )}
          </div>
        </div>
      </section>

      {/* Identity */}
      <section>
        <h3 className="section-title">Identity</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Character Name" value={character.name} onChange={name => updateCharacter({ name })} />
          <Field label="Player Name" value={character.playerName} onChange={playerName => updateCharacter({ playerName })} />
          <SelectField label="Race" value={character.race} onChange={race => updateCharacter({ race })}
            options={SRD_RACES.map(r => r.name)} allowCustom />
          <Field label="Subrace" value={character.subrace} onChange={subrace => updateCharacter({ subrace })} />
          <SelectField label="Background" value={character.background} onChange={background => updateCharacter({ background })}
            options={SRD_BACKGROUNDS} allowCustom />
          <SelectField label="Alignment" value={character.alignment} onChange={alignment => updateCharacter({ alignment })}
            options={SRD_ALIGNMENTS} />
        </div>
      </section>

      {/* Class */}
      <section>
        <h3 className="section-title">Class</h3>
        {character.classes.map((cls, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 mb-2">
            <SelectField label="Class" value={cls.name} onChange={name => {
              updateCharacter(prev => ({
                ...prev,
                classes: prev.classes.map((c, j) => j === i ? { ...c, name } : c),
              }));
            }} options={SRD_CLASSES.map(c => c.name)} allowCustom />
            <Field label="Subclass" value={cls.subclass} onChange={subclass => {
              updateCharacter(prev => ({
                ...prev,
                classes: prev.classes.map((c, j) => j === i ? { ...c, subclass } : c),
              }));
            }} />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Level</label>
              <input type="number" value={cls.level} min={1} max={20}
                onChange={e => updateCharacter(prev => ({
                  ...prev,
                  classes: prev.classes.map((c, j) => j === i ? { ...c, level: parseInt(e.target.value) || 1 } : c),
                }))}
                className="w-full px-2 py-1.5 text-sm border rounded bg-background" />
            </div>
          </div>
        ))}
        <button onClick={() => updateCharacter(prev => ({
          ...prev,
          classes: [...prev.classes, { name: '', subclass: '', level: 1, hitDieSize: 8, hitDiceUsed: 0 }],
        }))} className="text-xs text-primary hover:underline">+ Add multiclass</button>
      </section>

      {/* Appearance */}
      <section>
        <h3 className="section-title">Appearance</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Age" value={character.age} onChange={age => updateCharacter({ age })} />
          <Field label="Height" value={character.height} onChange={height => updateCharacter({ height })} />
          <Field label="Weight" value={character.weight} onChange={weight => updateCharacter({ weight })} />
          <Field label="Eyes" value={character.eyes} onChange={eyes => updateCharacter({ eyes })} />
          <Field label="Skin" value={character.skin} onChange={skin => updateCharacter({ skin })} />
          <Field label="Hair" value={character.hair} onChange={hair => updateCharacter({ hair })} />
        </div>
        <div className="mt-3">
          <FieldArea label="Appearance Notes" value={character.appearanceNotes} onChange={appearanceNotes => updateCharacter({ appearanceNotes })} />
        </div>
      </section>

      {/* Other */}
      <section>
        <h3 className="section-title">Other Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Deity" value={character.deity} onChange={deity => updateCharacter({ deity })} />
          <Field label="Faction" value={character.faction} onChange={faction => updateCharacter({ faction })} />
          <Field label="Experience" value={String(character.experience)} onChange={v => updateCharacter({ experience: parseInt(v) || 0 })} />
        </div>
      </section>

      {/* Personality */}
      <section>
        <h3 className="section-title">Personality & Background</h3>
        <div className="space-y-3">
          <FieldArea label="Personality Traits" value={character.personalityTraits} onChange={personalityTraits => updateCharacter({ personalityTraits })} />
          <FieldArea label="Ideals" value={character.ideals} onChange={ideals => updateCharacter({ ideals })} />
          <FieldArea label="Bonds" value={character.bonds} onChange={bonds => updateCharacter({ bonds })} />
          <FieldArea label="Flaws" value={character.flaws} onChange={flaws => updateCharacter({ flaws })} />
          <FieldArea label="Backstory" value={character.backstory} onChange={backstory => updateCharacter({ backstory })} rows={6} />
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
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
        className="w-full px-2 py-1.5 text-sm border rounded bg-background resize-none" />
    </div>
  );
}

function SelectField({ label, value, onChange, options, allowCustom }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; allowCustom?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      {allowCustom ? (
        <input value={value} onChange={e => onChange(e.target.value)} list={`${label}-options`}
          className="w-full px-2 py-1.5 text-sm border rounded bg-background" />
      ) : (
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border rounded bg-background">
          <option value="">Select...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {allowCustom && (
        <datalist id={`${label}-options`}>
          {options.map(o => <option key={o} value={o} />)}
        </datalist>
      )}
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
