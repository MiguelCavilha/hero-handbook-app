import { useState } from 'react';
import type { Character, AppMode, Weapon, Resource } from '@/lib/types';
import { SRD_CONDITIONS } from '@/lib/srd-data';
import { abilityModifier, formatModifier, proficiencyBonus } from '@/lib/calculations';
import { Plus, Trash2, RotateCcw } from 'lucide-react';

interface Props {
  character: Character;
  updateCharacter: (updates: Partial<Character> | ((prev: Character) => Character)) => void;
  mode: AppMode;
}

export function CombatTab({ character, updateCharacter, mode }: Props) {
  const [showAddWeapon, setShowAddWeapon] = useState(false);

  const addWeapon = (weapon: Omit<Weapon, 'id'>) => {
    updateCharacter(prev => ({
      ...prev,
      weapons: [...prev.weapons, { ...weapon, id: crypto.randomUUID() }],
    }));
    setShowAddWeapon(false);
  };

  const removeWeapon = (id: string) => {
    updateCharacter(prev => ({ ...prev, weapons: prev.weapons.filter(w => w.id !== id) }));
  };

  const toggleCondition = (condition: string) => {
    updateCharacter(prev => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter(c => c !== condition)
        : [...prev.conditions, condition],
    }));
  };

  // Editable combat stats
  const setField = (field: 'armorClass' | 'initiative' | 'speed' | 'hpMax', value: number) => {
    updateCharacter(prev => ({
      ...prev,
      [field]: value,
      manualOverrides: { ...prev.manualOverrides, [field]: true },
    }));
  };

  const resetField = (field: string) => {
    updateCharacter(prev => {
      const overrides = { ...prev.manualOverrides };
      delete overrides[field];
      return { ...prev, manualOverrides: overrides };
    });
  };

  // Resources
  const addResource = () => {
    updateCharacter(prev => ({
      ...prev,
      resources: [...prev.resources, { id: crypto.randomUUID(), name: 'New Resource', current: 1, max: 1, rechargeOn: 'long' }],
    }));
  };

  const updateResource = (id: string, updates: Partial<Resource>) => {
    updateCharacter(prev => ({
      ...prev,
      resources: prev.resources.map(r => r.id === id ? { ...r, ...updates } : r),
    }));
  };

  const shortRest = () => {
    updateCharacter(prev => ({
      ...prev,
      resources: prev.resources.map(r => r.rechargeOn === 'short' ? { ...r, current: r.max } : r),
    }));
  };

  const longRest = () => {
    updateCharacter(prev => ({
      ...prev,
      hpCurrent: prev.hpMax,
      hpTemp: 0,
      deathSaves: { successes: 0, failures: 0 },
      resources: prev.resources.map(r => r.rechargeOn !== 'none' ? { ...r, current: r.max } : r),
      spellSlots: Object.fromEntries(
        Object.entries(prev.spellSlots).map(([lvl, slot]) => [lvl, { ...slot, used: 0 }])
      ),
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Core combat stats (editable) */}
      <section>
        <h3 className="section-title">Combat Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <EditableStat label="Armor Class" value={character.armorClass} isOverridden={!!character.manualOverrides['armorClass']}
            onChange={v => setField('armorClass', v)} onReset={() => resetField('armorClass')} mode={mode} />
          <EditableStat label="Initiative" value={character.initiative} isOverridden={!!character.manualOverrides['initiative']}
            onChange={v => setField('initiative', v)} onReset={() => resetField('initiative')} mode={mode} format />
          <EditableStat label="Speed" value={character.speed} isOverridden={!!character.manualOverrides['speed']}
            onChange={v => setField('speed', v)} onReset={() => resetField('speed')} mode={mode} suffix="ft" />
          <EditableStat label="Max HP" value={character.hpMax} isOverridden={!!character.manualOverrides['hpMax']}
            onChange={v => setField('hpMax', v)} onReset={() => resetField('hpMax')} mode={mode} />
        </div>
      </section>

      {/* HP management */}
      <section>
        <h3 className="section-title">Hit Points</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button onClick={() => updateCharacter({ hpCurrent: Math.max(0, character.hpCurrent - 1) })}
              className="w-8 h-8 rounded-lg bg-destructive/20 text-destructive font-bold">−</button>
            <div className="text-center">
              <span className="text-2xl font-bold">{character.hpCurrent}</span>
              <span className="text-muted-foreground">/{character.hpMax}</span>
            </div>
            <button onClick={() => updateCharacter({ hpCurrent: Math.min(character.hpMax, character.hpCurrent + 1) })}
              className="w-8 h-8 rounded-lg bg-primary/20 text-primary font-bold">+</button>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Temp:</span>
            <input type="number" value={character.hpTemp} onChange={e => updateCharacter({ hpTemp: parseInt(e.target.value) || 0 })}
              className="w-12 text-center text-sm border rounded bg-background py-0.5" />
          </div>
        </div>
      </section>

      {/* Death saves */}
      <section>
        <h3 className="section-title">Death Saves</h3>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Successes</span>
            {[0, 1, 2].map(i => (
              <button key={i} onClick={() => updateCharacter({ deathSaves: { ...character.deathSaves, successes: i < character.deathSaves.successes ? i : i + 1 } })}
                className={`w-5 h-5 rounded-full border-2 ${i < character.deathSaves.successes ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Failures</span>
            {[0, 1, 2].map(i => (
              <button key={i} onClick={() => updateCharacter({ deathSaves: { ...character.deathSaves, failures: i < character.deathSaves.failures ? i : i + 1 } })}
                className={`w-5 h-5 rounded-full border-2 ${i < character.deathSaves.failures ? 'bg-destructive border-destructive' : 'border-muted-foreground'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* Weapons */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="section-title mb-0">Weapons & Attacks</h3>
          {mode === 'edit' && (
            <button onClick={() => setShowAddWeapon(true)} className="p-1 rounded hover:bg-secondary">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        {character.weapons.length === 0 && <p className="text-sm text-muted-foreground">No weapons added.</p>}
        <div className="space-y-2">
          {character.weapons.map(w => (
            <div key={w.id} className="flex items-center gap-3 px-3 py-2 border rounded-lg bg-card">
              <div className="flex-1">
                <p className="text-sm font-medium">{w.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatModifier(w.attackBonus)} to hit · {w.damage} {w.damageType}
                </p>
              </div>
              {mode === 'edit' && (
                <button onClick={() => removeWeapon(w.id)} className="p-1 rounded hover:bg-secondary">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              )}
            </div>
          ))}
        </div>
        {showAddWeapon && <WeaponForm onAdd={addWeapon} onCancel={() => setShowAddWeapon(false)} />}
      </section>

      {/* Resources */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="section-title mb-0">Resources</h3>
          {mode === 'edit' && <button onClick={addResource} className="p-1 rounded hover:bg-secondary"><Plus className="w-4 h-4" /></button>}
        </div>
        <div className="space-y-2">
          {character.resources.map(r => (
            <div key={r.id} className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-card">
              {mode === 'edit' ? (
                <input value={r.name} onChange={e => updateResource(r.id, { name: e.target.value })}
                  className="flex-1 text-sm bg-transparent outline-none" />
              ) : (
                <span className="flex-1 text-sm font-medium">{r.name}</span>
              )}
              <div className="flex items-center gap-1">
                <button onClick={() => updateResource(r.id, { current: Math.max(0, r.current - 1) })}
                  className="w-5 h-5 rounded bg-secondary text-xs font-bold">−</button>
                <span className="text-sm font-semibold w-8 text-center">{r.current}/{r.max}</span>
                <button onClick={() => updateResource(r.id, { current: Math.min(r.max, r.current + 1) })}
                  className="w-5 h-5 rounded bg-secondary text-xs font-bold">+</button>
              </div>
              {mode === 'edit' && (
                <select value={r.rechargeOn} onChange={e => updateResource(r.id, { rechargeOn: e.target.value as 'short' | 'long' | 'none' })}
                  className="text-xs border rounded bg-background px-1 py-0.5">
                  <option value="short">Short</option>
                  <option value="long">Long</option>
                  <option value="none">None</option>
                </select>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Rest buttons */}
      <section>
        <h3 className="section-title">Rest</h3>
        <div className="flex gap-2">
          <button onClick={shortRest} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-sm font-medium">
            <RotateCcw className="w-3.5 h-3.5" /> Short Rest
          </button>
          <button onClick={longRest} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            <RotateCcw className="w-3.5 h-3.5" /> Long Rest
          </button>
        </div>
      </section>

      {/* Conditions */}
      <section>
        <h3 className="section-title">Conditions</h3>
        <div className="flex flex-wrap gap-1.5">
          {SRD_CONDITIONS.map(c => (
            <button
              key={c}
              onClick={() => toggleCondition(c)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                character.conditions.includes(c) ? 'bg-destructive/20 text-destructive border border-destructive/30' : 'bg-secondary text-muted-foreground'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function EditableStat({ label, value, isOverridden, onChange, onReset, mode, format, suffix }: {
  label: string; value: number; isOverridden: boolean;
  onChange: (v: number) => void; onReset: () => void;
  mode: AppMode; format?: boolean; suffix?: string;
}) {
  return (
    <div className={`relative border rounded-lg p-3 bg-card text-center ${isOverridden ? 'field-manual' : 'field-auto'}`}>
      <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
      {mode === 'edit' ? (
        <div>
          <input type="number" value={value} onChange={e => onChange(parseInt(e.target.value) || 0)}
            className="text-xl font-bold w-full text-center bg-transparent outline-none" />
          {isOverridden && (
            <button onClick={onReset} className="text-[0.6rem] text-primary hover:underline">Reset</button>
          )}
        </div>
      ) : (
        <p className="text-xl font-bold">{format ? formatModifier(value) : value}{suffix ? ` ${suffix}` : ''}</p>
      )}
    </div>
  );
}

function WeaponForm({ onAdd, onCancel }: { onAdd: (w: Omit<Weapon, 'id'>) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [attackBonus, setAttackBonus] = useState(0);
  const [damage, setDamage] = useState('1d8');
  const [damageType, setDamageType] = useState('Slashing');

  return (
    <div className="border rounded-lg p-3 bg-card mt-2 space-y-2">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Weapon name"
        className="w-full px-2 py-1 text-sm border rounded bg-background" required />
      <div className="flex gap-2">
        <input type="number" value={attackBonus} onChange={e => setAttackBonus(parseInt(e.target.value) || 0)}
          placeholder="Atk bonus" className="w-20 px-2 py-1 text-sm border rounded bg-background" />
        <input value={damage} onChange={e => setDamage(e.target.value)} placeholder="Damage"
          className="flex-1 px-2 py-1 text-sm border rounded bg-background" />
        <input value={damageType} onChange={e => setDamageType(e.target.value)} placeholder="Type"
          className="w-24 px-2 py-1 text-sm border rounded bg-background" />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1 text-xs rounded bg-secondary">Cancel</button>
        <button onClick={() => name && onAdd({ name, attackBonus, damage, damageType, properties: '', isFavorite: false })}
          className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground">Add</button>
      </div>
    </div>
  );
}
