import { useParams, useNavigate } from 'react-router-dom';
import { useCharacter } from '@/hooks/useCharacter';
import { useState } from 'react';
import { ArrowLeft, Eye, Edit3, CheckCircle2 } from 'lucide-react';
import type { AppMode } from '@/lib/types';
import { CharacterHeader } from '@/components/character/CharacterHeader';
import { StatsTab } from '@/components/character/StatsTab';
import { CombatTab } from '@/components/character/CombatTab';
import { SpellsTab } from '@/components/character/SpellsTab';
import { InventoryTab } from '@/components/character/InventoryTab';
import { FeaturesTab } from '@/components/character/FeaturesTab';
import { ProfileTab } from '@/components/character/ProfileTab';
import { NotesTab } from '@/components/character/NotesTab';

const TABS = ['Stats', 'Combat', 'Spells', 'Inventory', 'Features', 'Profile', 'Notes'];

export default function CharacterSheet() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { character, loading, error, updateCharacter, lastSaved } = useCharacter(id);
  const [activeTab, setActiveTab] = useState('Stats');
  const [mode, setMode] = useState<AppMode>('edit');

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-sm text-muted-foreground">Loading character...</p>
    </div>
  );

  if (error || !character) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
      <div className="empty-state-icon">
        <span className="text-2xl">⚠️</span>
      </div>
      <p className="font-display text-base font-semibold">Character not found</p>
      <p className="text-sm text-muted-foreground">This adventurer may have been lost to the void.</p>
      <button onClick={() => navigate('/')} className="btn-primary mt-2">
        Return Home
      </button>
    </div>
  );

  return (
    <div className="animate-fade-in pb-24">
      {/* Sub-header bar */}
      <div
        className="sticky top-12 z-40 border-b px-4 py-2 flex items-center justify-between backdrop-blur-md"
        style={{ background: 'hsl(var(--card) / 0.92)' }}
      >
        <button onClick={() => navigate('/')} className="btn-icon p-1.5" aria-label="Back to list">
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>

        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 animate-fade-in">
              <CheckCircle2 className="w-3 h-3 text-green-500" /> Saved
            </span>
          )}
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
            {mode === 'session' ? 'Session' : 'Edit'}
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
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-pill ${activeTab === tab ? 'tab-pill-active' : 'tab-pill-inactive'}`}
            >
              {tab}
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
