import { useState } from 'react';
import { useDiceRoller } from '@/hooks/useDiceRoller';
import { Trash2, Dices } from 'lucide-react';

const QUICK_DICE = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', '2d6', 'd100'];

export function DiceRollerPanel() {
  const { roll, history, lastRoll, isRolling, clear } = useDiceRoller();
  const [custom, setCustom] = useState('');

  const handleCustomRoll = () => {
    if (custom.trim()) { roll(custom.trim()); setCustom(''); }
  };

  return (
    <div className="flex flex-col h-[calc(100%-3rem)] overflow-hidden">
      {/* Last roll display */}
      <div className="p-5 text-center border-b" style={{ background: 'hsl(var(--muted) / 0.4)' }}>
        {lastRoll ? (
          <div className={isRolling ? 'animate-dice-roll' : 'animate-scale-in'}>
            <p className="font-display text-5xl font-bold leading-none" style={{ color: 'hsl(var(--primary))' }}>
              {lastRoll.total}
            </p>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              {lastRoll.expression} → [{lastRoll.results.join(', ')}]
            </p>
            {lastRoll.label && (
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--gold))' }}>{lastRoll.label}</p>
            )}
          </div>
        ) : (
          <div className="py-2">
            <Dices className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Roll some dice!</p>
          </div>
        )}
      </div>

      {/* Quick dice buttons */}
      <div className="p-3 border-b">
        <div className="grid grid-cols-4 gap-1.5">
          {QUICK_DICE.map(d => (
            <button
              key={d}
              onClick={() => roll(d)}
              className="px-2 py-2 text-xs font-semibold rounded-lg transition-all duration-150 active:scale-95"
              style={{
                background: 'hsl(var(--secondary))',
                color: 'hsl(var(--secondary-foreground))',
                border: '1px solid hsl(var(--border))',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'hsl(var(--primary))';
                (e.currentTarget as HTMLElement).style.color = 'hsl(var(--primary-foreground))';
                (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--primary))';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'hsl(var(--secondary))';
                (e.currentTarget as HTMLElement).style.color = 'hsl(var(--secondary-foreground))';
                (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))';
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Custom input */}
      <div className="p-3 border-b flex gap-2">
        <input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCustomRoll()}
          placeholder="e.g. 2d8+3"
          className="input-base flex-1 font-mono text-xs"
          aria-label="Custom dice expression"
        />
        <button onClick={handleCustomRoll} className="btn-primary px-3 py-1.5 text-xs">
          Roll
        </button>
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
          <span className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">History</span>
          {history.length > 0 && (
            <button onClick={clear} className="btn-icon p-1" aria-label="Clear history">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        {history.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No rolls yet</p>
        )}
        {history.map((r, i) => (
          <div
            key={r.id}
            className="px-3 py-2 flex justify-between items-center text-xs border-b border-border/40 transition-colors hover:bg-secondary/40"
            style={{ animationDelay: `${i * 20}ms` }}
          >
            <span className="text-muted-foreground font-mono">
              {r.expression}{r.label ? ` · ${r.label}` : ''}
            </span>
            <span className="font-bold tabular-nums" style={{ color: 'hsl(var(--primary))' }}>
              {r.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
