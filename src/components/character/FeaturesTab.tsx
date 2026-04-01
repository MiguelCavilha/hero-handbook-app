import { useState } from 'react';
import type { Character, AppMode, Feature } from '@/lib/types';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  character: Character;
  updateCharacter: (updates: Partial<Character> | ((prev: Character) => Character)) => void;
  mode: AppMode;
}

export function FeaturesTab({ character, updateCharacter, mode }: Props) {
  const [showAddFeature, setShowAddFeature] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addFeature = (feature: Omit<Feature, 'id'>) => {
    updateCharacter(prev => ({
      ...prev,
      features: [...prev.features, { ...feature, id: crypto.randomUUID() }],
    }));
    setShowAddFeature(false);
  };

  const removeFeature = (id: string) => {
    updateCharacter(prev => ({ ...prev, features: prev.features.filter(f => f.id !== id) }));
  };

  const useFeature = (id: string) => {
    updateCharacter(prev => ({
      ...prev,
      features: prev.features.map(f => f.id === id && f.usesCurrent > 0 ? { ...f, usesCurrent: f.usesCurrent - 1 } : f),
    }));
  };

  const groupedFeatures = character.features.reduce((acc, f) => {
    (acc[f.source] = acc[f.source] || []).push(f);
    return acc;
  }, {} as Record<string, Feature[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Feats */}
      <section>
        <h3 className="section-title">Feats</h3>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {character.feats.map((feat, i) => (
            <span key={i} className="px-2 py-0.5 rounded bg-secondary text-xs flex items-center gap-1">
              {feat}
              {mode === 'edit' && (
                <button onClick={() => updateCharacter(prev => ({ ...prev, feats: prev.feats.filter((_, j) => j !== i) }))}
                  className="text-muted-foreground hover:text-destructive">×</button>
              )}
            </span>
          ))}
        </div>
        {mode === 'edit' && (
          <input placeholder="Add feat..." className="px-2 py-1 text-xs border rounded bg-background w-full sm:w-48"
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                updateCharacter(prev => ({ ...prev, feats: [...prev.feats, (e.target as HTMLInputElement).value.trim()] }));
                (e.target as HTMLInputElement).value = '';
              }
            }} />
        )}
      </section>

      {/* Features grouped by source */}
      {Object.entries(groupedFeatures).map(([source, features]) => (
        <section key={source}>
          <h3 className="section-title">{source} Features</h3>
          <div className="space-y-1">
            {features.map(feature => {
              const isExpanded = expandedIds.has(feature.id);
              return (
                <div key={feature.id} className="border rounded-lg bg-card overflow-hidden">
                  <button
                    onClick={() => toggleExpand(feature.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{feature.name}</p>
                      {feature.usesMax > 0 && (
                        <p className="text-xs text-muted-foreground">{feature.usesCurrent}/{feature.usesMax} uses · {feature.rechargeOn} rest</p>
                      )}
                    </div>
                    {feature.usesMax > 0 && mode === 'session' && (
                      <button onClick={e => { e.stopPropagation(); useFeature(feature.id); }}
                        className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-xs font-medium"
                        disabled={feature.usesCurrent === 0}>
                        Use
                      </button>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t">
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{feature.description || 'No description.'}</p>
                      {mode === 'edit' && (
                        <button onClick={() => removeFeature(feature.id)} className="flex items-center gap-1 mt-2 text-xs text-destructive hover:underline">
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {character.features.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No features added yet.</p>}

      {mode === 'edit' && (
        <>
          <button onClick={() => setShowAddFeature(true)} className="flex items-center gap-1 text-sm text-primary hover:underline">
            <Plus className="w-4 h-4" /> Add Feature
          </button>
          {showAddFeature && <FeatureForm onAdd={addFeature} onCancel={() => setShowAddFeature(false)} />}
        </>
      )}

      {/* Resistances, Immunities, etc. */}
      {mode === 'edit' && (
        <>
          <TagSection title="Resistances" items={character.resistances} onChange={resistances => updateCharacter({ resistances })} />
          <TagSection title="Immunities" items={character.immunities} onChange={immunities => updateCharacter({ immunities })} />
          <TagSection title="Vulnerabilities" items={character.vulnerabilities} onChange={vulnerabilities => updateCharacter({ vulnerabilities })} />
          <TagSection title="Senses" items={character.senses} onChange={senses => updateCharacter({ senses })} />
        </>
      )}
      {mode === 'session' && (
        <>
          {character.resistances.length > 0 && <TagDisplay title="Resistances" items={character.resistances} />}
          {character.immunities.length > 0 && <TagDisplay title="Immunities" items={character.immunities} />}
          {character.vulnerabilities.length > 0 && <TagDisplay title="Vulnerabilities" items={character.vulnerabilities} />}
          {character.senses.length > 0 && <TagDisplay title="Senses" items={character.senses} />}
        </>
      )}
    </div>
  );
}

function TagSection({ title, items, onChange }: { title: string; items: string[]; onChange: (items: string[]) => void }) {
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
      <input placeholder={`Add ${title.toLowerCase()}...`}
        className="px-2 py-1 text-xs border rounded bg-background w-full sm:w-48"
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
            onChange([...items, (e.target as HTMLInputElement).value.trim()]);
            (e.target as HTMLInputElement).value = '';
          }
        }} />
    </section>
  );
}

function TagDisplay({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="section-title">{title}</h3>
      <div className="flex flex-wrap gap-1">{items.map(i => <span key={i} className="px-2 py-0.5 rounded bg-secondary text-xs">{i}</span>)}</div>
    </section>
  );
}

function FeatureForm({ onAdd, onCancel }: { onAdd: (f: Omit<Feature, 'id'>) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [source, setSource] = useState('Class');
  const [description, setDescription] = useState('');
  const [usesMax, setUsesMax] = useState(0);
  const [rechargeOn, setRechargeOn] = useState<'short' | 'long' | 'none'>('none');

  return (
    <div className="border rounded-lg p-3 bg-card space-y-2">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Feature name" className="w-full px-2 py-1 text-sm border rounded bg-background" />
      <div className="flex gap-2">
        <select value={source} onChange={e => setSource(e.target.value)} className="px-2 py-1 text-sm border rounded bg-background">
          <option>Race</option><option>Class</option><option>Subclass</option><option>Feat</option><option>Background</option><option>Other</option>
        </select>
        <input type="number" value={usesMax} onChange={e => setUsesMax(parseInt(e.target.value) || 0)}
          placeholder="Uses" className="w-16 px-2 py-1 text-sm border rounded bg-background" />
        {usesMax > 0 && (
          <select value={rechargeOn} onChange={e => setRechargeOn(e.target.value as any)}
            className="px-2 py-1 text-sm border rounded bg-background">
            <option value="short">Short Rest</option><option value="long">Long Rest</option><option value="none">No Recharge</option>
          </select>
        )}
      </div>
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description..."
        className="w-full px-2 py-1 text-sm border rounded bg-background h-16 resize-none" />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1 text-xs rounded bg-secondary">Cancel</button>
        <button onClick={() => name && onAdd({ name, source, level: 1, description, usesMax, usesCurrent: usesMax, rechargeOn })}
          className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground">Add</button>
      </div>
    </div>
  );
}
