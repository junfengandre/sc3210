import React from 'react';
import { Watch, ClipboardCheck } from 'lucide-react';
import { SleepScore, bandClasses, bandBarColor } from '../lib/sleepScore';

interface ScoreBadgeProps {
  score: SleepScore;
  isDark: boolean;
  size?: 'sm' | 'lg';
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, isDark, size = 'sm' }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-md border font-mono font-bold tabular-nums ${bandClasses(
      score.band,
      isDark
    )} ${size === 'lg' ? 'px-2 py-1 text-sm' : 'px-1.5 py-0.5 text-[11px]'}`}
    title={`Sleep score ${score.total} · ${score.band}${score.typed ? ' · typed in' : ''}`}
  >
    {score.usesWearable && <Watch className={size === 'lg' ? 'h-3.5 w-3.5' : 'h-3 w-3'} />}
    {score.total}
    {score.typed && <span aria-label="typed in">✎</span>}
  </span>
);

/** Ring gauge for the headline score */
export const ScoreRing: React.FC<{ score: SleepScore; isDark: boolean; size?: number }> = ({
  score,
  isDark,
  size = 84,
}) => {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color =
    score.band === 'Excellent' ? '#10b981' : score.band === 'Good' ? '#0ea5e9' : score.band === 'Fair' ? '#f59e0b' : '#f43f5e';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(score.total / 100) * c} ${c}`}
          style={{ transition: 'stroke-dasharray 400ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-mono text-2xl font-bold tabular-nums leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {score.total}
        </span>
        <span className={`mt-0.5 text-[9px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          / 100
        </span>
      </div>
    </div>
  );
};

/** Component-by-component explanation: what was measured, the target, points earned */
export const ScoreBreakdown: React.FC<{ score: SleepScore; isDark: boolean }> = ({ score, isDark }) => (
  <div className="space-y-2.5">
    {score.typed && (
      <p className={`rounded-lg border px-2.5 py-1.5 text-[11px] ${isDark ? 'border-indigo-800/60 bg-indigo-950/40 text-indigo-200' : 'border-indigo-200 bg-indigo-50 text-indigo-800'}`}>
        You typed in {score.total}. The night's data calculates to {score.calculatedTotal}; the breakdown below is for that calculation.
      </p>
    )}
    {score.components.map((c) => {
      const pct = c.max ? (c.points / c.max) * 100 : 0;
      const lost = Math.round((c.max - c.points) * 10) / 10;
      return (
        <div key={c.key}>
          <div className="flex items-baseline justify-between gap-2 text-[11px]">
            <span className={`flex min-w-0 items-center gap-1.5 font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {c.source === 'wearable' ? (
                <Watch className="h-3 w-3 shrink-0 text-violet-500" />
              ) : (
                <ClipboardCheck className="h-3 w-3 shrink-0 text-indigo-500" />
              )}
              <span className="truncate">{c.label}</span>
            </span>
            <span className={`shrink-0 font-mono tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {c.points}/{c.max}
              {lost > 0 && <span className="ml-1 text-rose-500">−{lost}</span>}
            </span>
          </div>
          <div className={`mt-1 h-1.5 w-full overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <div
              className={`h-full rounded-full ${pct >= 99 ? 'bg-emerald-500' : pct >= 60 ? 'bg-sky-500' : pct >= 35 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className={`mt-0.5 flex justify-between gap-2 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            <span className="truncate">{c.value}</span>
            <span className="shrink-0">target {c.target}</span>
          </div>
        </div>
      );
    })}
    <p className={`pt-1 text-[10px] leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
      Thresholds follow National Sleep Foundation guidance (7–9 h sleep, ≤30 min to fall asleep, ≤1 wake-up, ≤20 min awake
      overnight). {score.usesWearable ? 'Wearable data contributes 25 of 100 points.' : 'Pair a wearable to add sleep-stage data.'}
    </p>
  </div>
);

export { bandBarColor };

// ---------- Visual "why this score" (used live in the check-in) ----------
const PART_COLORS: Record<string, { bar: string; dot: string }> = {
  duration: { bar: 'bg-indigo-500', dot: 'bg-indigo-500' },
  latency: { bar: 'bg-sky-500', dot: 'bg-sky-500' },
  awakenings: { bar: 'bg-violet-500', dot: 'bg-violet-500' },
  regularity: { bar: 'bg-teal-500', dot: 'bg-teal-500' },
  quality: { bar: 'bg-amber-500', dot: 'bg-amber-500' },
  energy: { bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  deep: { bar: 'bg-blue-600', dot: 'bg-blue-600' },
  rem: { bar: 'bg-fuchsia-500', dot: 'bg-fuchsia-500' },
  waso: { bar: 'bg-orange-500', dot: 'bg-orange-500' },
  spo2: { bar: 'bg-rose-500', dot: 'bg-rose-500' },
};

/**
 * One 100-point bar split into the score's parts. Each part's slot is as wide as
 * the points it can earn; the solid fill is what was earned, the striped rest is
 * what was lost. A list below says why each part lost points.
 */
export const ScoreWhy: React.FC<{ score: SleepScore; isDark: boolean }> = ({ score, isDark }) => {
  const [open, setOpen] = React.useState(true);
  const possible = score.components.reduce((a, c) => a + c.max, 0) || 1;
  const losers = score.components.filter((c) => c.max - c.points >= 0.5).sort((a, b) => b.max - b.points - (a.max - a.points));
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const stripe = isDark
    ? 'repeating-linear-gradient(135deg, rgba(148,163,184,0.18) 0 3px, transparent 3px 6px)'
    : 'repeating-linear-gradient(135deg, rgba(100,116,139,0.18) 0 3px, transparent 3px 6px)';

  return (
    <div className={`rounded-xl border p-3 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ScoreBadge score={score} isDark={isDark} size="lg" />
          <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{score.band}</span>
          <span className={`text-[11px] ${muted}`}>if saved now</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={`text-[11px] font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}
        >
          {open ? 'Hide why' : 'Why this score?'}
        </button>
      </div>

      {/* 100-point bar */}
      <div className="mt-2.5 flex h-4 w-full gap-[2px] overflow-hidden rounded-md" role="img" aria-label={`Score ${score.total} out of 100, split by part`}>
        {score.components.map((c) => {
          const slot = (c.max / possible) * 100;
          const fill = c.max ? (c.points / c.max) * 100 : 0;
          return (
            <div
              key={c.key}
              className="relative h-full"
              style={{ width: `${slot}%`, backgroundImage: stripe }}
              title={`${c.label}: ${c.points}/${c.max}`}
            >
              <div
                className={`h-full ${PART_COLORS[c.key]?.bar ?? 'bg-slate-500'} motion-safe:transition-[width] motion-safe:duration-300`}
                style={{ width: `${fill}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className={`mt-1 flex justify-between font-mono text-[9px] ${muted}`}>
        <span>0</span>
        <span>solid = points earned · striped = points lost</span>
        <span>100</span>
      </div>

      {open && (
        <div className="mt-3 space-y-1.5">
          {losers.length === 0 && (
            <p className={`text-[11px] ${muted}`}>Every part is on target, so nothing is lost.</p>
          )}
          {score.components.map((c) => {
            const lost = Math.round((c.max - c.points) * 10) / 10;
            return (
              <div key={c.key} className="flex items-start gap-2 text-[11px]">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-sm ${PART_COLORS[c.key]?.dot ?? 'bg-slate-500'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {c.source === 'wearable' && <Watch className="mr-1 inline h-3 w-3 text-violet-500" />}
                      {c.label}
                    </span>
                    <span className={`shrink-0 font-mono tabular-nums ${lost > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                      {lost > 0 ? `−${lost}` : '✓'} <span className={muted}>({c.points}/{c.max})</span>
                    </span>
                  </div>
                  <div className={muted}>
                    {c.value} · target {c.target}
                  </div>
                </div>
              </div>
            );
          })}
          {score.usesWearable && (
            <p className={`pt-1 text-[10px] ${muted}`}>Tracker data is worth 25 of the 100 points; the check-in parts share the other 75.</p>
          )}
        </div>
      )}
    </div>
  );
};
