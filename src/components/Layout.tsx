import { Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/lib/i18n';
import { Sun, Moon, X } from 'lucide-react';
import { useState } from 'react';
import { DiceRollerPanel } from '@/components/DiceRoller';

// Ícone de dado d20 original (SVG inline, sem marca registrada)
function D20Icon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinejoin="round" className={className}>
      <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" />
      <polygon points="12,2 17,8 12,11 7,8" />
      <polygon points="2,8 7,8 12,11 2,16" />
      <polygon points="22,8 17,8 12,11 22,16" />
      <polygon points="12,11 7,8 2,16 12,22 22,16 17,8" />
    </svg>
  );
}

// Emblema original — escudo estilizado com runa central
function AppEmblem({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 2 L28 7 L28 18 Q28 26 16 30 Q4 26 4 18 L4 7 Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
        fill="hsl(var(--primary)/0.08)" />
      <path d="M16 8 L16 24 M11 12 L21 12 M11 18 L21 18"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Layout() {
  const { toggle, theme } = useTheme();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [diceOpen, setDiceOpen] = useState(false);
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ background: 'hsl(var(--card)/0.88)' }}>
        <div className="flex items-center justify-between px-4 h-12 max-w-6xl mx-auto">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 hover:opacity-80 active:opacity-60 transition-opacity rounded-md px-1 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span style={{ color: 'hsl(var(--primary))' }}>
              <AppEmblem size={26} />
            </span>
            <span className="font-display text-sm font-semibold tracking-wide hidden sm:inline">
              {t.appName}
            </span>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-0.5">
            {/* Language switcher */}
            <button
              onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
              className="btn-icon px-2 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider rounded-lg"
              title={t.language}
              aria-label={t.language}
            >
              {lang === 'pt' ? 'EN' : 'PT'}
            </button>

            {/* Dice roller */}
            <button
              onClick={() => setDiceOpen(!diceOpen)}
              className="btn-icon"
              title={t.diceRoller}
              aria-label={t.diceRoller}
            >
              <D20Icon className="w-5 h-5" />
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="btn-icon"
              title={t.toggleTheme}
              aria-label={t.toggleTheme}
            >
              {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
        <div className="divider-arcane" />
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full">
        <Outlet />
      </main>

      {/* ── Dice roller slide-over ── */}
      {diceOpen && (
        <>
          <div
            className="fixed inset-0 z-40 backdrop-blur-sm"
            style={{ background: 'hsl(var(--foreground)/0.25)' }}
            onClick={() => setDiceOpen(false)}
          />
          <div
            className="fixed inset-y-0 right-0 z-50 w-80 max-w-[92vw] flex flex-col animate-slide-in"
            style={{
              background: 'hsl(var(--card))',
              borderLeft: '1px solid hsl(var(--border))',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <D20Icon className="w-4 h-4 text-primary" />
                <h2 className="font-display text-sm font-semibold">{t.diceRoller}</h2>
              </div>
              <button onClick={() => setDiceOpen(false)} className="btn-icon" aria-label={t.close}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <DiceRollerPanel />
          </div>
        </>
      )}

      {/* ── Footer ── */}
      <footer className="border-t py-2.5 px-4 text-center">
        <p className="text-xs text-muted-foreground/60">{t.dataWarning}</p>
      </footer>
    </div>
  );
}
