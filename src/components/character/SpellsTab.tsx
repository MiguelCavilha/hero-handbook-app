import { useState } from 'react';
import type { Character, AppMode, SpellEntry } from '@/lib/types';
import { calcSpellSaveDC, calcSpellAttackBonus, formatModifier } from '@/lib/calculations';
import { ABILITY_LABELS, ABILITY_NAMES } from '@/lib/types';
import { Plus, Trash2, Search } from 'lucide-react';

interface Props {
  character: Character;
  updateCharacter: (updates: Partial<Character> | ((prev: Character) => Character)) => void;
  mode: AppMode;
}

export function SpellsTab({ character, updateCharacter, mode }: Props) {
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [showAddSpell, setShowAddSpell] = useState(false);
  const [showAddSlot, setShowAddSlot] = useState(false);

  const dc = calcSpellSaveDC(character);
  const atk = calcSpellAttackBonus(character);

  const filteredSpells = character.spells.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterLevel !== null && s.level !== filterLevel) return false;
    return true;
  });

  const spellsByLevel = filteredSpells.reduce((acc, s) => {
    (acc[s.level] = acc[s.level] || []).push(s);
    return acc;
  }, {} as Record<number, SpellEntry[]>);

  const addSpell = (spell: Omit<SpellEntry, 'id'>) => {
    updateCharacter(prev => ({
      ...prev,
      spells: [...prev.spells, { ...spell, id: crypto.randomUUID() }],
    }));
    setShowAddSpell(false);
  };

  const removeSpell = (id: string) => {
    updateCharacter(prev => ({ ...prev, spells: prev.spells.filter(s => s.id !== id) }));
  };

  const togglePrepared = (id: string) => {
    updateCharacter(prev => ({
      ...prev,
      spells: prev.spells.map(s => s.id === id ? { ...s, isPrepared: !s.isPrepared } : s),
    }));
  };

  // Cap used at slot.max to prevent negative available slots
  const useSlot = (level: number) => {
    updateCharacter(prev => {
      const slot = prev.spellSlots[level];
      if (!slot || slot.used >= slot.max) return prev;
      return {
        ...prev,
        spellSlots: {
          ...prev.spellSlots,
          [level]: { ...slot, used: slot.used + 1 },
        },
      };
    });
  };

  const restoreSlot = (level: number) => {
    updateCharacter(prev => ({
      ...prev,
      spellSlots: {
        ...prev.spellSlots,
        [level]: { ...prev.spellSlots[level], used: Math.max(0, (prev.spellSlots[level]?.used || 0) - 1) },
      },
    }));
  };

  const addSlotLevel = (level: number, max: number) => {
    updateCharacter(prev => ({
      ...prev,
      spellSlots: { ...prev.spellSlots, [level]: { max, used: 0 } },
    }));
    setShowAddSlot(false);
  };

  const removeSlotLevel = (level: number) => {
    updateCharacter(prev => {
      const slots = { ...prev.spellSlots };
      delete slots[level];
      return { ...prev, spellSlots: slots };
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Spellcasting info */}
      <section>
        <h3 className="section-title">Spellcasting</h3>
        <div className="flex flex-wrap gap-3">
          {mode === 'edit' ? (
            <div>
              <label className="text-xs text-muted-foreground">Ability</label>
              <select
                value={character.spellcastingAbility}
                onChange={e => updateCharacter({ spellcastingAbility: e.target.value as any })}
                className="block px-2 py-1 text-sm border rounded bg-background mt-0.5"
              >
                <option value="">None</option>
                {ABILITY_NAMES.map(a => <option key={a} value={a}>{ABILITY_LABELS[a]}</option>)}
              </select>
            </div>
          ) : character.spellcastingAbility ? (
            <div className="quick-stat">
              <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">Ability</span>
              <span className="text-sm font-bold">{ABILITY_LABELS[character.spellcastingAbility]}</span>
            </div>
          ) : null}
          {character.spellcastingAbility && (
            <>
              <div className="quick-stat">
                <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">Save DC</span>
                <span className="text-lg font-bold">{dc}</span>
              </div>
              <div className="quick-stat">
                <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">Attack</span>
                <span className="text-lg font-bold">{formatModifier(atk)}</span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Spell slots */}
      {(Object.keys(character.spellSlots).length > 0 || mode === 'edit') && (
        <section>
          <h3 className="section-title">Spell Slots</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(character.spellSlots)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([level, slot]) => (
                <div key={level} className="border rounded-lg p-2 bg-card text-center min-w-[4rem]">
                  <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">Level {level}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <button
                      onClick={() => restoreSlot(Number(level))}
                      disabled={slot.used === 0}
                      className="w-5 h-5 rounded bg-primary/20 text-primary text-xs font-bold disabled:opacity-40"
                    >+</button>
                    <span className="text-sm font-bold">{slot.max - slot.used}/{slot.max}</span>
                    <button
                      onClick={() => useSlot(Number(level))}
                      disabled={slot.used >= slot.max}
                      className="w-5 h-5 rounded bg-destructive/20 text-destructive text-xs font-bold disabled:opacity-40"
                    >−</button>
                  </div>
                  {mode === 'edit' && (
                    <button
                      onClick={() => removeSlotLevel(Number(level))}
                      className="text-[0.6rem] text-destructive hover:underline mt-0.5"
                    >remove</button>
                  )}
                </div>
              ))}
          </div>

          {mode === 'edit' && (
            showAddSlot ? (
              <SlotForm onAdd={addSlotLevel} onCancel={() => setShowAddSlot(false)} existingLevels={Object.keys(character.spellSlots).map(Number)} />
            ) : (
              <button onClick={() => setShowAddSlot(true)} className="text-xs text-primary hover:underline mt-2">
                + Add spell slot level
              </button>
            )
          )}
        </section>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search spells..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg bg-background" />
        </div>
        {mode === 'edit' && (
          <button onClick={() => setShowAddSpell(true)} className="p-2 rounded-lg bg-primary text-primary-foreground">
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Level filter pills */}
      <div className="flex gap-1 overflow-x-auto scrollbar-thin">
        <button onClick={() => setFilterLevel(null)}
          className={`tab-pill ${filterLevel === null ? 'tab-pill-active' : 'tab-pill-inactive'}`}>All</button>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => {
          const count = character.spells.filter(s => s.level === l).length;
          if (count === 0) return null;
          return (
            <button key={l} onClick={() => setFilterLevel(l)}
              className={`tab-pill ${filterLevel === l ? 'tab-pill-active' : 'tab-pill-inactive'}`}>
              {l === 0 ? 'Cantrips' : `Lv ${l}`} ({count})
            </button>
          );
        })}
      </div>

      {/* Spells by level */}
      {Object.entries(spellsByLevel)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([level, spells]) => (
          <section key={level}>
            <h3 className="section-title">{Number(level) === 0 ? 'Cantrips' : `Level ${level}`}</h3>
            <div className="space-y-1">
              {spells.map(spell => (
                <div key={spell.id} className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-card">
                  {spell.level > 0 && (
                    <button onClick={() => togglePrepared(spell.id)}
                      className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${spell.isPrepared ? 'bg-primary border-primary' : 'border-muted-foreground'}`}
                      title="Prepared" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{spell.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {spell.school} · {spell.castingTime} · {spell.range}
                      {spell.isConcentration && ' · C'}
                      {spell.isRitual && ' · R'}
                    </p>
                  </div>
                  {mode === 'edit' && (
                    <button onClick={() => removeSpell(spell.id)} className="p-1 rounded hover:bg-secondary">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

      {filteredSpells.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No spells found.</p>}

      {showAddSpell && <SpellForm onAdd={addSpell} onCancel={() => setShowAddSpell(false)} />}
    </div>
  );
}

function SlotForm({ onAdd, onCancel, existingLevels }: {
  onAdd: (level: number, max: number) => void;
  onCancel: () => void;
  existingLevels: number[];
}) {
  const available = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(l => !existingLevels.includes(l));
  const [level, setLevel] = useState(available[0] ?? 1);
  const [max, setMax] = useState(2);

  if (available.length === 0) {
    return (
      <div className="border rounded-lg p-3 bg-card mt-2 text-sm text-muted-foreground">
        All spell slot levels (1–9) are already added.
        <button onClick={onCancel} className="ml-2 text-xs text-primary hover:underline">Close</button>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-3 bg-card mt-2 space-y-2">
      <h4 className="text-sm font-semibold">Add Spell Slot Level</h4>
      <div className="flex gap-2 items-end">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Level</label>
          <select value={level} onChange={e => setLevel(Number(e.target.value))}
            className="px-2 py-1 text-sm border rounded bg-background">
            {available.map(l => <option key={l} value={l}>Level {l}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Slots</label>
          <input type="number" value={max} min={1} max={9}
            onChange={e => setMax(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 px-2 py-1 text-sm border rounded bg-background" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1 text-xs rounded bg-secondary">Cancel</button>
        <button onClick={() => onAdd(level, max)}
          className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground">Add</button>
      </div>
    </div>
  );
}

function SpellForm({ onAdd, onCancel }: { onAdd: (s: Omit<SpellEntry, 'id'>) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState(0);
  const [school, setSchool] = useState('Evocation');
  const [castingTime, setCastingTime] = useState('1 Action');
  const [range, setRange] = useState('60 feet');
  const [components, setComponents] = useState('V, S');
  const [duration, setDuration] = useState('Instantaneous');
  const [description, setDescription] = useState('');

  return (
    <div className="border rounded-lg p-3 bg-card space-y-2">
      <h4 className="text-sm font-semibold">Add Spell</h4>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Spell name" className="w-full px-2 py-1 text-sm border rounded bg-background" />
      <div className="grid grid-cols-2 gap-2">
        <select value={level} onChange={e => setLevel(Number(e.target.value))} className="px-2 py-1 text-sm border rounded bg-background">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => <option key={l} value={l}>{l === 0 ? 'Cantrip' : `Level ${l}`}</option>)}
        </select>
        <input value={school} onChange={e => setSchool(e.target.value)} placeholder="School" className="px-2 py-1 text-sm border rounded bg-background" />
        <input value={castingTime} onChange={e => setCastingTime(e.target.value)} placeholder="Casting Time" className="px-2 py-1 text-sm border rounded bg-background" />
        <input value={range} onChange={e => setRange(e.target.value)} placeholder="Range" className="px-2 py-1 text-sm border rounded bg-background" />
      </div>
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description..." className="w-full px-2 py-1 text-sm border rounded bg-background h-16 resize-none" />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1 text-xs rounded bg-secondary">Cancel</button>
        <button onClick={() => name && onAdd({ name, level, school, castingTime, range, components, duration, description, isPrepared: false, isFavorite: false, isRitual: false, isConcentration: false, source: 'custom' })}
          className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground">Add</button>
      </div>
    </div>
  );
}
