import React, { useMemo, useState } from 'react';
import { FlaskConical, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useSleep } from '../context/SleepContext';
import { ScoreBand, bandFor } from '../lib/sleepScore';
import { localDateStr } from '../data/testData';
import { ActiveExperiment } from '../types/sleep';

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
const shortDate = (iso: string) => {
  const d = parse(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
const longDate = (iso: string) => {
  const d = parse(iso);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

const bandFill = (b: ScoreBand) =>
  b === 'Excellent' ? 'fill-emerald-500' : b === 'Good' ? 'fill-sky-500' : b === 'Fair' ? 'fill-amber-500' : 'fill-rose-500';

const DAYS = [1, 2, 3, 4, 5, 6, 7];

interface DayPoint {
  day: number;
  date: string; // the morning the night is logged under
  score: number | null;
  band: ScoreBand | null;
  adhered: boolean;
  upcoming: boolean;
  /** The day has started but its night isn't loggable until the next morning */
  awaiting: boolean;
}

interface ExperimentTrackerProps {
  onOpenExperiments?: () => void;
}

/**
 * Day-by-day view of a 7-day experiment: the sleep score for each night of the experiment,
 * a dashed line at the average of the 7 nights before it started, and whether the rule was
 * kept each day. Covers the running experiment and any completed ones.
 */
export const ExperimentTracker: React.FC<ExperimentTrackerProps> = ({ onOpenExperiments }) => {
  const { activeExperiment, completedExperiments, dailyScores, theme } = useSleep();
  const isDark = theme === 'dark';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const ink = isDark ? 'text-white' : 'text-slate-900';

  const experiments: ActiveExperiment[] = useMemo(
    () => [...(activeExperiment ? [activeExperiment] : []), ...completedExperiments],
    [activeExperiment, completedExperiments]
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverDay, setHoverDay] = useState<number | null>(null);

  const exp = experiments.find((e) => e.id === selectedId) ?? experiments[0];
  const today = localDateStr(new Date());

  const { points, baseline, baselineNights } = useMemo(() => {
    if (!exp) return { points: [] as DayPoint[], baseline: null as number | null, baselineNights: 0 };
    const isActive = exp.status === 'active';
    const daysIn = Math.round((parse(today).getTime() - parse(exp.startDate).getTime()) / 86400000) + 1;
    const todayDay = isActive ? Math.min(7, Math.max(1, daysIn)) : 7;
    // Day k's behaviour shows up in the night logged on the morning after: startDate + k
    const pts: DayPoint[] = DAYS.map((day) => {
      const date = addDays(exp.startDate, day);
      const s = dailyScores[date];
      return {
        day,
        date,
        score: s ? s.total : null,
        band: s ? s.band : null,
        adhered: !!exp.adherence[day],
        upcoming: day > todayDay,
        awaiting: isActive && day <= todayDay && date > today,
      };
    });
    // Baseline: the up-to-7 most recent scored nights on or before the start date
    const before = Object.keys(dailyScores)
      .filter((d) => d <= exp.startDate)
      .sort()
      .slice(-7);
    const base = before.length
      ? Math.round(before.reduce((a, d) => a + dailyScores[d].total, 0) / before.length)
      : null;
    return { points: pts, baseline: base, baselineNights: before.length };
  }, [exp, dailyScores, today]);

  // ---------- empty state ----------
  if (!exp) {
    return (
      <div
        className={`rounded-2xl border border-dashed p-5 ${
          isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-300 bg-white'
        }`}
      >
        <div className={`flex items-center gap-2 text-sm font-bold ${ink}`}>
          <FlaskConical className={`h-4 w-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
          <span>7-day experiment tracker</span>
        </div>
        <p className={`mt-1.5 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          Start a 7-day experiment and its night-by-night sleep scores will show up here, next to your usual sleep.
        </p>
        {onOpenExperiments && (
          <button
            onClick={onOpenExperiments}
            className="mt-3 flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700"
          >
            <span>Browse experiments</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }

  const scored = points.filter((p) => p.score != null) as (DayPoint & { score: number; band: ScoreBand })[];
  const expAvg = scored.length ? Math.round(scored.reduce((a, p) => a + p.score, 0) / scored.length) : null;
  const diff = expAvg != null && baseline != null ? expAvg - baseline : null;
  const keptCount = points.filter((p) => p.adhered).length;
  const isActive = exp.status === 'active';
  const currentDay = isActive ? points.filter((p) => !p.upcoming).length : 7;
  // Days that can be judged: today only counts once it's marked
  const judgedDays = isActive && currentDay > 0 && !points[currentDay - 1].adhered ? currentDay - 1 : currentDay;

  // ---------- chart geometry ----------
  const W = 340;
  const H = 214;
  const padL = 30;
  const padR = 14;
  const top = 18;
  const plotBottom = 152;
  const inset = 14; // keep day 1 / day 7 labels clear of the axis
  const x = (day: number) => padL + inset + ((day - 1) * (W - padL - padR - inset * 2)) / 6;
  const y = (v: number) => top + ((100 - v) * (plotBottom - top)) / 100;
  const colW = (W - padL - padR - inset * 2) / 6;

  // Line segments, broken where a night is missing
  const segments: { x: number; y: number }[][] = [];
  let run: { x: number; y: number }[] = [];
  points.forEach((p) => {
    if (p.score != null) run.push({ x: x(p.day), y: y(p.score) });
    else if (run.length) {
      segments.push(run);
      run = [];
    }
  });
  if (run.length) segments.push(run);

  const grid = isDark ? 'stroke-slate-800' : 'stroke-slate-200';
  const axisText = isDark ? 'fill-slate-500' : 'fill-slate-400';
  const surfaceStroke = isDark ? 'stroke-slate-950' : 'stroke-white';

  // Readout under the chart: hovered/tapped day, else the latest scored day
  const focusDay = hoverDay ?? (scored.length ? scored[scored.length - 1].day : null);
  const focus = focusDay != null ? points[focusDay - 1] : null;

  const firstUpcoming = points.find((p) => p.upcoming);

  return (
    <div
      className={`rounded-2xl border p-5 transition-colors ${
        isDark
          ? 'border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900'
          : 'border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-white shadow-sm'
      }`}
    >
      {/* Header + picker */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className={`flex items-center gap-2 text-sm font-bold ${ink}`}>
            <FlaskConical className={`h-4 w-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <span>7-day experiment tracker</span>
          </h2>
          <p className={`mt-0.5 text-[11px] ${muted}`}>
            Each night's sleep score during the experiment, against your usual sleep before it.
          </p>
        </div>
        {experiments.length > 1 && (
          <select
            id="exp-tracker-pick"
            aria-label="Choose experiment"
            value={exp.id}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setHoverDay(null);
            }}
            className={`max-w-full rounded-lg border px-2 py-1 text-xs font-semibold focus:border-indigo-500 focus:outline-none ${
              isDark ? 'border-slate-700 bg-slate-950 text-slate-200' : 'border-slate-200 bg-white text-slate-800'
            }`}
          >
            {experiments.map((e) => (
              <option key={e.id} value={e.id}>
                {e.icon} {e.title} · {e.status === 'active' ? 'running' : `ended ${shortDate(e.completedDate || e.endDate)}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Which experiment */}
      <div className="mt-3 flex items-center gap-2.5">
        <span className="text-2xl leading-none">{exp.icon}</span>
        <div className="min-w-0">
          <div className={`text-sm font-semibold ${ink}`}>{exp.title}</div>
          <div className={`text-[11px] ${muted}`}>
            {isActive ? `Running · day ${currentDay} of 7` : 'Completed'} · {shortDate(exp.startDate)} – {shortDate(addDays(exp.startDate, 7))}
          </div>
        </div>
      </div>

      {/* Headline numbers */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className={`rounded-xl border p-2.5 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white'}`}>
          <div className={`text-[10px] font-semibold uppercase tracking-wider ${muted}`}>Before</div>
          <div className={`mt-0.5 font-mono text-lg font-bold tabular-nums ${ink}`}>{baseline ?? '—'}</div>
          <div className={`text-[10px] ${muted}`}>
            {baselineNights ? `avg of ${baselineNights} night${baselineNights === 1 ? '' : 's'}` : 'no earlier nights'}
          </div>
        </div>
        <div className={`rounded-xl border p-2.5 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white'}`}>
          <div className={`text-[10px] font-semibold uppercase tracking-wider ${muted}`}>During</div>
          <div className={`mt-0.5 font-mono text-lg font-bold tabular-nums ${ink}`}>{expAvg ?? '—'}</div>
          <div className={`text-[10px] ${muted}`}>
            {scored.length} of 7 nights logged
          </div>
        </div>
        <div className={`rounded-xl border p-2.5 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white'}`}>
          <div className={`text-[10px] font-semibold uppercase tracking-wider ${muted}`}>Change</div>
          <div className={`mt-0.5 flex items-center gap-1 font-mono text-lg font-bold tabular-nums ${ink}`}>
            {diff == null ? (
              '—'
            ) : (
              <>
                {diff > 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                ) : diff < 0 ? (
                  <TrendingDown className="h-4 w-4 text-rose-500" aria-hidden="true" />
                ) : (
                  <Minus className="h-4 w-4" aria-hidden="true" />
                )}
                {diff > 0 ? '+' : ''}
                {diff}
              </>
            )}
          </div>
          <div className={`text-[10px] ${muted}`}>
            kept the rule {keptCount}/{judgedDays} days
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className={`mt-3 rounded-xl border p-2 ${isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white'}`}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`${exp.title}: sleep score for each of the 7 nights${
            baseline != null ? `, against a usual score of ${baseline} before the experiment` : ''
          }`}
          onMouseLeave={() => setHoverDay(null)}
        >
          {/* Score bands */}
          {[
            { from: 85, to: 100, b: 'Excellent' as ScoreBand },
            { from: 70, to: 85, b: 'Good' as ScoreBand },
            { from: 55, to: 70, b: 'Fair' as ScoreBand },
            { from: 0, to: 55, b: 'Poor' as ScoreBand },
          ].map((z) => (
            <rect
              key={z.b}
              x={padL}
              y={y(z.to)}
              width={W - padL - padR}
              height={y(z.from) - y(z.to)}
              className={bandFill(z.b)}
              opacity={isDark ? 0.07 : 0.06}
            />
          ))}

          {/* Upcoming days shading */}
          {firstUpcoming && (
            <rect
              x={x(firstUpcoming.day) - colW / 2}
              y={top}
              width={W - padR - (x(firstUpcoming.day) - colW / 2)}
              height={plotBottom - top}
              className={isDark ? 'fill-slate-800' : 'fill-slate-100'}
              opacity={0.6}
            />
          )}

          {/* Grid + y labels */}
          {[0, 55, 70, 85, 100].map((v) => (
            <g key={v}>
              <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} className={grid} strokeWidth={1} />
              <text x={padL - 6} y={y(v) + 3} textAnchor="end" fontSize={9} className={axisText}>
                {v}
              </text>
            </g>
          ))}

          {/* Baseline */}
          {baseline != null && (
            <g>
              <line
                x1={padL}
                x2={W - padR}
                y1={y(baseline)}
                y2={y(baseline)}
                className={isDark ? 'stroke-slate-300' : 'stroke-slate-500'}
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
            </g>
          )}

          {/* Hover column */}
          {focus && hoverDay != null && (
            <line
              x1={x(focus.day)}
              x2={x(focus.day)}
              y1={top}
              y2={plotBottom}
              className={isDark ? 'stroke-slate-600' : 'stroke-slate-300'}
              strokeWidth={1}
            />
          )}

          {/* Score line */}
          {segments.map((seg, i) => (
            <polyline
              key={i}
              points={seg.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              className="stroke-indigo-500"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* Points + value labels */}
          {scored.map((p) => (
            <g key={p.day}>
              <circle
                cx={x(p.day)}
                cy={y(p.score)}
                r={hoverDay === p.day ? 6 : 4.5}
                className={`${bandFill(p.band)} ${surfaceStroke}`}
                strokeWidth={2}
              />
              <text
                x={x(p.day)}
                y={y(p.score) - 9}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                className={isDark ? 'fill-slate-200' : 'fill-slate-700'}
              >
                {p.score}
              </text>
            </g>
          ))}

          {/* X axis: day + date */}
          {points.map((p) => (
            <g key={p.day}>
              <text
                x={x(p.day)}
                y={plotBottom + 14}
                textAnchor="middle"
                fontSize={9}
                fontWeight={600}
                className={p.day === currentDay && isActive ? (isDark ? 'fill-white' : 'fill-slate-900') : axisText}
              >
                Day {p.day}
              </text>
              <text x={x(p.day)} y={plotBottom + 25} textAnchor="middle" fontSize={8} className={axisText}>
                {shortDate(addDays(exp.startDate, p.day - 1))}
              </text>
            </g>
          ))}

          {/* Adherence row */}
          {points.map((p) => {
            const cx = x(p.day);
            const cy = plotBottom + 44;
            if (p.adhered)
              return (
                <g key={p.day}>
                  <circle cx={cx} cy={cy} r={8} className="fill-indigo-600" />
                  <polyline
                    points={`${cx - 3.5},${cy} ${cx - 1},${cy + 2.6} ${cx + 3.8},${cy - 2.6}`}
                    fill="none"
                    className="stroke-white"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            // Today (still in progress) and future days are open, not missed
            if (p.upcoming || (isActive && p.day === currentDay))
              return (
                <circle
                  key={p.day}
                  cx={cx}
                  cy={cy}
                  r={7.5}
                  fill="none"
                  className={isDark ? 'stroke-slate-500' : 'stroke-slate-300'}
                  strokeDasharray="2 2"
                  strokeWidth={1.2}
                />
              );
            return (
              <g key={p.day} className={isDark ? 'stroke-slate-500' : 'stroke-slate-400'}>
                <circle cx={cx} cy={cy} r={7.5} fill="none" strokeWidth={1.2} />
                <path d={`M${cx - 2.6},${cy - 2.6} L${cx + 2.6},${cy + 2.6} M${cx + 2.6},${cy - 2.6} L${cx - 2.6},${cy + 2.6}`} strokeWidth={1.5} strokeLinecap="round" />
              </g>
            );
          })}

          {/* Hit targets (bigger than the marks) */}
          {points.map((p) => (
            <rect
              key={p.day}
              x={x(p.day) - colW / 2}
              y={top}
              width={colW}
              height={H - top}
              fill="transparent"
              onMouseEnter={() => setHoverDay(p.day)}
              onClick={() => setHoverDay(p.day)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </svg>

        {/* Legend */}
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-1 pb-1 text-[10px] ${muted}`}>
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-4 rounded bg-indigo-500" /> sleep score
          </span>
          <span className="flex items-center gap-1">
            <span className={`h-0 w-4 border-t-2 border-dashed ${isDark ? 'border-slate-300' : 'border-slate-500'}`} /> usual, before
          </span>
          <span className="flex items-center gap-1">
            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-indigo-600 text-[7px] text-white">✓</span> kept the rule
          </span>
          <span className="flex items-center gap-1">
            <span className={`flex h-3 w-3 items-center justify-center rounded-full border text-[7px] ${isDark ? 'border-slate-500' : 'border-slate-400'}`}>✕</span> didn't
          </span>
        </div>
      </div>

      {/* Readout for the hovered / tapped / latest day */}
      <div
        aria-live="polite"
        className={`mt-2 rounded-lg px-3 py-2 text-xs ${isDark ? 'bg-slate-950/60 text-slate-300' : 'bg-slate-50 text-slate-700'}`}
      >
        {focus ? (
          <>
            <span className={`font-semibold ${ink}`}>Day {focus.day}</span>
            <span className={muted}> · night logged {longDate(focus.date)} · </span>
            {focus.score != null ? (
              <>
                score <span className="font-mono font-bold">{focus.score}</span> ({bandFor(focus.score)})
                {baseline != null && (
                  <span className={muted}>
                    {' '}
                    · {focus.score - baseline >= 0 ? '+' : ''}
                    {focus.score - baseline} vs before
                  </span>
                )}
              </>
            ) : (
              <span className={muted}>{focus.upcoming ? 'not reached yet' : focus.awaiting ? 'log this sleep tomorrow morning' : 'no night logged'}</span>
            )}
            <span className={muted}> · </span>
            {focus.adhered ? 'kept the rule' : focus.upcoming ? 'rule not due yet' : isActive && focus.day === currentDay ? 'not marked yet today' : "didn't keep the rule"}
          </>
        ) : (
          <span className={muted}>
            No nights logged since this experiment started. Do your morning check-ins and each night will appear here.
          </span>
        )}
      </div>

      <p className={`mt-2 text-[10px] leading-relaxed ${muted}`}>
        Day 1 is the day you start; its effect shows in the sleep you log the next morning. Tap a day to see it.
      </p>
    </div>
  );
};
