import { useNavigate } from 'react-router-dom';
import { useCharacters } from '@/hooks/useCharacters';
import { useI18n } from '@/lib/i18n';
import { Plus, Upload, Download, Copy, Trash2, Users, FileDown } from 'lucide-react';
import { totalLevel } from '@/lib/calculations';
import { exportCharacter, exportAllCharacters, importCharacter } from '@/lib/db';
import { useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { getCharacterVisual } from '@/lib/character-visual';

// Emblema SVG original — não usa nenhuma marca registrada
function HeroEmblem() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      {/* Escudo estilizado */}
      <path d="M40 6 L68 18 L68 44 Q68 64 40 74 Q12 64 12 44 L12 18 Z"
        stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
        fill="currentColor" fillOpacity="0.06" />
      {/* Runa central — cruz com ornamentos */}
      <line x1="40" y1="22" x2="40" y2="58" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="26" y1="36" x2="54" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="40" cy="36" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      {/* Ornamentos nos cantos do escudo */}
      <circle cx="40" cy="22" r="2" fill="currentColor" fillOpacity="0.6"/>
      <circle cx="40" cy="58" r="2" fill="currentColor" fillOpacity="0.6"/>
      <circle cx="26" cy="36" r="2" fill="currentColor" fillOpacity="0.6"/>
      <circle cx="54" cy="36" r="2" fill="currentColor" fillOpacity="0.6"/>
    </svg>
  );
}

export default function CharacterList() {
  const { characters, loading, remove, duplicate, refresh } = useCharacters();
  const { t } = useI18n();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);

  const handleExport = async (id: string, name: string) => {
    const json = await exportCharacter(id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${name.replace(/\s+/g, '_')}.json`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: t.exported, description: t.exportedDesc(name) });
  };

  const handleExportAll = async () => {
    const json = await exportAllCharacters();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `all_characters_${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: t.backupDone, description: t.backupDoneDesc });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.characters) {
        for (const entry of data.characters) await importCharacter(JSON.stringify(entry));
        toast({ title: t.imported, description: t.importedDesc(data.characters.length) });
      } else {
        const char = await importCharacter(text);
        toast({ title: t.imported, description: t.importedOne(char.name) });
      }
      refresh();
    } catch {
      toast({ title: t.error, description: t.importError, variant: 'destructive' });
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <div className="px-4 animate-fade-in max-w-4xl mx-auto">

      {/* ── Hero section ── */}
      <div className="text-center pt-10 pb-8">
        {/* Emblema */}
        <div className="relative inline-flex items-center justify-center mb-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)/0.12), hsl(var(--primary)/0.04))',
              border: '1px solid hsl(var(--primary)/0.25)',
              boxShadow: '0 0 32px -8px hsl(var(--primary)/0.2)',
              color: 'hsl(var(--primary))',
            }}>
            <HeroEmblem />
          </div>
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ boxShadow: 'inset 0 1px 0 hsl(var(--primary)/0.15)' }} />
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2 tracking-wide">
          {t.appName}
        </h1>
        <div className="divider-arcane max-w-[160px] mx-auto my-3" />
        <p className="text-muted-foreground text-sm">{t.appTagline}</p>
      </div>

      {/* ── Actions ── */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        <button onClick={() => navigate('/create')} className="btn-primary">
          <Plus className="w-4 h-4" /> {t.newCharacter}
        </button>
        <button onClick={() => fileInput.current?.click()} className="btn-secondary">
          <Upload className="w-4 h-4" /> {t.import}
        </button>
        {characters.length > 0 && (
          <button onClick={handleExportAll} className="btn-secondary">
            <FileDown className="w-4 h-4" /> {t.backupAll}
          </button>
        )}
        <input ref={fileInput} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>

      {/* ── Character list ── */}
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
        <div className="empty-state pb-20">
          <div className="empty-state-icon w-16 h-16 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--muted)))',
              border: '1px solid hsl(var(--border))',
            }}>
            <Users className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-display text-lg font-semibold mb-2">{t.noAdventurers}</p>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
            {t.noAdventurersDesc}
          </p>
          <button onClick={() => navigate('/create')} className="btn-primary">
            <Plus className="w-4 h-4" /> {t.createCharacter}
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pb-10">
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
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--muted)))',
                    border: '1px solid hsl(var(--border))',
                  }}>
                  {(() => {
                    const visual = getCharacterVisual(char);
                    return visual === null
                      ? <img src={char.portrait!} alt="" className="w-full h-full object-cover" />
                      : <span className="select-none">{visual.emoji}</span>;
                  })()}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold truncate text-sm leading-snug">{char.name}</h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {char.race}{char.race && char.classes[0]?.name ? ' · ' : ''}
                    {char.classes.map(c => `${c.name} ${c.level}`).join(' / ')}
                  </p>
                  <p className="text-[0.65rem] mt-0.5" style={{ color: 'hsl(var(--gold))' }}>
                    {t.level} {totalLevel(char)}
                  </p>
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex gap-2 mt-3">
                <span className="chip">HP {char.hpCurrent}/{char.hpMax}</span>
                <span className="chip">CA {char.armorClass}</span>
              </div>

              {/* Actions */}
              <div
                className="flex gap-1 mt-3 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity duration-150"
                onClick={e => e.stopPropagation()}
              >
                <button onClick={() => handleExport(char.id, char.name)}
                  className="btn-icon p-1.5 rounded-lg" title={t.exportChar} aria-label={`${t.exportChar} ${char.name}`}>
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => duplicate(char.id)}
                  className="btn-icon p-1.5 rounded-lg" title={t.duplicateChar} aria-label={`${t.duplicateChar} ${char.name}`}>
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { if (confirm(t.deleteConfirm(char.name))) remove(char.id); }}
                  className="btn-icon p-1.5 rounded-lg hover:text-destructive focus-visible:text-destructive"
                  title={t.deleteChar} aria-label={`${t.deleteChar} ${char.name}`}>
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
