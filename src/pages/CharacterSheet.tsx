import { useParams, useNavigate } from 'react-router-dom';
import { useCharacter } from '@/hooks/useCharacter';
import { useI18n } from '@/lib/i18n';
import { useState, useRef, useCallback } from 'react';
import { ArrowLeft, Eye, Edit3, CheckCircle2, FileDown } from 'lucide-react';
import type { AppMode } from '@/lib/types';
import { CharacterHeader } from '@/components/character/CharacterHeader';
import { StatsTab } from '@/components/character/StatsTab';
import { CombatTab } from '@/components/character/CombatTab';
import { SpellsTab } from '@/components/character/SpellsTab';
import { InventoryTab } from '@/components/character/InventoryTab';
import { FeaturesTab } from '@/components/character/FeaturesTab';
import { ProfileTab } from '@/components/character/ProfileTab';
import { NotesTab } from '@/components/character/NotesTab';
import { CharacterPrint } from '@/components/character/CharacterPrint';
import ReactDOM from 'react-dom';

type TabKey = 'Stats' | 'Combat' | 'Spells' | 'Inventory' | 'Features' | 'Profile' | 'Notes';

export default function CharacterSheet() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { character, loading, error, updateCharacter, lastSaved } = useCharacter(id);
  const [activeTab, setActiveTab] = useState<TabKey>('Stats');
  const [mode, setMode] = useState<AppMode>('edit');

  const handlePrint = useCallback(() => {
    if (!character) return;
    let el = document.getElementById('print-root');
    if (!el) { el = document.createElement('div'); el.id = 'print-root'; document.body.appendChild(el); }
    el.classList.add('active');
    ReactDOM.render(<CharacterPrint character={character} t={t} />, el, () => {
      window.print();
      setTimeout(() => { el!.classList.remove('active'); ReactDOM.unmountComponentAtNode(el!); }, 500);
    });
  }, [character, t]);

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'Stats',     label: t.tabStats },
    { key: 'Combat',    label: t.tabCombat },
    { key: 'Spells',    label: t.tabSpells },
    { key: 'Inventory', label: t.tabInventory },
    { key: 'Features',  label: t.tabFeatures },
    { key: 'Profile',   label: t.tabProfile },
    { key: 'Notes',     label: t.tabNotes },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-sm text-muted-foreground">{t.loadingCharacter}</p>
    </div>
  );

  if (error || !character) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
      <div className="empty-state-icon"><span className="text-2xl">⚠️</span></div>
      <p className="font-display text-base font-semibold">{t.characterNotFound}</p>
      <p className="text-sm text-muted-foreground">{t.characterNotFoundDesc}</p>
      <button onClick={() => navigate('/')} className="btn-primary mt-2">{t.returnHome}</button>
    </div>
  );

  return (
    <div className="animate-fade-in pb-24">
      {/* Sub-header bar */}
      <div
        className="sticky top-12 z-40 border-b px-4 py-2 flex items-center justify-between backdrop-blur-md"
        style={{ background: 'hsl(var(--card) / 0.92)' }}
      >
        <button onClick={() => navigate('/')} className="btn-icon p-1.5" aria-label={t.back}>
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 animate-fade-in">
              <CheckCircle2 className="w-3 h-3 text-green-500" /> {t.saved}
            </span>
          )}
          <button
            onClick={handlePrint}
            className="btn-icon p-1.5"
            title="PDF"
            aria-label="Export PDF"
          >
            <FileDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMode(mode === 'edit' ? 'session' : 'edit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              mode === 'session'
                ? 'text-primary-foreground animate-pulse-glow'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
            style={mode === 'session' ? { background: 'hsl(var(--primary))' } : {}}
          >
            {mode === 'session' ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
            {mode === 'session' ? t.sessionMode : t.editMode}
          </button>
        </div>
      </div>

      {/* Character header */}
      <CharacterHeader character={character} updateCharacter={updateCharacter} mode={mode} />

      {/* Tab navigation */}
      <div
        className="sticky z-30 border-b overflow-x-auto scrollbar-thin"
        style={{ top: '96px', background: 'hsl(var(--background) / 0.95)', backdropFilter: 'blur(8px)' }}
      >
        <div className="flex gap-1 px-4 py-2 min-w-max">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`tab-pill ${activeTab === key ? 'tab-pill-active' : 'tab-pill-inactive'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 py-5">
        {activeTab === 'Stats'     && <StatsTab     character={character} updateCharacter={updateCharacter} mode={mode} />}
        {activeTab === 'Combat'    && <CombatTab    character={character} updateCharacter={updateCharacter} mode={mode} />}
        {activeTab === 'Spells'    && <SpellsTab    character={character} updateCharacter={updateCharacter} mode={mode} />}
        {activeTab === 'Inventory' && <InventoryTab character={character} updateCharacter={updateCharacter} mode={mode} />}
        {activeTab === 'Features'  && <FeaturesTab  character={character} updateCharacter={updateCharacter} mode={mode} />}
        {activeTab === 'Profile'   && <ProfileTab   character={character} updateCharacter={updateCharacter} mode={mode} />}
        {activeTab === 'Notes'     && <NotesTab     character={character} updateCharacter={updateCharacter} mode={mode} />}
      </div>
    </div>
  );
}
