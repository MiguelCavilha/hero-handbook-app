import { useState } from 'react';
import type { Character, AppMode, JournalEntry } from '@/lib/types';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  character: Character;
  updateCharacter: (updates: Partial<Character> | ((prev: Character) => Character)) => void;
  mode: AppMode;
}

export function NotesTab({ character, updateCharacter, mode }: Props) {
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addJournalEntry = (title: string, content: string) => {
    updateCharacter(prev => ({
      ...prev,
      journal: [{ id: crypto.randomUUID(), title, content, date: new Date().toISOString() }, ...prev.journal],
    }));
    setShowAddEntry(false);
  };

  const removeJournalEntry = (id: string) => {
    updateCharacter(prev => ({ ...prev, journal: prev.journal.filter(j => j.id !== id) }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick notes */}
      <section>
        <h3 className="section-title">Quick Notes</h3>
        <textarea
          value={character.notes}
          onChange={e => updateCharacter({ notes: e.target.value })}
          placeholder="Quick notes, reminders, session prep..."
          className="w-full px-3 py-2 text-sm border rounded-lg bg-background resize-none h-32"
          readOnly={mode === 'session'}
        />
      </section>

      {/* Campaign Journal */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="section-title mb-0">Campaign Journal</h3>
          <button onClick={() => setShowAddEntry(true)} className="p-1 rounded hover:bg-secondary">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {showAddEntry && <JournalForm onAdd={addJournalEntry} onCancel={() => setShowAddEntry(false)} />}

        {character.journal.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No journal entries yet.</p>
        ) : (
          <div className="space-y-1">
            {character.journal.map(entry => {
              const isExpanded = expandedIds.has(entry.id);
              return (
                <div key={entry.id} className="border rounded-lg bg-card overflow-hidden">
                  <button onClick={() => toggleExpand(entry.id)} className="w-full flex items-center gap-2 px-3 py-2 text-left">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entry.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t">
                      {mode === 'edit' ? (
                        <textarea
                          value={entry.content}
                          onChange={e => updateCharacter(prev => ({
                            ...prev,
                            journal: prev.journal.map(j => j.id === entry.id ? { ...j, content: e.target.value } : j),
                          }))}
                          className="w-full text-sm mt-2 px-2 py-1 border rounded bg-background resize-none h-24"
                        />
                      ) : (
                        <p className="text-sm mt-2 whitespace-pre-wrap">{entry.content}</p>
                      )}
                      {mode === 'edit' && (
                        <button onClick={() => removeJournalEntry(entry.id)}
                          className="flex items-center gap-1 mt-2 text-xs text-destructive hover:underline">
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function JournalForm({ onAdd, onCancel }: { onAdd: (title: string, content: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  return (
    <div className="border rounded-lg p-3 bg-card space-y-2 mb-3">
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Entry title"
        className="w-full px-2 py-1 text-sm border rounded bg-background" required />
      <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What happened..."
        className="w-full px-2 py-1 text-sm border rounded bg-background h-20 resize-none" />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1 text-xs rounded bg-secondary">Cancel</button>
        <button onClick={() => title && onAdd(title, content)}
          className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground">Add</button>
      </div>
    </div>
  );
}
