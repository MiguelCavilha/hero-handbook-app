import { useNavigate } from 'react-router-dom';
import { useCharacters } from '@/hooks/useCharacters';
import { Plus, Upload, Download, Copy, Trash2, Users, FileDown } from 'lucide-react';
import { totalLevel, proficiencyBonus } from '@/lib/calculations';
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
        // Bulk import
        for (const entry of data.characters) {
          await importCharacter(JSON.stringify(entry));
        }
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
    <div className="px-4 py-6 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">D&D Character Sheet</h1>
        <p className="text-muted-foreground text-sm">Create and manage your adventurers</p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        <button
          onClick={() => navigate('/create')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> New Character
        </button>
        <button
          onClick={() => fileInput.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Upload className="w-4 h-4" /> Import
        </button>
        {characters.length > 0 && (
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <FileDown className="w-4 h-4" /> Backup All
          </button>
        )}
        <input ref={fileInput} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>

      {/* Character list */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading characters...</div>
      ) : characters.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-2">No characters yet</p>
          <p className="text-sm text-muted-foreground">Create your first adventurer or import an existing character file.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map(char => (
            <div
              key={char.id}
              className="group border rounded-xl bg-card p-4 hover:border-primary/50 transition-all cursor-pointer"
              onClick={() => navigate(`/character/${char.id}`)}
            >
              <div className="flex items-start gap-3">
                {/* Portrait */}
                <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                  {char.portrait && char.portrait.startsWith('data:') ? (
                    <img src={char.portrait} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{char.classes[0]?.name ? getClassEmoji(char.classes[0].name) : '🧙'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold truncate">{char.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {char.race}{char.race && char.classes[0]?.name ? ' · ' : ''}{char.classes.map(c => `${c.name} ${c.level}`).join(' / ')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Level {totalLevel(char)}</p>
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex gap-3 mt-3 text-xs">
                <span className="px-2 py-0.5 rounded bg-secondary">HP {char.hpCurrent}/{char.hpMax}</span>
                <span className="px-2 py-0.5 rounded bg-secondary">AC {char.armorClass}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button onClick={() => handleExport(char.id, char.name)} className="p-1.5 rounded hover:bg-secondary" title="Export">
                  <Download className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => duplicate(char.id)} className="p-1.5 rounded hover:bg-secondary" title="Duplicate">
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => { if (confirm(`Delete ${char.name}?`)) remove(char.id); }} className="p-1.5 rounded hover:bg-secondary" title="Delete">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
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
