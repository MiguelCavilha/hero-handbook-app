import { useState } from 'react';
import { useDiceRoller } from '@/hooks/useDiceRoller';
import { useI18n } from '@/lib/i18n';
import { Trash2 } from 'lucide-react';

// Ícones SVG originais de dados (não infringe nenhuma marca)
function DieIcon({ sides, size = 20 }: { sides: number; size?: number }) {
  const s = size;
  const c = s / 2;
  const props = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinejoin: 'round' as const };

  if (sides === 4) {
    const h = s * 0.85; const base = s * 0.9; const bx = (s - base) / 2;
    return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><polygon points={`${c},${(s-h)/2} ${bx},${s*0.9} ${bx+base},${s*0.9}`} {...props}/></svg>;
  }
  if (sides === 6) {
    const r = s * 0.38; const cx = c; const cy = c;
    const pts = Array.from({length:4},(_,i)=>{const a=Math.PI/4+i*Math.PI/2;return `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`;}).join(' ');
    return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={s*0.12} y={s*0.12} width={s*0.76} height={s*0.76} rx={s*0.12} {...props}/></svg>;
  }
  if (sides === 8) {
    const r = s * 0.42;
    const pts = Array.from({length:8},(_,i)=>{const a=i*Math.PI/4-Math.PI/8;return `${c+r*Math.cos(a)},${c+r*Math.sin(a)}`;}).join(' ');
    return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><polygon points={pts} {...props}/></svg>;
  }
  if (sides === 10) {
    const pts = Array.from({length:10},(_,i)=>{const r=i%2===0?s*0.44:s*0.22;const a=i*Math.PI/5-Math.PI/2;return `${c+r*Math.cos(a)},${c+r*Math.sin(a)}`;}).join(' ');
    return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><polygon points={pts} {...props}/></svg>;
  }
  if (sides === 12) {
    const pts = Array.from({length:12},(_,i)=>{const r=s*0.42;const a=i*Math.PI/6-Math.PI/2;return `${c+r*Math.cos(a)},${c+r*Math.sin(a)}`;}).join(' ');
    return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><polygon points={pts} {...props}/></svg>;
  }
  if (sides === 20) {
    const pts = Array.from({length:20},(_,i)=>{const r=i%2===0?s*0.44:s*0.28;const a=i*Math.PI/10-Math.PI/2;return `${c+r*Math.cos(a)},${c+r*Math.sin(a)}`;}).join(' ');
    return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><polygon points={pts} {...props}/></svg>;
  }
  // d100 / fallback
  return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><circle cx={c} cy={c} r={s*0.42} {...props}/></svg>;
}

const DICE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;
type DieSides = typeof DICE_SIDES[number];
type RollMode = 'normal' | 'advantage' | 'disadvantage';

