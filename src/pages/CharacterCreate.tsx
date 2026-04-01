import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDefaultCharacter } from '@/lib/character-factory';
import { saveCharacter } from '@/lib/db';
import { SRD_RACES, SRD_CLASSES, SRD_BACKGROUNDS, SRD_ALIGNMENTS } from '@/lib/srd-data';
import type { AbilityName, AbilityScores } from '@/lib/types';
import { ABILITY_LABELS, ABILITY_NAMES } from '@/lib/types';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

const STEPS = ['Basics', 'Race & Class', 'Abilities', 'Details'];

export default function CharacterCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [race, setRace] = useState('');
  const [subrace, setSubrace] = useState('');
  const [className, setClassName] = useState('');
  const [subclass, setSubclass] = useState('');
  const [background, setBackground] = useState('');
  const [alignment, setAlignment] = useState('');
  const [abilities, setAbilities] = useState<AbilityScores>({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });

  const selectedRace = SRD_RACES.find(r => r.name === race);
  const selectedClass = SRD_CLASSES.find(c => c.name === className);

  const handleCreate = async () => {
    // Apply racial ability bonuses on top of base scores
    const finalAbilities = { ...abilities };
    if (selectedRace?.abilityBonuses) {
      for (const [key, bonus] of Object.entries(selectedRace.abilityBonuses)) {
        const ab = key as AbilityName;
        finalAbilities[ab] = Math.min(30, (finalAbilities[ab] ?? 10) + (bonus as number));
      }
    }

    const char = createDefaultCharacter({
      name: name || 'Unnamed Hero',
      playerName,
      race,
      subrace,
      classes: [{
        name: className,
        subclass,
        level: 1,
        hitDieSize: selectedClass?.hitDie ?? 8,
        hitDiceUsed: 0,
      }],
      background,
      alignment,
      abilities: finalAbilities,
      speed: selectedRace?.speed ?? 30,
      savingThrowProficiencies: ([...(selectedClass?.savingThrows ?? [])]) as AbilityName[],
      spellcastingAbility: selectedClass?.spellcastingAbility ?? '',
    });
    await saveCharacter(char);
    navigate(`/character/${char.id}`);
  };

  const setAbility = (key: AbilityName, value: number) => {
    setAbilities(prev => ({ ...prev, [key]: Math.max(1, Math.min(30, value)) }));
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto animate-fade-in">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="font-display text-2xl font-bold mb-6">Create Character</h1>

      {/* Step indicator */}
      <div className="flex gap-1 mb-6">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`flex-1 text-xs py-1.5 rounded-full font-medium transition-colors ${
              i === step ? 'bg-primary text-primary-foreground' :
              i < step ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="space-y-4">
        {step === 0 && (
          <>
            <FieldGroup label="Character Name">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter character name"
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm" autoFocus />
            </FieldGroup>
            <FieldGroup label="Player Name">
              <input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Your name"
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
            </FieldGroup>
          </>
        )}

        {step === 1 && (
          <>
            <FieldGroup label="Race">
              <select value={race} onChange={e => { setRace(e.target.value); setSubrace(''); }}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                <option value="">Select race...</option>
                {SRD_RACES.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
              </select>
            </FieldGroup>
            {selectedRace && selectedRace.subraces.length > 0 && (
              <FieldGroup label="Subrace">
                <select value={subrace} onChange={e => setSubrace(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  <option value="">Select subrace...</option>
                  {selectedRace.subraces.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FieldGroup>
            )}
            <FieldGroup label="Class">
              <select value={className} onChange={e => { setClassName(e.target.value); setSubclass(''); }}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                <option value="">Select class...</option>
                {SRD_CLASSES.map(c => <option key={c.name} value={c.name}>{c.name} (d{c.hitDie})</option>)}
              </select>
            </FieldGroup>
            {selectedClass && selectedClass.subclasses.length > 0 && (
              <FieldGroup label="Subclass">
                <select value={subclass} onChange={e => setSubclass(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  <option value="">Select subclass...</option>
                  {selectedClass.subclasses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FieldGroup>
            )}
            <FieldGroup label="Background">
              <select value={background} onChange={e => setBackground(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                <option value="">Select background...</option>
                {SRD_BACKGROUNDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </FieldGroup>
            <FieldGroup label="Alignment">
              <select value={alignment} onChange={e => setAlignment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                <option value="">Select alignment...</option>
                {SRD_ALIGNMENTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </FieldGroup>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-muted-foreground">Set your ability scores (standard is 8-15 before racial bonuses).</p>
            <div className="grid grid-cols-2 gap-3">
              {ABILITY_NAMES.map(ab => {
                const bonus = (selectedRace?.abilityBonuses as any)?.[ab] || 0;
                return (
                  <div key={ab} className="border rounded-lg p-3 bg-card">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {ABILITY_LABELS[ab]}
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => setAbility(ab, abilities[ab] - 1)}
                        className="w-7 h-7 rounded bg-secondary text-sm font-bold">−</button>
                      <input
                        type="number"
                        value={abilities[ab]}
                        onChange={e => setAbility(ab, parseInt(e.target.value) || 10)}
                        className="w-12 text-center text-lg font-bold bg-background border rounded py-0.5"
                      />
                      <button onClick={() => setAbility(ab, abilities[ab] + 1)}
                        className="w-7 h-7 rounded bg-secondary text-sm font-bold">+</button>
                    </div>
                    {bonus > 0 && <p className="text-xs text-primary mt-1">+{bonus} from {race}</p>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="border rounded-xl bg-card p-4">
              <h3 className="font-display font-semibold mb-2">Summary</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Name:</span> {name || 'Unnamed Hero'}</p>
                <p><span className="text-muted-foreground">Race:</span> {race || 'None'}{subrace ? ` (${subrace})` : ''}</p>
                <p><span className="text-muted-foreground">Class:</span> {className || 'None'} Level 1{subclass ? ` — ${subclass}` : ''}</p>
                <p><span className="text-muted-foreground">Background:</span> {background || 'None'}</p>
                <p><span className="text-muted-foreground">Alignment:</span> {alignment || 'None'}</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {ABILITY_NAMES.map(ab => {
                  const bonus = (selectedRace?.abilityBonuses as any)?.[ab] || 0;
                  const final = Math.min(30, abilities[ab] + bonus);
                  return (
                    <span key={ab} className="px-2 py-1 rounded bg-secondary text-xs font-medium">
                      {ab.toUpperCase()} {final}{bonus > 0 ? <span className="text-primary"> (+{bonus})</span> : ''}
                    </span>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">You can edit all details after creation.</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : navigate('/')}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Cancel' : 'Back'}
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(step + 1)}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleCreate}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            <Check className="w-4 h-4" /> Create Character
          </button>
        )}
      </div>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}
