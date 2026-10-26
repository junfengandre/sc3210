import React, { useMemo, useState } from 'react';
import { ChevronDown, FlaskConical, Watch, TrendingUp, TrendingDown } from 'lucide-react';
import { useSleep } from '../context/SleepContext';
import { sortNewestFirst, bandBarColor } from '../lib/sleepScore';
import { ScoreBreakdown, ScoreRing, ScoreBadge } from './ScoreBreakdown';

interface SleepScoreCardProps {
  onOpenTestData: () => void;
  onOpenTrends?: () => void;
}

const shortDate = (iso: string) => {
  const [, m, d] = iso.split('-').map(Number);
  return `${d}/${m}`;
};

export const SleepScoreCard: React.FC<SleepScoreCardProps> = ({ onOpenTestData, onOpenTrends }) => {
  const { sleepRecords, sleepScores, latestSleep, theme } = useSleep();
  const isDark = theme === 'dark';
  const [open, setOpen] = useState(false);

  const trend = useMemo(() => sortNewestFirst(sleepRecords).slice(0, 14).reverse(), [sleepRecords]);
  const score = latestSleep ? sleepScores[latestSleep.id] : undefined;

  const avg = (ids: string[]) =>
    ids.length ? Math.round(ids.reduce((a, id) => a + (sleepScores[id]?.total ?? 0), 0) / ids.length) : null;
  const newest = sortNewestFirst(sleepRecords);
  const avg7 = avg(newest.slice(0, 7).map((r) => r.id));
  const prev7 = avg(newest.slice(7, 14).map((r) => r.id));
  const delta = avg7 != null && prev7 != null ? avg7 - prev7 : null;

  const muted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div
      className={`rounded-2xl border p-5 transition-colors ${
        isDark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200/90 bg-white shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className={`text-[11px] font-semibold uppercase tracking-wider ${muted}`}>
          Sleep Score{latestSleep ? ` · ${latestSleep.date}` : ''}
        </div>
        <button
          onClick={onOpenTestData}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FlaskConical className="h-3.5 w-3.5 text-indigo-500" />
          Add data
        </button>
      </div>

      {score && latestSleep ? (
        <>
          <div className="mt-3 flex items-center gap-4">
            <ScoreRing score={score} isDark={isDark} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{score.band}</span>
                {score.usesWearable && (
                  <span className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${isDark ? 'border-violet-800/60 text-violet-300' : 'border-violet-200 text-violet-700'}`}>
                    <Watch className="h-3 w-3" />
                    {latestSleep.wearable?.source || 'Wearable'}
                  </span>
                )}
              </div>
              <p className={`mt-0.5 text-xs leading-snug ${muted}`}>
                {score.biggestLoss
                  ? `Biggest drag: ${score.biggestLoss.label.toLowerCase()} (${score.biggestLoss.value}, target ${score.biggestLoss.target}).`
                  : 'Every component on target.'}
              </p>
              {avg7 != null && (
                <p className={`mt-1 flex items-center gap-1 text-[11px] font-medium ${muted}`}>
                  7-night avg <span className="font-mono font-bold tabular-nums">{avg7}</span>
                  {delta != null && delta !== 0 && (
                    <span className={`flex items-center gap-0.5 font-mono ${delta > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {delta > 0 ? '+' : ''}
                      {delta} vs prior week
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* 14-night trend */}
          {trend.length > 1 && (
            <div className="mt-4">
              <div className="flex h-20 items-end gap-1" role="img" aria-label="Sleep score for the last 14 nights">
                {trend.map((r) => {
                  const s = sleepScores[r.id];
                  if (!s) return null;
                  const isLatest = r.id === latestSleep.id;
                  return (
                    <div key={r.id} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                      <span className={`mb-0.5 font-mono text-[9px] tabular-nums ${isLatest ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : muted}`}>
                        {s.total}
                      </span>
                      <div
                        className={`w-full rounded-t-sm ${bandBarColor(s.band)} ${isLatest ? '' : 'opacity-60'}`}
                        style={{ height: `${Math.max(4, s.total * 0.62)}%` }}
                        title={`${r.date}: ${s.total} (${s.band})`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className={`mt-1 flex justify-between font-mono text-[9px] ${muted}`}>
                <span>{shortDate(trend[0].date)}</span>
                <span>{shortDate(trend[trend.length - 1].date)}</span>
              </div>
            </div>
          )}

          {onOpenTrends && (
            <button
              onClick={onOpenTrends}
              className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold ${
                isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              7-day trend & monthly calendar →
            </button>
          )}

          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className={`mt-3 flex w-full items-center justify-between rounded-lg px-1 py-1 text-xs font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}
          >
            <span>How this score was calculated</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className={`mt-2 border-t pt-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <ScoreBreakdown score={score} isDark={isDark} />
            </div>
          )}
        </>
      ) : (
        <p className={`mt-3 text-xs ${muted}`}>No nights yet. Do a morning check-in, or tap Add data to load the built-in sample or your own file.</p>
      )}
    </div>
  );
};

export { ScoreBadge };
