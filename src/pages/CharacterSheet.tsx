import { useParams, useNavigate } from 'react-router-dom';
import { useCharacter } from '@/hooks/useCharacter';
import { useI18n } from '@/lib/i18n';
import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, Eye, Edit3, CheckCircle2, FileDown, ChevronDown } from 'lucide-react';
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
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';

type TabKey = 'Stats' | 'Combat' | 'Spells' | 'Inventory' | 'Features' | 'Profile' | 'Notes';

/** Monta o CharacterPrint num container isolado, aguarda render completo, dispara print, desmonta. */
function triggerPrint(
  character: Parameters<typeof CharacterPrint>[0]['character'],
  t: Parameters<typeof CharacterPrint>[0]['t'],
  pageIndex?: number, // undefined = todas as páginas
) {
  // Garante container limpo
  let container = document.getElementById('print-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'print-root';
    document.body.appendChild(container);
  }
  container.classList.add('active');

  // Se for página específica, injeta CSS de controle de página
  let styleEl: HTMLStyleElement | null = null;
  if (pageIndex !== undefined) {
    styleEl = document.createElement('style');
    styleEl.id = 'print-page-filter';
    // Oculta todas as .print-page exceto a selecionada
    styleEl.textContent = `.print-page { display: none !important; } .print-page:nth-child(${pageIndex + 1}) { display: block !important; }`;
    document.head.appendChild(styleEl);
  }

  const root = createRoot(container);
  
  // Renderiza sincronamente e aguarda múltiplos frames para garantir layout
  flushSync(() => {
    root.render(<CharacterPrint character={character} t={t} />);
  });

  // Aguarda múltiplos animation frames para garantir renderização e layout completos
  let frameCount = 0;
  const maxFrames = 5;
  
  const checkAndPrint = () => {
    frameCount++;
    if (frameCount >= maxFrames) {
      // Extra timeout para garantir que o layout está completamente pronto
      setTimeout(() => {
        // Força recalc de layout
        const sheet = document.querySelector('.print-sheet');
        if (sheet) {
          sheet.getBoundingClientRect(); // força reflow
        }
        
        // Aguarda mais um frame antes de imprimir
        requestAnimationFrame(() => {
          window.print();
          
          // Cleanup após o diálogo de impressão fechar
          setTimeout(() => {
            root.unmount();
            container!.classList.remove('active');
            if (styleEl) { styleEl.remove(); }
          }, 1000);
        });
      }, 100);
    } else {
      requestAnimationFrame(checkAndPrint);
    }
  };

  requestAnimationFrame(checkAndPrint);
}

export default function CharacterSheet() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { character, loading, error, updateCharacter, lastSaved } = useCharacter(id);
  const [activeTab, setActiveTab] = useState<TabKey>('Stats');
  const [mode, setMode] = useState<AppMode>('edit');
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const pdfMenuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    if (!pdfMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (pdfMenuRef.current && !pdfMenuRef.current.contains(e.target as Node)) {
        setPdfMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pdfMenuOpen]);

  const handlePrintFull = useCallback(() => {
    if (!character) return;
    setPdfMenuOpen(false);
    triggerPrint(character, t);
  }, [character, t]);

  // Mapeia a tab ativa para o índice de página no CharacterPrint
  const getPageIndexForTab = (tab: TabKey): number => {
    if (tab === 'Stats' || tab === 'Combat') return 0;
    if (tab === 'Spells' || tab === 'Inventory') return 1;
    if (tab === 'Features') return 2;
    return 2; // Profile, Notes
  };

  const handlePrintCurrentPage = useCallback(() => {
    if (!character) return;
    setPdfMenuOpen(false);
    triggerPrint(character, t, getPageIndexForTab(activeTab));
  }, [character, t, activeTab]);

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

          {/* PDF export dropdown */}
          <div className="relative" ref={pdfMenuRef}>
            <button
              onClick={() => setPdfMenuOpen(v => !v)}
              className="btn-icon p-1.5 flex items-center gap-0.5"
              title="Exportar PDF"
              aria-label="Exportar PDF"
              aria-expanded={pdfMenuOpen}
            >
              <FileDown className="w-4 h-4" />
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {pdfMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-50 rounded-lg border overflow-hidden animate-scale-in"
                style={{
                  background: 'hsl(var(--card))',
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: '11rem',
                }}
              >
                <button
                  onClick={handlePrintFull}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-left hover:bg-secondary transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{t.exportPdfFull}</span>
                </button>
                <div className="h-px bg-border mx-2" />
                <button
                  onClick={handlePrintCurrentPage}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-left hover:bg-secondary transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>{t.exportPdfPage}</span>
                </button>
              </div>
            )}
          </div>

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
