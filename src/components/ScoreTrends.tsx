import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, TrendingUp, TrendingDown, Minus, Watch } from 'lucide-react';
import { useSleep } from '../context/SleepContext';
import { ScoreBand, bandFor, timeInBedMinutes } from '../lib/sleepScore';
import { localDateStr } from '../data/testData';
import { logEffect, logEmoji } from '../data/habitLibrary';
import { EffectPill } from './HabitLibraryModal';

// ---------- date helpers (local time, YYYY-MM-DD) ----------
const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (iso: string, n: number) => {
  const d = parse(iso);
  d.setDate(d.getDate() + n);
  return localDateStr(d);
};
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayLabel = (iso: string) => {
  const d = parse(iso);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

const bandText = (b: ScoreBand, isDark: boolean) =>
  b === 'Excellent'
    ? isDark ? 'text-emerald-300' : 'text-emerald-700'
    : b === 'Good'
    ? isDark ? 'text-sky-300' : 'text-sky-700'
    : b === 'Fair'
    ? isDark ? 'text-amber-300' : 'text-amber-700'
    : isDark ? 'text-rose-300' : 'text-rose-700';

const bandCell = (b: ScoreBand, isDark: boolean) =>
  b === 'Excellent'
    ? isDark ? 'bg-emerald-900/50 border-emerald-800/70' : 'bg-emerald-100 border-emerald-200'
    : b === 'Good'
    ? isDark ? 'bg-sky-900/50 border-sky-800/70' : 'bg-sky-100 border-sky-200'
    : b === 'Fair'
    ? isDark ? 'bg-amber-900/40 border-amber-800/70' : 'bg-amber-100 border-amber-200'
    : isDark ? 'bg-rose-900/40 border-rose-800/70' : 'bg-rose-100 border-rose-200';

const bandFill = (b: ScoreBand) =>
  b === 'Excellent' ? 'fill-emerald-500' : b === 'Good' ? 'fill-sky-500' : b === 'Fair' ? 'fill-amber-500' : 'fill-rose-500';
const bandStroke = (b: ScoreBand) =>
  b === 'Excellent' ? 'stroke-emerald-500' : b === 'Good' ? 'stroke-sky-500' : b === 'Fair' ? 'stroke-amber-500' : 'stroke-rose-500';

/** The experiment (running or finished) whose nights include this date, if any.
 *  An experiment's nights are the mornings after each of its 7 days: (startDate, endDate]. */
const useExperimentNight = () => {
  const { activeExperiment, completedExperiments } = useSleep();
  const all = useMemo(
    () => [...(activeExperiment ? [activeExperiment] : []), ...completedExperiments],
    [activeExperiment, completedExperiments]
  );
  return (date: string) => all.find((e) => date > e.startDate && date <= e.endDate);
};

/** Least-squares slope (points per day) */
const slopeOf = (pts: { x: number; y: number }[]) => {
  if (pts.length < 2) return null;
  const n = pts.length;
  const mx = pts.reduce((a, p) => a + p.x, 0) / n;
  const my = pts.reduce((a, p) => a + p.y, 0) / n;
  const num = pts.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0);
  const den = pts.reduce((a, p) => a + (p.x - mx) ** 2, 0);
  if (!den) return null;
  const m = num / den;
  return { m, b: my - m * mx };
};

// ---------- Score input (typed overrides) ----------
const ScoreInput: React.FC<{ date: string; isDark: boolean; compact?: boolean }> = ({ date, isDark, compact }) => {
  const { dailyScores, scoreEntries, setScoreEntry } = useSleep();
  const [draft, setDraft] = useState<string | null>(null);
  const daily = dailyScores[date];
  const value = draft ?? (daily ? String(daily.total) : '');
  return (
    <input
      id={`score-${date}`}
      type="number"
      inputMode="numeric"
      min={0}
      max={100}
      value={value}
      placeholder="—"
      aria-label={`Sleep score for ${dayLabel(date)}`}
      onChange={(e) => {
        const v = e.target.value;
        setDraft(v);
        if (v === '') {
          if (scoreEntries[date] != null) setScoreEntry(date, null);
          return;
        }
        const n = Number(v);
        if (Number.isFinite(n) && n >= 0 && n <= 100) setScoreEntry(date, n);
      }}
      onBlur={() => setDraft(null)}
      className={`${compact ? 'w-16' : 'w-20'} rounded-lg border px-2 py-1.5 text-right font-mono text-sm font-bold tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
        isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-900'
      } ${daily ? bandText(daily.band, isDark) : ''}`}
    />
  );
};

