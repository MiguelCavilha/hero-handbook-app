import { useNavigate } from 'react-router-dom';
import { useCharacters } from '@/hooks/useCharacters';
import { Plus, Upload, Download, Copy, Trash2, Users, FileDown, Swords } from 'lucide-react';
import { totalLevel } from '@/lib/calculations';
import { exportCharacter, exportAllCharacters, importCharacter } from '@/lib/db';
import { useRef } from 'react';
import { toast } from '@/hooks/use-toast';

export default function CharacterList() {
  const { characters, loading, remove, duplicate, refresh } = useCharacters();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);

  const handleExport = async (id: string, name: string) => {
    const json = await exportCharacter(id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${name.replace(/\s+/g, '_')}.json`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!', description: `${name} saved as JSON.` });
  };

  const handleExportAll = async () => {
    const json = await exportAllCharacters();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `all_characters_${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Backup complete!', description: 'All characters exported.' });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.characters) {
        for (const entry of data.characters) await importCharacter(JSON.stringify(entry));
        toast({ title: 'Imported!', description: `${data.characters.length} characters imported.` });
      } else {
        const char = await importCharacter(text);
        toast({ title: 'Imported!', description: `${char.name} added.` });
      }
      refresh();
    } catch {
      toast({ title: 'Error', description: 'Invalid character file.', variant: 'destructive' });
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <div className="px-4 py-8 animate-fade-in max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
          style={{ background: 'hsl(var(--primary) / 0.1)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
          <Swords className="w-6 h-6" style={{ color: 'hsl(var(--primary))' }} />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2 tracking-wide">Hero Handbook</h1>
        <p className="text-muted-foreground text-sm">Your adventurers, always ready</p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        <button onClick={() => navigate('/create')} className="btn-primary">
          <Plus className="w-4 h-4" /> New Character
        </button>
        <button onClick={() => fileInput.current?.click()} className="btn-secondary">
          <Upload className="w-4 h-4" /> Import
        </button>
        {characters.length > 0 && (
          <button onClick={handleExportAll} className="btn-secondary">
            <FileDown className="w-4 h-4" /> Backup All
          </button>
        )}
        <input ref={fileInput} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>

      {/* Character list */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border p-4 space-y-3" style={{ background: 'hsl(var(--card))' }}>
              <div className="flex gap-3">
                <div className="loading-pulse w-14 h-14 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="loading-pulse h-4 w-3/4 rounded" />
                  <div className="loading-pulse h-3 w-1/2 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : characters.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-display text-base font-semibold mb-1">No adventurers yet</p>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Create your first character or import an existing file to begin your journey.
          </p>
          <button onClick={() => navigate('/create')} className="btn-primary">
            <Plus className="w-4 h-4" /> Create Character
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map(char => (
            <div
              key={char.id}
              className="card-surface-hover group p-4"
              onClick={() => navigate(`/character/${char.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate(`/character/${char.id}`)}
            >
              <div className="flex items-start gap-3">
                {/* Portrait */}
                <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden flex items-center justify-center text-2xl"
                  style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
                  {char.portrait?.startsWith('data:') ? (
                    <img src={char.portrait} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{char.classes[0]?.name ? getClassEmoji(char.classes[0].name) : '🧙'}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold truncate text-sm leading-snug">{char.name}</h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {char.race}{char.race && char.classes[0]?.name ? ' · ' : ''}
                    {char.classes.map(c => `${c.name} ${c.level}`).join(' / ')}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">Level {totalLevel(char)}</p>
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex gap-2 mt-3">
                <span className="chip">HP {char.hpCurrent}/{char.hpMax}</span>
                <span className="chip">AC {char.armorClass}</span>
              </div>

              {/* Actions — always visible on mobile, hover on desktop */}
              <div
                className="flex gap-1 mt-3 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity duration-150"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => handleExport(char.id, char.name)}
                  className="btn-icon p-1.5 rounded-lg"
                  title="Export"
                  aria-label={`Export ${char.name}`}
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => duplicate(char.id)}
                  className="btn-icon p-1.5 rounded-lg"
                  title="Duplicate"
                  aria-label={`Duplicate ${char.name}`}
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { if (confirm(`Delete ${char.name}?`)) remove(char.id); }}
                  className="btn-icon p-1.5 rounded-lg hover:text-destructive focus-visible:text-destructive"
                  title="Delete"
                  aria-label={`Delete ${char.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getClassEmoji(className: string): string {
  const map: Record<string, string> = {
    Barbarian: '🪓', Bard: '🎵', Cleric: '✨', Druid: '🌿',
    Fighter: '⚔️', Monk: '👊', Paladin: '🛡️', Ranger: '🏹',
    Rogue: '🗡️', Sorcerer: '⚡', Warlock: '🔮', Wizard: '🧙',
  };
  return map[className] || '🐉';
}
