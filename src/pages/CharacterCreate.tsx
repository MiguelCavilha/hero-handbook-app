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

  const isStepValid = (s: number): boolean => {
    if (s === 0) return name.trim() !== '' && playerName.trim() !== '';
    if (s === 1) return race !== '' && className !== '';
    return true;
  };

  const canAdvance = () => isStepValid(step);

  const handleCreate = async () => {
    const finalAbilities = { ...abilities };
    if (selectedRace?.abilityBonuses) {
      for (const [key, bonus] of Object.entries(selectedRace.abilityBonuses)) {
        const ab = key as AbilityName;
        finalAbilities[ab] = Math.min(30, (finalAbilities[ab] ?? 10) + (bonus as number));
      }
    }

    const char = createDefaultCharacter({
      name: name.trim() || 'Unnamed Hero',
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
      <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5 hover:text-foreground active:opacity-70 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="font-display text-2xl font-bold mb-1">Create Character</h1>
      <p className="text-sm text-muted-foreground mb-6">Fill in the details to begin your adventure</p>

      {/* Step indicator */}
      <div className="flex gap-1.5 mb-7 p-1 rounded-xl" style={{ background: 'hsl(var(--secondary))' }}>
        {STEPS.map((s, i) => {
          const accessible = i <= step || (i === step + 1 && isStepValid(step));
          return (
            <button
              key={s}
              onClick={() => accessible && setStep(i)}
              disabled={!accessible}
              className={`flex-1 text-xs py-1.5 rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed ${
                i === step
                  ? 'text-primary-foreground shadow-sm'
                  : i < step
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
              style={i === step ? { background: 'hsl(var(--primary))', boxShadow: 'var(--shadow-sm)' } : {}}
            >
              {i < step ? '✓ ' : ''}{s}
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <div className="space-y-4">
        {step === 0 && (
          <>
            <FieldGroup label="Character Name">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter character name"
                className="input-base" autoFocus required />
            </FieldGroup>
            <FieldGroup label="Player Name">
              <input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Your name"
                className="input-base" required />
            </FieldGroup>
          </>
        )}

        {step === 1 && (
          <>
            <FieldGroup label="Race">
              <select value={race} onChange={e => { setRace(e.target.value); setSubrace(''); }}
                className="input-base" required>
                <option value="">Select race...</option>
                {SRD_RACES.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
              </select>
            </FieldGroup>
            {selectedRace && selectedRace.subraces.length > 0 && (
              <FieldGroup label="Subrace">
                <select value={subrace} onChange={e => setSubrace(e.target.value)}
                  className="input-base">
                  <option value="">Select subrace...</option>
                  {selectedRace.subraces.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FieldGroup>
            )}
            <FieldGroup label="Class">
              <select value={className} onChange={e => { setClassName(e.target.value); setSubclass(''); }}
                className="input-base" required>
                <option value="">Select class...</option>
                {SRD_CLASSES.map(c => <option key={c.name} value={c.name}>{c.name} (d{c.hitDie})</option>)}
              </select>
            </FieldGroup>
            {selectedClass && selectedClass.subclasses.length > 0 && (
              <FieldGroup label="Subclass">
                <select value={subclass} onChange={e => setSubclass(e.target.value)}
                  className="input-base">
                  <option value="">Select subclass...</option>
                  {selectedClass.subclasses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FieldGroup>
            )}
            <FieldGroup label="Background">
              <select value={background} onChange={e => setBackground(e.target.value)}
                className="input-base">
                <option value="">Select background...</option>
                {SRD_BACKGROUNDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </FieldGroup>
            <FieldGroup label="Alignment">
              <select value={alignment} onChange={e => setAlignment(e.target.value)}
                className="input-base">
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
                const bonus = selectedRace?.abilityBonuses?.[ab] ?? 0;
                return (
                  <div key={ab} className="card-surface p-3">
                    <label className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
                      {ABILITY_LABELS[ab]}
                    </label>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => setAbility(ab, abilities[ab] - 1)}
                        className="w-7 h-7 rounded-lg text-sm font-bold transition-all active:scale-90"
                        style={{ background: 'hsl(var(--secondary))' }}>−</button>
                      <input
                        type="number"
                        value={abilities[ab]}
                        onChange={e => setAbility(ab, parseInt(e.target.value) || 10)}
                        className="w-12 text-center text-lg font-bold bg-background border rounded-lg py-0.5 focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button onClick={() => setAbility(ab, abilities[ab] + 1)}
                        className="w-7 h-7 rounded-lg text-sm font-bold transition-all active:scale-90"
                        style={{ background: 'hsl(var(--secondary))' }}>+</button>
                    </div>
                    {bonus > 0 && <p className="text-xs mt-1.5" style={{ color: 'hsl(var(--gold))' }}>+{bonus} racial</p>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="card-surface p-4">
              <h3 className="font-display font-semibold mb-3 text-sm">Summary</h3>
              <div className="space-y-1.5 text-sm">
                <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{name || 'Unnamed Hero'}</span></p>
                <p><span className="text-muted-foreground">Race:</span> <span className="font-medium">{race || '—'}{subrace ? ` (${subrace})` : ''}</span></p>
                <p><span className="text-muted-foreground">Class:</span> <span className="font-medium">{className || '—'} Level 1{subclass ? ` · ${subclass}` : ''}</span></p>
                <p><span className="text-muted-foreground">Background:</span> <span className="font-medium">{background || '—'}</span></p>
                <p><span className="text-muted-foreground">Alignment:</span> <span className="font-medium">{alignment || '—'}</span></p>
              </div>
              <div className="divider-arcane my-3" />
              <div className="flex flex-wrap gap-1.5">
                {ABILITY_NAMES.map(ab => {
                  const bonus = selectedRace?.abilityBonuses?.[ab] ?? 0;
                  const final = Math.min(30, abilities[ab] + bonus);
                  return (
                    <span key={ab} className="chip-gold text-xs">
                      {ab.toUpperCase()} {final}{bonus > 0 ? ` +${bonus}` : ''}
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
          className="btn-secondary"
        >
          <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Cancel' : 'Back'}
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canAdvance()} className="btn-primary">
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleCreate} className="btn-primary">
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
      <label className="block text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
