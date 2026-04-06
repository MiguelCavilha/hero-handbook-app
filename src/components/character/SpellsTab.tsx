import { useEffect, useState } from 'react';
import type { Character, AppMode, SpellEntry } from '@/lib/types';
import { calcSpellSaveDC, calcSpellAttackBonus, formatModifier } from '@/lib/calculations';
import { ABILITY_LABELS, ABILITY_NAMES } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { translateApiTerm } from '@/lib/i18n/api-translation';
import { Plus, Trash2, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { SRD_CLASSES } from '@/lib/srd-data';
import { fetchClassSpells, fetchSpellDetails, normalizeDndSpellDetail } from '@/lib/dnd5e-api';

interface Props {
  character: Character;
  updateCharacter: (updates: Partial<Character> | ((prev: Character) => Character)) => void;
  mode: AppMode;
}

export function SpellsTab({ character, updateCharacter, mode }: Props) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [showAddSpell, setShowAddSpell] = useState(false);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [editingSpellId, setEditingSpellId] = useState<string | null>(null);
  const [editingSpell, setEditingSpell] = useState<Omit<SpellEntry, 'id'>>({
    name: '', level: 0, school: '', castingTime: '', range: '', components: '', duration: '', description: '', isPrepared: false, isFavorite: false, isRitual: false, isConcentration: false, source: 'custom',
  });

  const spellcastingClasses = character.classes
    .map(cls => SRD_CLASSES.find(c => c.name === cls.name))
    .filter((c): c is (typeof SRD_CLASSES)[number] => Boolean(c && c.spellcaster));

  const [selectedSpellClassName, setSelectedSpellClassName] = useState(spellcastingClasses[0]?.name ?? '');
  const [selectedSpellIndex, setSelectedSpellIndex] = useState('');
  const [spellListFilter, setSpellListFilter] = useState('');

  useEffect(() => {
    if (spellcastingClasses.length === 0) {
      setSelectedSpellClassName('');
      setSelectedSpellIndex('');
      return;
    }

    if (!selectedSpellClassName || !spellcastingClasses.some(cls => cls.name === selectedSpellClassName)) {
      setSelectedSpellClassName(spellcastingClasses[0].name);
      setSelectedSpellIndex('');
    }
  }, [spellcastingClasses, selectedSpellClassName]);

  const selectedClassName = selectedSpellClassName || spellcastingClasses[0]?.name || '';

  const classSpellListQuery = useQuery({
    queryKey: ['classSpells', selectedClassName],
    queryFn: () => fetchClassSpells(selectedClassName),
    enabled: selectedClassName !== '',
  });

  const availableClassSpells = classSpellListQuery.data?.filter(spell => spell.name.toLowerCase().includes(spellListFilter.toLowerCase())) ?? [];

  useEffect(() => {
    if (!selectedSpellIndex && availableClassSpells.length > 0) {
      setSelectedSpellIndex(availableClassSpells[0].index);
    }
    if (selectedSpellIndex && !availableClassSpells.some(spell => spell.index === selectedSpellIndex)) {
      setSelectedSpellIndex(availableClassSpells[0]?.index ?? '');
    }
  }, [availableClassSpells, selectedSpellIndex]);

  const selectedSpellDetailQuery = useQuery({
    queryKey: ['spellDetail', selectedSpellIndex],
    queryFn: () => fetchSpellDetails(selectedSpellIndex),
    enabled: selectedSpellIndex !== '',
  });

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
    updateCharacter(prev => ({ ...prev, spells: [...prev.spells, { ...spell, id: crypto.randomUUID() }] }));
    setShowAddSpell(false);
  };
  const removeSpell = (id: string) => updateCharacter(prev => ({ ...prev, spells: prev.spells.filter(s => s.id !== id) }));
  const togglePrepared = (id: string) => updateCharacter(prev => ({ ...prev, spells: prev.spells.map(s => s.id === id ? { ...s, isPrepared: !s.isPrepared } : s) }));
  const useSlot = (level: number) => {
    updateCharacter(prev => {
      const slot = prev.spellSlots[level];
      if (!slot || slot.used >= slot.max) return prev;
      return { ...prev, spellSlots: { ...prev.spellSlots, [level]: { ...slot, used: slot.used + 1 } } };
    });
  };
  const restoreSlot = (level: number) => {
    updateCharacter(prev => ({ ...prev, spellSlots: { ...prev.spellSlots, [level]: { ...prev.spellSlots[level], used: Math.max(0, (prev.spellSlots[level]?.used || 0) - 1) } } }));
  };
  const addSlotLevel = (level: number, max: number) => {
    updateCharacter(prev => ({ ...prev, spellSlots: { ...prev.spellSlots, [level]: { max, used: 0 } } }));
    setShowAddSlot(false);
  };
  const removeSlotLevel = (level: number) => {
    updateCharacter(prev => { const slots = { ...prev.spellSlots }; delete slots[level]; return { ...prev, spellSlots: slots }; });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section>
        <h3 className="section-title">{t.spellcasting}</h3>
        <div className="flex flex-wrap gap-3">
          {mode === 'edit' ? (
            <div>
              <label className="text-xs text-muted-foreground">{t.ability}</label>
              <select value={character.spellcastingAbility} onChange={e => updateCharacter({ spellcastingAbility: e.target.value as any })} className="block px-2 py-1 text-sm border rounded bg-background mt-0.5">
                <option value="">—</option>
                {ABILITY_NAMES.map(a => <option key={a} value={a}>{ABILITY_LABELS[a]}</option>)}
              </select>
            </div>
          ) : character.spellcastingAbility ? (
            <div className="quick-stat">
              <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">{t.ability}</span>
              <span className="text-sm font-bold">{ABILITY_LABELS[character.spellcastingAbility]}</span>
            </div>
          ) : null}
          {character.spellcastingAbility && (
            <>
              <div className="quick-stat">
                <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">{t.saveDC}</span>
                <span className="text-lg font-bold">{dc}</span>
              </div>
              <div className="quick-stat">
                <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">{t.attackBonus}</span>
                <span className="text-lg font-bold">{formatModifier(atk)}</span>
              </div>
            </>
          )}
        </div>
      </section>

      {spellcastingClasses.length > 0 && mode === 'edit' && (
        <section>
          <h3 className="section-title">{t.classSpells}</h3>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">{t.spellcastingClass}</label>
              <select value={selectedClassName} onChange={e => setSelectedSpellClassName(e.target.value)} className="block w-full px-2 py-1 text-sm border rounded bg-background mt-0.5">
                {spellcastingClasses.map(cls => <option key={cls.name} value={cls.name}>{translateApiTerm(t, 'classes', cls.name)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">{t.searchSpells}</label>
              <input value={spellListFilter} onChange={e => setSpellListFilter(e.target.value)} placeholder={t.searchClassSpells} className="w-full px-2 py-1 text-sm border rounded bg-background" />
            </div>
          </div>
          <div className="mt-3 space-y-3">
            {classSpellListQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">{t.loading}</p>
            ) : classSpellListQuery.isError ? (
              <p className="text-sm text-destructive">{t.failedToLoadClassSpells}</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <select value={selectedSpellIndex} onChange={e => setSelectedSpellIndex(e.target.value)} className="block w-full px-2 py-1 text-sm border rounded bg-background">
                  {availableClassSpells.map(spell => (
                    <option key={spell.index} value={spell.index}>{spell.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (selectedSpellIndex && selectedSpellDetailQuery.data) {
                      addSpell(normalizeDndSpellDetail(selectedSpellDetailQuery.data));
                      setSelectedSpellIndex('');
                    }
                  }}
                  disabled={!selectedSpellIndex || !selectedSpellDetailQuery.data || selectedSpellDetailQuery.isFetching}
                  className="px-3 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                >
                  + {t.addSpell}
                </button>
              </div>
            )}
            {selectedSpellDetailQuery.data && (
              <div className="border rounded-lg p-3 bg-card text-sm text-muted-foreground">
                <p className="font-semibold">{selectedSpellDetailQuery.data.name}</p>
                <p>{selectedSpellDetailQuery.data.level === 0 ? t.cantrips : t.spellLevel(selectedSpellDetailQuery.data.level)}</p>
                <p>{translateApiTerm(t, 'schools', selectedSpellDetailQuery.data.school.name)} · {selectedSpellDetailQuery.data.casting_time}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {(Object.keys(character.spellSlots).length > 0 || mode === 'edit') && (
        <section>
          <h3 className="section-title">{t.spellSlots}</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(character.spellSlots).sort(([a], [b]) => Number(a) - Number(b)).map(([level, slot]) => (
              <div key={level} className="border rounded-lg p-2 bg-card text-center min-w-[4rem]">
                <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">{t.spellLevel(Number(level))}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <button onClick={() => restoreSlot(Number(level))} disabled={slot.used === 0} className="w-5 h-5 rounded bg-primary/20 text-primary text-xs font-bold disabled:opacity-40">+</button>
                  <span className="text-sm font-bold">{slot.max - slot.used}/{slot.max}</span>
                  <button onClick={() => useSlot(Number(level))} disabled={slot.used >= slot.max} className="w-5 h-5 rounded bg-destructive/20 text-destructive text-xs font-bold disabled:opacity-40">−</button>
                </div>
                {mode === 'edit' && <button onClick={() => removeSlotLevel(Number(level))} className="text-[0.6rem] text-destructive hover:underline mt-0.5">{t.removeSlot}</button>}
              </div>
            ))}
          </div>
          {mode === 'edit' && (
            showAddSlot
              ? <SlotForm onAdd={addSlotLevel} onCancel={() => setShowAddSlot(false)} existingLevels={Object.keys(character.spellSlots).map(Number)} t={t} />
              : <button onClick={() => setShowAddSlot(true)} className="text-xs text-primary hover:underline mt-2">+ {t.addSlotLevel}</button>
          )}
        </section>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchSpells} className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg bg-background" />
        </div>
        {mode === 'edit' && <button onClick={() => setShowAddSpell(true)} className="p-2 rounded-lg bg-primary text-primary-foreground"><Plus className="w-4 h-4" /></button>}
      </div>

      <div className="flex gap-1 overflow-x-auto scrollbar-thin">
        <button onClick={() => setFilterLevel(null)} className={`tab-pill ${filterLevel === null ? 'tab-pill-active' : 'tab-pill-inactive'}`}>All</button>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => {
          const count = character.spells.filter(s => s.level === l).length;
          if (count === 0) return null;
          return (
            <button key={l} onClick={() => setFilterLevel(l)} className={`tab-pill ${filterLevel === l ? 'tab-pill-active' : 'tab-pill-inactive'}`}>
              {l === 0 ? t.cantrips : `Nv ${l}`} ({count})
            </button>
          );
        })}
      </div>

      {Object.entries(spellsByLevel).sort(([a], [b]) => Number(a) - Number(b)).map(([level, spells]) => (
        <section key={level}>
          <h3 className="section-title">{Number(level) === 0 ? t.cantrips : t.spellLevel(Number(level))}</h3>
          <div className="space-y-1">
            {spells.map(spell => {
              const isEditing = editingSpellId === spell.id;
              return isEditing ? (
                <div key={spell.id} className="border rounded-lg p-2 bg-card">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <input value={editingSpell.name} onChange={e => setEditingSpell(prev => ({ ...prev, name: e.target.value }))} placeholder={t.spellName} className="input-base" />
                    <select value={editingSpell.level} onChange={e => setEditingSpell(prev => ({ ...prev, level: Number(e.target.value) }))} className="input-base">
                      {[0,1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>{l === 0 ? t.cantrips : t.spellLevel(l)}</option>)}
                    </select>
                    <input value={editingSpell.school} onChange={e => setEditingSpell(prev => ({ ...prev, school: e.target.value }))} placeholder={t.school} className="input-base" />
                    <input value={editingSpell.castingTime} onChange={e => setEditingSpell(prev => ({ ...prev, castingTime: e.target.value }))} placeholder={t.castingTime} className="input-base" />
                    <input value={editingSpell.range} onChange={e => setEditingSpell(prev => ({ ...prev, range: e.target.value }))} placeholder={t.range} className="input-base" />
                  </div>
                  <textarea value={editingSpell.description} onChange={e => setEditingSpell(prev => ({ ...prev, description: e.target.value }))} placeholder={t.description} className="w-full px-2 py-1 text-sm border rounded bg-background" />
                  <div className="flex gap-2 justify-end mt-2">
                    <button onClick={() => setEditingSpellId(null)} className="px-2 py-1 text-xs rounded bg-secondary">{t.cancel}</button>
                    <button onClick={() => { updateCharacter(prev => ({
                      ...prev,
                      spells: prev.spells.map(s => s.id === spell.id ? { ...s, ...editingSpell } : s),
                    })); setEditingSpellId(null); }} className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground">{t.save}</button>
                  </div>
                </div>
              ) : (
                <div key={spell.id} className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-card">
                  {spell.level > 0 && (
                    <button onClick={() => togglePrepared(spell.id)}
                      className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${spell.isPrepared ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{spell.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {translateApiTerm(t, 'schools', spell.school)} · {spell.castingTime} · {spell.range}
                      {spell.isConcentration && ' · C'}{spell.isRitual && ' · R'}
                    </p>
                    {spell.description && <p className="text-xs text-muted-foreground truncate">{spell.description}</p>}
                  </div>
                  {mode === 'edit' && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingSpellId(spell.id); setEditingSpell({ ...spell }); }} className="p-1 rounded hover:bg-secondary"><span className="text-xs">✎</span></button>
                      <button onClick={() => removeSpell(spell.id)} className="p-1 rounded hover:bg-secondary"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {filteredSpells.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{t.noSpellsFound}</p>}
      {showAddSpell && <SpellForm onAdd={addSpell} onCancel={() => setShowAddSpell(false)} t={t} />}
    </div>
  );
}

function SlotForm({ onAdd, onCancel, existingLevels, t }: { onAdd: (l: number, m: number) => void; onCancel: () => void; existingLevels: number[]; t: ReturnType<typeof useI18n>['t'] }) {
  const available = [1,2,3,4,5,6,7,8,9].filter(l => !existingLevels.includes(l));
  const [level, setLevel] = useState(available[0] ?? 1);
  const [max, setMax] = useState(2);
  if (available.length === 0) return (
    <div className="border rounded-lg p-3 bg-card mt-2 text-sm text-muted-foreground">
      {t.allSlotsAdded} <button onClick={onCancel} className="ml-2 text-xs text-primary hover:underline">×</button>
    </div>
  );
  return (
    <div className="border rounded-lg p-3 bg-card mt-2 space-y-2">
      <h4 className="text-sm font-semibold">{t.addSlotLevel}</h4>
      <div className="flex gap-2 items-end">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">{t.spellLevel(0).replace('0','')}</label>
          <select value={level} onChange={e => setLevel(Number(e.target.value))} className="px-2 py-1 text-sm border rounded bg-background">
            {available.map(l => <option key={l} value={l}>{t.spellLevel(l)}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">{t.slots}</label>
          <input type="number" value={max} min={1} max={9} onChange={e => setMax(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 px-2 py-1 text-sm border rounded bg-background" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1 text-xs rounded bg-secondary">×</button>
        <button onClick={() => onAdd(level, max)} className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground">{t.add}</button>
      </div>
    </div>
  );
}

function SpellForm({ onAdd, onCancel, t }: { onAdd: (s: Omit<SpellEntry, 'id'>) => void; onCancel: () => void; t: ReturnType<typeof useI18n>['t'] }) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState(0);
  const [school, setSchool] = useState('Evocação');
  const [castingTime, setCastingTime] = useState('1 Ação');
  const [range, setRange] = useState('18m');
  const [components] = useState('V, S');
  const [duration] = useState('Instantânea');
  const [description, setDescription] = useState('');
  return (
    <div className="border rounded-lg p-3 bg-card space-y-2">
      <h4 className="text-sm font-semibold">{t.addSpell}</h4>
      <input value={name} onChange={e => setName(e.target.value)} placeholder={t.spellName} className="w-full px-2 py-1 text-sm border rounded bg-background" required />
      <div className="grid grid-cols-2 gap-2">
        <select value={level} onChange={e => setLevel(Number(e.target.value))} className="px-2 py-1 text-sm border rounded bg-background">
          {[0,1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>{l === 0 ? t.cantrips : t.spellLevel(l)}</option>)}
        </select>
        <input value={school} onChange={e => setSchool(e.target.value)} placeholder={t.school} className="px-2 py-1 text-sm border rounded bg-background" />
        <input value={castingTime} onChange={e => setCastingTime(e.target.value)} placeholder={t.castingTime} className="px-2 py-1 text-sm border rounded bg-background" />
        <input value={range} onChange={e => setRange(e.target.value)} placeholder={t.range} className="px-2 py-1 text-sm border rounded bg-background" />
      </div>
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t.description} className="w-full px-2 py-1 text-sm border rounded bg-background h-16 resize-none" />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1 text-xs rounded bg-secondary">×</button>
        <button onClick={() => name && onAdd({ name, level, school, castingTime, range, components, duration, description, isPrepared: false, isFavorite: false, isRitual: false, isConcentration: false, source: 'custom' })} className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground">{t.add}</button>
      </div>
    </div>
  );
}
