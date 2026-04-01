import { useState } from 'react';
import { useDiceRoller } from '@/hooks/useDiceRoller';
import { Dice5, Trash2 } from 'lucide-react';

const QUICK_DICE = ['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '2d6', '1d20+5'];

export function DiceRollerPanel() {
  const { roll, history, lastRoll, isRolling, clear } = useDiceRoller();
  const [custom, setCustom] = useState('');

  const handleCustomRoll = () => {
    if (custom.trim()) {
      roll(custom.trim());
      setCustom('');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100%-3.5rem)] overflow-hidden">
      {/* Last roll display */}
      <div className="p-4 text-center border-b">
        {lastRoll ? (
          <div className={isRolling ? 'animate-dice-roll' : ''}>
            <p className="text-3xl font-bold font-display">{lastRoll.total}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {lastRoll.expression} → [{lastRoll.results.join(', ')}]
            </p>
            {lastRoll.label && <p className="text-xs text-muted-foreground">{lastRoll.label}</p>}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Roll some dice!</p>
        )}
      </div>

      {/* Quick buttons */}
      <div className="p-3 border-b">
        <div className="grid grid-cols-4 gap-1.5">
          {QUICK_DICE.map(d => (
            <button
              key={d}
              onClick={() => roll(d)}
              className="px-2 py-1.5 text-xs font-medium rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
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
          className="flex-1 px-3 py-1.5 text-sm rounded-md border bg-background"
        />
        <button
          onClick={handleCustomRoll}
          className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90"
        >
          Roll
        </button>
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between px-3 pt-2 pb-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">History</span>
          {history.length > 0 && (
            <button onClick={clear} className="p-1 rounded hover:bg-secondary">
              <Trash2 className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
        {history.map(r => (
          <div key={r.id} className="px-3 py-1.5 text-sm flex justify-between border-b border-border/50">
            <span className="text-muted-foreground">{r.expression}{r.label ? ` (${r.label})` : ''}</span>
            <span className="font-semibold">{r.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
