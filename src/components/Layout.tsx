import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Dice5, Home, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { DiceRollerPanel } from '@/components/DiceRoller';

export default function Layout() {
  const { toggle, theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [diceOpen, setDiceOpen] = useState(false);
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-2 max-w-6xl mx-auto">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-lg">🐉</span>
            <span className="font-display text-sm font-semibold hidden sm:inline">D&D Character Sheet</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setDiceOpen(!diceOpen)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title="Dice Roller"
            >
              <Dice5 className="w-5 h-5" />
            </button>
            <button
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <Outlet />
      </main>

      {/* Dice roller slide-over */}
      {diceOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 max-w-full bg-card border-l shadow-2xl animate-slide-in">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-display text-sm font-semibold">Dice Roller</h2>
            <button onClick={() => setDiceOpen(false)} className="p-1 rounded hover:bg-secondary">
              <X className="w-4 h-4" />
            </button>
          </div>
          <DiceRollerPanel />
        </div>
      )}
      {diceOpen && <div className="fixed inset-0 z-40 bg-foreground/20" onClick={() => setDiceOpen(false)} />}

      {/* Data warning footer */}
      <footer className="border-t py-3 px-4 text-center">
        <p className="text-xs text-muted-foreground">
          ⚠️ Character data is stored locally in this browser. Export your characters regularly to avoid data loss.
        </p>
      </footer>
    </div>
  );
}
