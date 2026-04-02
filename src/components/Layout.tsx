import { Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Dice5, X } from 'lucide-react';
import { useState } from 'react';
import { DiceRollerPanel } from '@/components/DiceRoller';

export default function Layout() {
  const { toggle, theme } = useTheme();
  const navigate = useNavigate();
  const [diceOpen, setDiceOpen] = useState(false);
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b bg-card/85 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 h-12 max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 hover:opacity-80 active:opacity-60 transition-opacity focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1"
          >
            <span className="text-base leading-none">⚔️</span>
            <span className="font-display text-sm font-semibold tracking-wide hidden sm:inline">
              Hero Handbook
            </span>
          </button>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setDiceOpen(!diceOpen)}
              className="btn-icon"
              title="Dice Roller"
              aria-label="Open dice roller"
            >
              <Dice5 className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={toggle}
              className="btn-icon"
              title="Toggle theme"
              aria-label="Toggle color theme"
            >
              {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
        {/* Arcane separator */}
        <div className="divider-arcane" />
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Dice roller slide-over */}
      {diceOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setDiceOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-80 max-w-[92vw] flex flex-col animate-slide-in"
            style={{ background: 'hsl(var(--card))', borderLeft: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <Dice5 className="w-4 h-4 text-primary" />
                <h2 className="font-display text-sm font-semibold">Dice Roller</h2>
              </div>
              <button onClick={() => setDiceOpen(false)} className="btn-icon" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <DiceRollerPanel />
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="border-t py-2.5 px-4 text-center">
        <p className="text-xs text-muted-foreground/70">
          Data stored locally · Export regularly to avoid loss
        </p>
      </footer>
    </div>
  );
}