export function DiceRollerPanel() {
  const { roll, history, lastRoll, isRolling, clear } = useDiceRoller();
  const { t } = useI18n();

  const [selectedDie, setSelectedDie] = useState<DieSides>(20);
  const [qty, setQty] = useState(1);
  const [mod, setMod] = useState(0);
  const [mode, setMode] = useState<RollMode>('normal');
  const [custom, setCustom] = useState('');

  const handleRoll = () => {
    if (mode === 'advantage' || mode === 'disadvantage') {
      // Rola 2d20, mantém o maior (vantagem) ou menor (desvantagem)
      const expr = `2d20`;
      roll(expr, mode === 'advantage' ? t.advantageLabel : t.disadvantageLabel, {
        keepHighest: mode === 'advantage' ? 1 : undefined,
        keepLowest: mode === 'disadvantage' ? 1 : undefined,
        modifier: mod,
      });
    } else {
      const modStr = mod > 0 ? `+${mod}` : mod < 0 ? `${mod}` : '';
      roll(`${qty}d${selectedDie}${modStr}`);
    }
  };

  const handleCustomRoll = () => {
    if (custom.trim()) { roll(custom.trim()); setCustom(''); }
  };

  const isD20Mode = selectedDie === 20 && qty === 1;

  return (
    <div className="flex flex-col h-[calc(100%-3rem)] overflow-hidden">

      {/* ── Result display ── */}
      <div className="relative px-4 py-5 text-center border-b overflow-hidden"
        style={{ background: 'linear-gradient(160deg, hsl(var(--muted)/0.6) 0%, hsl(var(--card)) 100%)' }}>
        {/* Decorative background die */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.04]">
          <DieIcon sides={selectedDie} size={140} />
        </div>

        {lastRoll ? (
          <div className={isRolling ? 'animate-dice-roll' : 'animate-scale-in'} key={lastRoll.id}>
            <p className="font-display text-6xl font-bold leading-none tabular-nums"
              style={{ color: 'hsl(var(--primary))' }}>
              {lastRoll.total}
            </p>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              {t.rollDetails(lastRoll.expression, lastRoll.results.join(', '))}
            </p>
            {lastRoll.label && (
              <span className="chip-gold text-[0.65rem] mt-1.5 inline-flex">{lastRoll.label}</span>
            )}
          </div>
        ) : (
          <div className="py-3">
            <DieIcon sides={20} size={36} />
            <p className="text-sm text-muted-foreground mt-2">{t.rollDicePrompt}</p>
          </div>
        )}
      </div>

      {/* ── Die selector ── */}
      <div className="px-3 pt-3 pb-2 border-b">
        <div className="grid grid-cols-7 gap-1">
          {DICE_SIDES.map(sides => (
            <button
              key={sides}
              onClick={() => { setSelectedDie(sides); if (sides === 100) setQty(1); }}
              aria-pressed={selectedDie === sides}
              className="flex flex-col items-center gap-0.5 py-2 rounded-lg text-[0.6rem] font-bold uppercase tracking-wide transition-all duration-150 active:scale-90"
              style={selectedDie === sides ? {
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                boxShadow: 'var(--shadow-sm), 0 0 10px -2px hsl(var(--primary)/0.5)',
              } : {
                background: 'hsl(var(--secondary))',
                color: 'hsl(var(--muted-foreground))',
                border: '1px solid hsl(var(--border))',
              }}
            >
              <DieIcon sides={sides} size={18} />
              d{sides === 100 ? '%' : sides}
            </button>
          ))}
        </div>
      </div>

      {/* ── Controls: qty + modifier ── */}
      <div className="px-3 py-2.5 border-b flex items-center gap-3">
        {/* Quantity */}
        <div className="flex items-center gap-1.5">
          <span className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground w-6">{t.quantity}</span>
          <button onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-6 h-6 rounded-md text-xs font-bold transition-all active:scale-90"
            style={{ background: 'hsl(var(--secondary))' }}>−</button>
          <span className="w-5 text-center text-sm font-bold tabular-nums">{qty}</span>
          <button onClick={() => setQty(q => Math.min(20, q + 1))}
            className="w-6 h-6 rounded-md text-xs font-bold transition-all active:scale-90"
            style={{ background: 'hsl(var(--secondary))' }}>+</button>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Modifier */}
        <div className="flex items-center gap-1.5">
          <span className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground w-6">{t.modifier}</span>
          <button onClick={() => setMod(m => m - 1)}
            className="w-6 h-6 rounded-md text-xs font-bold transition-all active:scale-90"
            style={{ background: 'hsl(var(--secondary))' }}>−</button>
          <span className="w-8 text-center text-sm font-bold tabular-nums"
            style={{ color: mod !== 0 ? 'hsl(var(--primary))' : undefined }}>
            {mod > 0 ? `+${mod}` : mod}
          </span>
          <button onClick={() => setMod(m => m + 1)}
            className="w-6 h-6 rounded-md text-xs font-bold transition-all active:scale-90"
            style={{ background: 'hsl(var(--secondary))' }}>+</button>
        </div>

        {/* Advantage/Disadvantage — só para d20 único */}
        {isD20Mode && (
          <>
            <div className="w-px h-6 bg-border" />
            <div className="flex gap-1 flex-1">
              {(['normal', 'advantage', 'disadvantage'] as RollMode[]).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className="flex-1 py-1 rounded-md text-[0.55rem] font-bold uppercase tracking-wide transition-all duration-150 active:scale-95"
                  style={mode === m ? {
                    background: m === 'advantage' ? 'hsl(142 45% 38%)' : m === 'disadvantage' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                  } : {
                    background: 'hsl(var(--secondary))',
                    color: 'hsl(var(--muted-foreground))',
                  }}>
                  {m === 'normal' ? t.normal : m === 'advantage' ? t.advantageLabel : t.disadvantageLabel}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Roll button ── */}
      <div className="px-3 py-2.5 border-b">
        <button onClick={handleRoll}
          className="btn-primary w-full py-2.5 text-sm font-semibold tracking-wide"
          style={{ letterSpacing: '0.05em' }}>
          {qty}d{selectedDie === 100 ? '%' : selectedDie}{mod !== 0 ? (mod > 0 ? `+${mod}` : mod) : ''}{isD20Mode && mode !== 'normal' ? ` · ${mode === 'advantage' ? t.advantageLabel : t.disadvantageLabel}` : ''} — {t.roll}
        </button>
      </div>

      {/* ── Custom expression ── */}
      <div className="px-3 py-2 border-b flex gap-2">
        <input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCustomRoll()}
          placeholder={t.rollPlaceholder}
          className="input-base flex-1 font-mono text-xs h-8 py-1"
          aria-label={t.rollPlaceholder}
        />
        <button onClick={handleCustomRoll} className="btn-secondary px-3 py-1 text-xs h-8">
          {t.roll}
        </button>
      </div>

      {/* ── History ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
          <span className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
            {t.rollHistory}
          </span>
          {history.length > 0 && (
            <button onClick={clear} className="btn-icon p-1" aria-label={t.clearHistory}>
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        {history.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">{t.noRollsYet}</p>
        )}
        {history.map(r => (
          <div key={r.id}
            className="px-3 py-1.5 flex justify-between items-center text-xs border-b border-border/30 hover:bg-secondary/30 transition-colors">
            <div className="min-w-0">
              <span className="font-mono text-muted-foreground truncate block">{r.expression}</span>
              {r.label && <span className="text-[0.6rem]" style={{ color: 'hsl(var(--gold))' }}>{r.label}</span>}
            </div>
            <span className="font-bold tabular-nums ml-2 shrink-0" style={{ color: 'hsl(var(--primary))' }}>
              {r.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