// ---------- 7-day view ----------
const SevenDay: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const { dailyScores, scoreEntries, setScoreEntry, sleepRecords } = useSleep();
  const expFor = useExperimentNight();
  const today = localDateStr(new Date());
  const [end, setEnd] = useState(today);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(end, i - 6)), [end]);
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';

  const points = days
    .map((d, i) => (dailyScores[d] ? { x: i, y: dailyScores[d].total, date: d, s: dailyScores[d] } : null))
    .filter(Boolean) as { x: number; y: number; date: string; s: (typeof dailyScores)[string] }[];
  const prevDays = days.map((d) => addDays(d, -7));
  const prevVals = prevDays.map((d) => dailyScores[d]?.total).filter((v): v is number => v != null);

  const avg = points.length ? Math.round(points.reduce((a, p) => a + p.y, 0) / points.length) : null;
  const prevAvg = prevVals.length ? Math.round(prevVals.reduce((a, v) => a + v, 0) / prevVals.length) : null;
  const best = points.length ? points.reduce((a, p) => (p.y > a.y ? p : a)) : null;
  const worst = points.length ? points.reduce((a, p) => (p.y < a.y ? p : a)) : null;
  const fit = slopeOf(points);
  const trendLabel = !fit ? 'Not enough days' : Math.abs(fit.m) < 0.75 ? 'Steady' : fit.m > 0 ? 'Improving' : 'Declining';

  // Chart geometry
  const W = 340, H = 186, L = 30, R = 14, T = 24, B = 26;
  const x = (i: number) => L + (i * (W - L - R)) / 6;
  const y = (v: number) => T + ((100 - v) * (H - T - B)) / 100;
  // Line segments break where a day has no score
  const segments: { x: number; y: number }[][] = [];
  let cur: { x: number; y: number }[] = [];
  days.forEach((d, i) => {
    const s = dailyScores[d];
    if (s) cur.push({ x: i, y: s.total });
    else if (cur.length) {
      segments.push(cur);
      cur = [];
    }
  });
  if (cur.length) segments.push(cur);
  const grid = isDark ? 'stroke-slate-800' : 'stroke-slate-200';
  const axisText = isDark ? 'fill-slate-500' : 'fill-slate-400';
  // Experiment nights in view → one shaded span per run of consecutive days
  const expSpans: { from: number; to: number; icon: string; title: string }[] = [];
  days.forEach((d, i) => {
    const e = expFor(d);
    const last = expSpans[expSpans.length - 1];
    if (e && last && last.to === i - 1 && last.title === e.title) last.to = i;
    else if (e) expSpans.push({ from: i, to: i, icon: e.icon, title: e.title });
  });
  const half = (W - L - R) / 12;

  const recordDates = new Set(sleepRecords.map((r) => r.date));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setEnd(addDays(end, -7))}
          aria-label="Previous 7 days"
          className={`flex h-8 w-8 items-center justify-center rounded-lg border ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          {dayLabel(days[0])} – {dayLabel(days[6])}
        </span>
        <button
          onClick={() => setEnd(addDays(end, 7))}
          disabled={end >= today}
          aria-label="Next 7 days"
          className={`flex h-8 w-8 items-center justify-center rounded-lg border disabled:opacity-30 ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          {
            k: '7-day average',
            v: avg ?? '—',
            sub: prevAvg != null && avg != null ? `${avg - prevAvg >= 0 ? '+' : ''}${avg - prevAvg} vs prior 7` : 'no prior week',
            cls: avg != null ? bandText(bandFor(avg), isDark) : '',
          },
          { k: 'Trend', v: trendLabel, sub: fit ? `${fit.m >= 0 ? '+' : ''}${fit.m.toFixed(1)} pts/day` : 'needs 2+ days', cls: '' },
          { k: 'Best', v: best?.y ?? '—', sub: best ? dayLabel(best.date) : '', cls: best ? bandText(best.s.band, isDark) : '' },
          { k: 'Lowest', v: worst?.y ?? '—', sub: worst ? dayLabel(worst.date) : '', cls: worst ? bandText(worst.s.band, isDark) : '' },
        ].map((c) => (
          <div key={c.k} className={`rounded-xl border p-2.5 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/70'}`}>
            <div className={`text-[10px] font-semibold uppercase tracking-wider ${muted}`}>{c.k}</div>
            <div className={`mt-0.5 flex items-center gap-1 font-mono text-lg font-bold tabular-nums ${c.cls || (isDark ? 'text-white' : 'text-slate-900')}`}>
              {c.k === 'Trend' && fit && (fit.m >= 0.75 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : fit.m <= -0.75 ? <TrendingDown className="h-4 w-4 text-rose-500" /> : <Minus className="h-4 w-4" />)}
              <span className={c.k === 'Trend' ? 'font-sans text-sm' : ''}>{c.v}</span>
            </div>
            <div className={`text-[10px] ${muted}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Trendline chart */}
      <div className={`rounded-xl border p-2 ${isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white'}`}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Sleep scores ${dayLabel(days[0])} to ${dayLabel(days[6])}, average ${avg ?? 'none'}`}>
          {/* band zones */}
          {[
            { from: 85, to: 100, b: 'Excellent' as ScoreBand },
            { from: 70, to: 85, b: 'Good' as ScoreBand },
            { from: 55, to: 70, b: 'Fair' as ScoreBand },
            { from: 0, to: 55, b: 'Poor' as ScoreBand },
          ].map((z) => (
            <rect key={z.b} x={L} y={y(z.to)} width={W - L - R} height={y(z.from) - y(z.to)} className={bandFill(z.b)} opacity={isDark ? 0.07 : 0.06} />
          ))}
          {/* experiment nights */}
          {expSpans.map((sp) => {
            const x0 = Math.max(L, x(sp.from) - half);
            const x1 = Math.min(W - R, x(sp.to) + half);
            return (
              <g key={`${sp.title}-${sp.from}`}>
                <rect x={x0} y={y(100)} width={x1 - x0} height={y(0) - y(100)} className="fill-indigo-500" opacity={isDark ? 0.14 : 0.08} />
                <line x1={x0} x2={x1} y1={y(100) - 1} y2={y(100) - 1} className="stroke-indigo-500" strokeWidth={2} />
                <text x={(x0 + x1) / 2} y={y(100) - 6} textAnchor="middle" fontSize={8.5} fontWeight={700} className={isDark ? 'fill-indigo-300' : 'fill-indigo-700'}>
                  {sp.icon} {sp.to - sp.from >= 2 ? sp.title : 'experiment'}
                </text>
              </g>
            );
          })}
          {[0, 55, 70, 85, 100].map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className={grid} strokeWidth={1} />
              <text x={L - 6} y={y(v) + 3} textAnchor="end" fontSize={9} className={axisText}>
                {v}
              </text>
            </g>
          ))}
          {days.map((d, i) => {
            const dt = parse(d);
            return (
              <text key={d} x={x(i)} y={H - 8} textAnchor="middle" fontSize={9} className={d === today ? (isDark ? 'fill-white font-bold' : 'fill-slate-900 font-bold') : axisText}>
                {WEEKDAYS[dt.getDay()].slice(0, 2)} {dt.getDate()}
              </text>
            );
          })}
          {/* average */}
          {avg != null && (
            <line x1={L} x2={W - R} y1={y(avg)} y2={y(avg)} className={isDark ? 'stroke-slate-500' : 'stroke-slate-400'} strokeDasharray="2 3" strokeWidth={1} />
          )}
          {/* fitted trend */}
          {fit && points.length >= 2 && (
            <line
              x1={x(points[0].x)}
              y1={y(Math.max(0, Math.min(100, fit.m * points[0].x + fit.b)))}
              x2={x(points[points.length - 1].x)}
              y2={y(Math.max(0, Math.min(100, fit.m * points[points.length - 1].x + fit.b)))}
              className="stroke-violet-500"
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
          )}
          {segments.map((seg, i) => (
            <polyline
              key={i}
              points={seg.map((p) => `${x(p.x)},${y(p.y)}`).join(' ')}
              fill="none"
              className="stroke-indigo-500"
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {points.map((p) => (
            <g key={p.date}>
              <circle
                cx={x(p.x)}
                cy={y(p.y)}
                r={4.5}
                className={p.s.source === 'typed' ? `${bandStroke(p.s.band)} ${isDark ? 'fill-slate-950' : 'fill-white'}` : `${bandFill(p.s.band)} ${isDark ? 'stroke-slate-950' : 'stroke-white'}`}
                strokeWidth={2}
              />
              <text x={x(p.x)} y={y(p.y) - 8} textAnchor="middle" fontSize={10} fontWeight={700} className={isDark ? 'fill-slate-200' : 'fill-slate-700'}>
                {p.y}
              </text>
            </g>
          ))}
        </svg>
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-1 pb-1 text-[10px] ${muted}`}>
          <span className="flex items-center gap-1"><span className="h-0.5 w-4 rounded bg-indigo-500" /> score</span>
          <span className="flex items-center gap-1"><span className="h-0 w-4 border-t-2 border-dashed border-violet-500" /> trendline</span>
          <span className="flex items-center gap-1"><span className={`h-0 w-4 border-t border-dotted ${isDark ? 'border-slate-500' : 'border-slate-400'}`} /> average</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full border-2 border-indigo-500" /> typed in</span>
          {expSpans.length > 0 && (
            <span className="flex items-center gap-1"><span className={`h-2.5 w-4 rounded-sm border-t-2 border-indigo-500 ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-500/10'}`} /> experiment nights</span>
          )}
        </div>
      </div>

      {/* Editable table */}
      <div>
        <div className={`mb-1.5 text-[11px] ${muted}`}>Type a score (0–100) for any day; the chart updates as you type. Clear the box or tap ↺ to go back to the calculated score.</div>
        <div className={`divide-y rounded-xl border ${isDark ? 'divide-slate-800 border-slate-800' : 'divide-slate-100 border-slate-200'}`}>
          {[...days].reverse().map((d) => {
            const s = dailyScores[d];
            const typed = scoreEntries[d] != null;
            return (
              <div key={d} className="flex items-center justify-between gap-2 px-3 py-2">
                <label htmlFor={`score-${d}`} className="min-w-0">
                  <div className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {dayLabel(d)}
                    {d === today && <span className="ml-1.5 text-[10px] font-bold text-indigo-500">today</span>}
                  </div>
                  <div className={`text-[10px] ${muted}`}>
                    {typed ? (recordDates.has(d) ? 'Typed in · overrides calculated' : 'Typed in') : s ? `Calculated · ${s.band}` : 'No data'}
                  </div>
                </label>
                <div className="flex items-center gap-1.5">
                  <ScoreInput date={d} isDark={isDark} />
                  <button
                    onClick={() => setScoreEntry(d, null)}
                    disabled={!typed}
                    aria-label={`Clear typed score for ${dayLabel(d)}`}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-0 ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ---------- Month calendar ----------
const MonthCalendar: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const { dailyScores, sleepRecords, behaviorLogs, scoreEntries, setScoreEntry } = useSleep();
  const expFor = useExperimentNight();
  const today = localDateStr(new Date());
  const latestDate = Object.keys(dailyScores).sort().pop() || today;
  const [month, setMonth] = useState(() => latestDate.slice(0, 7)); // YYYY-MM
  const [selected, setSelected] = useState<string>(latestDate);
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';

  const [yr, mo] = month.split('-').map(Number);
  const first = new Date(yr, mo - 1, 1);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`),
  ];
  while (cells.length % 7) cells.push(null);

  const shiftMonth = (n: number) => {
    const d = new Date(yr, mo - 1 + n, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const logsByDate = useMemo(() => {
    const m: Record<string, typeof behaviorLogs> = {};
    for (const l of behaviorLogs) (m[l.date] ||= []).push(l);
    return m;
  }, [behaviorLogs]);

  const monthDays = cells.filter(Boolean) as string[];
  const scored = monthDays.filter((d) => dailyScores[d]);
  const avg = scored.length ? Math.round(scored.reduce((a, d) => a + dailyScores[d].total, 0) / scored.length) : null;
  const best = scored.length ? scored.reduce((a, d) => (dailyScores[d].total > dailyScores[a].total ? d : a)) : null;
  const worst = scored.length ? scored.reduce((a, d) => (dailyScores[d].total < dailyScores[a].total ? d : a)) : null;
  const monthLogs = monthDays.flatMap((d) => logsByDate[d] || []);
  const helpsCount = monthLogs.filter((l) => logEffect(l) === 'helps').length;
  const hurtsCount = monthLogs.filter((l) => logEffect(l) === 'hurts').length;

  const sel = dailyScores[selected];
  const selRecord = [...sleepRecords].filter((r) => r.date === selected).sort((a, b) => ((b.recordedAt || '') > (a.recordedAt || '') ? 1 : -1))[0];
  const selLogs = logsByDate[selected] || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => shiftMonth(-1)} aria-label="Previous month" className={`flex h-8 w-8 items-center justify-center rounded-lg border ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {MONTHS_LONG[mo - 1]} {yr}
        </span>
        <button onClick={() => shiftMonth(1)} aria-label="Next month" className={`flex h-8 w-8 items-center justify-center rounded-lg border ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className={`rounded-xl border p-2 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/70'}`}>
          <div className={`text-[10px] font-semibold uppercase tracking-wider ${muted}`}>Avg score</div>
          <div className={`font-mono text-lg font-bold tabular-nums ${avg != null ? bandText(bandFor(avg), isDark) : muted}`}>{avg ?? '—'}</div>
          <div className={`text-[10px] ${muted}`}>{scored.length} days scored</div>
        </div>
        <div className={`rounded-xl border p-2 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/70'}`}>
          <div className={`text-[10px] font-semibold uppercase tracking-wider ${muted}`}>Best / lowest</div>
          <div className="font-mono text-lg font-bold tabular-nums">
            <span className={best ? bandText(dailyScores[best].band, isDark) : muted}>{best ? dailyScores[best].total : '—'}</span>
            <span className={muted}> / </span>
            <span className={worst ? bandText(dailyScores[worst].band, isDark) : muted}>{worst ? dailyScores[worst].total : '—'}</span>
          </div>
          <div className={`text-[10px] ${muted}`}>{best && worst ? `${parse(best).getDate()} & ${parse(worst).getDate()} ${MONTHS[mo - 1]}` : ''}</div>
        </div>
        <div className={`rounded-xl border p-2 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/70'}`}>
          <div className={`text-[10px] font-semibold uppercase tracking-wider ${muted}`}>Habits logged</div>
          <div className="font-mono text-lg font-bold tabular-nums">
            <span className="text-emerald-600">{helpsCount}</span>
            <span className={muted}> / </span>
            <span className="text-rose-500">{hurtsCount}</span>
          </div>
          <div className={`text-[10px] ${muted}`}>helps / hurts</div>
        </div>
      </div>

      {/* Calendar grid */}
      <div>
        <div className={`mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold ${muted}`}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const s = dailyScores[d];
            const logs = logsByDate[d] || [];
            const helps = logs.filter((l) => logEffect(l) === 'helps').length;
            const hurts = logs.filter((l) => logEffect(l) === 'hurts').length;
            const isSel = d === selected;
            const exp = expFor(d);
            return (
              <button
                key={d}
                onClick={() => setSelected(d)}
                aria-pressed={isSel}
                aria-label={`${dayLabel(d)}${s ? `, score ${s.total}` : ', no score'}${helps ? `, ${helps} helping habits` : ''}${hurts ? `, ${hurts} hurting habits` : ''}${exp ? `, experiment night: ${exp.title}` : ''}`}
                className={`relative flex min-h-[54px] flex-col items-center justify-between rounded-lg border px-0.5 pt-1 pb-1.5 transition-shadow ${
                  s ? bandCell(s.band, isDark) : isDark ? 'border-slate-800 bg-slate-950/30' : 'border-slate-100 bg-white'
                } ${isSel ? 'ring-2 ring-indigo-500 ring-offset-1 ' + (isDark ? 'ring-offset-slate-900' : 'ring-offset-white') : ''}`}
              >
                <span className={`self-start pl-1 text-[9px] font-semibold ${d === today ? 'text-indigo-500' : muted}`}>{parse(d).getDate()}</span>
                {exp && (
                  <span aria-hidden="true" className="absolute right-0.5 top-0.5 text-[9px] leading-none" title={exp.title}>
                    {exp.icon}
                  </span>
                )}
                <span className={`font-mono text-sm font-bold leading-none tabular-nums ${s ? bandText(s.band, isDark) : muted}`}>
                  {s ? s.total : ''}
                  {s?.source === 'typed' && <span className="text-[8px] align-top">✎</span>}
                </span>
                <span className="flex h-1.5 items-center gap-0.5">
                  {Array.from({ length: Math.min(helps, 3) }).map((_, k) => (
                    <span key={`h${k}`} className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  ))}
                  {Array.from({ length: Math.min(hurts, 3) }).map((_, k) => (
                    <span key={`x${k}`} className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <div className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] ${muted}`}>
          {(['Excellent', 'Good', 'Fair', 'Poor'] as ScoreBand[]).map((b) => (
            <span key={b} className="flex items-center gap-1">
              <span className={`h-2.5 w-2.5 rounded-sm border ${bandCell(b, isDark)}`} /> {b}
            </span>
          ))}
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> helping habit</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> hurting habit</span>
          {(() => {
            const e = monthDays.map(expFor).find(Boolean);
            return e ? (
              <span className="flex items-center gap-1"><span className="text-[9px] leading-none">{e.icon}</span> experiment night</span>
            ) : null;
          })()}
        </div>
      </div>

      {/* Day detail */}
      <div className={`rounded-xl border p-4 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/60'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{dayLabel(selected)}</div>
            <div className={`text-[11px] ${muted}`}>
              {sel ? `${sel.band} · ${sel.source === 'typed' ? 'typed in' : 'calculated'}` : 'No score yet. Type one in.'}
            </div>
            {expFor(selected) && (() => {
              const e = expFor(selected)!;
              const n = Math.round((parse(selected).getTime() - parse(e.startDate).getTime()) / 86400000);
              return (
                <div className={`mt-1 text-[11px] font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                  {e.icon} Experiment night {n} of 7 · {e.title}
                  {e.adherence[n] ? ' · kept the rule' : ''}
                </div>
              );
            })()}
          </div>
          <div className="flex items-center gap-1.5">
            <label htmlFor={`score-${selected}`} className={`text-[11px] font-semibold ${muted}`}>Score</label>
            <ScoreInput key={selected} date={selected} isDark={isDark} compact />
            {scoreEntries[selected] != null && (
              <button
                onClick={() => setScoreEntry(selected, null)}
                aria-label="Clear typed score"
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {selRecord && (
          <dl className={`mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] sm:grid-cols-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <div><dt className={`inline ${muted}`}>Bed–wake </dt><dd className="inline font-mono">{selRecord.bedTime}–{selRecord.wakeTime}</dd></div>
            <div><dt className={`inline ${muted}`}>Asleep </dt><dd className="inline font-mono">{Math.floor(selRecord.sleepDurationMinutes / 60)}h {selRecord.sleepDurationMinutes % 60}m</dd></div>
            <div><dt className={`inline ${muted}`}>In bed </dt><dd className="inline font-mono">{Math.round(timeInBedMinutes(selRecord.bedTime, selRecord.wakeTime) / 6) / 10}h</dd></div>
            <div><dt className={`inline ${muted}`}>Fell asleep in </dt><dd className="inline font-mono">{selRecord.sleepOnsetLatencyMinutes}m</dd></div>
            <div><dt className={`inline ${muted}`}>Wake-ups </dt><dd className="inline font-mono">{selRecord.nightAwakenings}</dd></div>
            <div><dt className={`inline ${muted}`}>Quality / energy </dt><dd className="inline font-mono">{selRecord.quality}/5 · {selRecord.morningEnergy}/5</dd></div>
            {selRecord.wearable && (
              <div className="col-span-2 sm:col-span-3 flex items-center gap-1">
                <Watch className="h-3 w-3 text-violet-500" />
                <span className={muted}>{selRecord.wearable.source}: </span>
                <span className="font-mono">
                  deep {selRecord.wearable.deepMinutes ?? '–'}m · REM {selRecord.wearable.remMinutes ?? '–'}m · SpO₂ {selRecord.wearable.spo2Avg ?? '–'}%
                </span>
              </div>
            )}
          </dl>
        )}

        <div className="mt-3">
          <div className={`mb-1 text-[11px] font-semibold ${muted}`}>Logged that day ({selLogs.length})</div>
          {selLogs.length ? (
            <ul className="space-y-1">
              {selLogs.map((l) => {
                const ef = logEffect(l);
                return (
                  <li key={l.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span aria-hidden="true">{logEmoji(l)}</span>
                      <span className={`truncate font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{l.title}</span>
                      {ef && <EffectPill effect={ef} isDark={isDark} />}
                    </span>
                    <span className={`shrink-0 font-mono text-[10px] ${muted}`}>{l.time}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={`text-[11px] ${muted}`}>Nothing logged.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- Container ----------
export const ScoreTrends: React.FC = () => {
  const { theme } = useSleep();
  const isDark = theme === 'dark';
  const [view, setView] = useState<'week' | 'month'>('week');
  return (
    <div className={`rounded-2xl border p-5 ${isDark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200/90 bg-white shadow-xs'}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Sleep score trends</h2>
        <div className={`flex rounded-lg p-0.5 text-[11px] font-semibold ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} role="tablist">
          {(
            [
              ['week', '7 days'],
              ['month', 'Month'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={view === id}
              onClick={() => setView(id)}
              className={`rounded-md px-3 py-1 transition-colors ${
                view === id ? (isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900 shadow-xs') : isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {view === 'week' ? <SevenDay isDark={isDark} /> : <MonthCalendar isDark={isDark} />}
    </div>
  );
};
