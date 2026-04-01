import { useParams, useNavigate } from 'react-router-dom';
import { useCharacter } from '@/hooks/useCharacter';
import { useState } from 'react';
import { ArrowLeft, Eye, Edit3, Save } from 'lucide-react';
import { totalLevel } from '@/lib/calculations';
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

  if (loading) return <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Loading character...</div>;
  if (error || !character) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <p className="text-muted-foreground">Character not found.</p>
      <button onClick={() => navigate('/')} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Go Home</button>
    </div>
  );

  return (
    <div className="animate-fade-in pb-20">
      {/* Top bar */}
      <div className="sticky top-[49px] z-40 bg-card/90 backdrop-blur-md border-b px-4 py-2 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="p-1 rounded hover:bg-secondary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Save className="w-3 h-3" /> Saved
            </span>
          )}
          <button
            onClick={() => setMode(mode === 'edit' ? 'session' : 'edit')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              mode === 'session' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {mode === 'session' ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
            {mode === 'session' ? 'Session' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Character header */}
      <CharacterHeader character={character} updateCharacter={updateCharacter} mode={mode} />

      {/* Tab navigation */}
      <div className="sticky top-[97px] z-30 bg-background border-b overflow-x-auto scrollbar-thin">
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
      <div className="px-4 py-4">
        {activeTab === 'Stats' && <StatsTab character={character} updateCharacter={updateCharacter} mode={mode} />}
        {activeTab === 'Combat' && <CombatTab character={character} updateCharacter={updateCharacter} mode={mode} />}
        {activeTab === 'Spells' && <SpellsTab character={character} updateCharacter={updateCharacter} mode={mode} />}
        {activeTab === 'Inventory' && <InventoryTab character={character} updateCharacter={updateCharacter} mode={mode} />}
        {activeTab === 'Features' && <FeaturesTab character={character} updateCharacter={updateCharacter} mode={mode} />}
        {activeTab === 'Profile' && <ProfileTab character={character} updateCharacter={updateCharacter} mode={mode} />}
        {activeTab === 'Notes' && <NotesTab character={character} updateCharacter={updateCharacter} mode={mode} />}
      </div>
    </div>
  );
}
