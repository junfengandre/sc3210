import React from 'react';
import { CheckCircle2, CircleDashed, XCircle, ArrowRight, Target, Users, Watch, ClipboardCheck } from 'lucide-react';
import { useSleep } from '../context/SleepContext';

type Status = 'pass' | 'pending' | 'fail';
type AppTabName = 'today' | 'insights' | 'experiments' | 'me';

interface RequirementsPanelProps {
  onOpenCheckIn: () => void;
  onGoToTab: (tab: AppTabName) => void;
}

export const PRODUCT_PITCH =
  'sleeplab lets young adults log their daily behaviours and discover which ones actually affect their sleep quality, through personalised analysis of their own data. It does more than log: it supervises, turning suspicions into 7-day experiments with measured before/after results.';

export const RequirementsPanel: React.FC<RequirementsPanelProps> = ({ onOpenCheckIn, onGoToTab }) => {
  const {
    theme,
    h1Metrics,
    lastCheckInDurationSeconds,
    lastQuickLogDurationSeconds,
    insights,
    insightRefreshCount,
    sleepRecords,
    behaviorLogs,
    activeExperiment,
    completedExperiments,
    pairedWearable,
  } = useSleep();
  const isDark = theme === 'dark';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const strong = isDark ? 'text-white' : 'text-slate-900';

  // R4: a finished 7/7 cycle with before/after metrics, else progress on the active one
  const fullCycle = completedExperiments.find((e) => (e.duringMetrics?.completedDays ?? 0) >= 7 && e.duringMetrics);
  const activeDays = activeExperiment ? Object.values(activeExperiment.adherence).filter(Boolean).length : 0;

  const reqs: {
    id: string;
    title: string;
    check: string;
    target: string;
    measured: string;
    status: Status;
    action: { label: string; onClick: () => void };
  }[] = [
    {
      id: 'R1',
      title: 'Log a sleep record each morning in under 30 seconds',
      check: 'Time a user completing the check-in with a stopwatch. The app also times every check-in in the background, from opening it to saving, and stores the time with the record.',
      target: '< 30 s',
      measured: h1Metrics.totalCheckIns
        ? `Avg ${h1Metrics.avgCheckInSeconds}s across ${h1Metrics.totalCheckIns} timed check-ins · last ${lastCheckInDurationSeconds}s`
        : 'No timed check-ins yet. Do one in the app to measure it (uploaded nights are not timed).',
      status: !h1Metrics.totalCheckIns ? 'pending' : h1Metrics.avgCheckInSeconds < 30 ? 'pass' : 'fail',
      action: { label: 'Time a check-in', onClick: onOpenCheckIn },
    },
    {
      id: 'R2',
      title: 'Quick-log behaviours (coffee, exercise, screen, stress) in under 5 seconds',
      check: 'Time from tap to confirmation. Each quick log records its own duration.',
      target: '< 5 s',
      measured: h1Metrics.totalQuickLogs
        ? `Avg ${h1Metrics.avgQuickLogSeconds}s across ${h1Metrics.totalQuickLogs} timed quick logs · last ${lastQuickLogDurationSeconds}s`
        : 'No timed quick logs yet. Log one from the Quick Log tiles on Today.',
      status: !h1Metrics.totalQuickLogs ? 'pending' : h1Metrics.avgQuickLogSeconds < 5 ? 'pass' : 'fail',
      action: { label: 'Quick-log on Today', onClick: () => onGoToTab('today') },
    },
    {
      id: 'R3',
      title: 'Generate personalised insights comparing sleep on days with vs. without each behaviour',
      check: 'Verify the insight cards update when new logs are added.',
      target: 'Cards recalculate on new data',
      measured:
        insightRefreshCount > 0
          ? `${insights.length} insight cards recalculated ${insightRefreshCount}× after new data this session (${sleepRecords.length} nights, ${behaviorLogs.length} logs)`
          : `${insights.length} insight cards from ${sleepRecords.length} nights and ${behaviorLogs.length} logs. Add a log or check-in to verify they update.`,
      status: insightRefreshCount > 0 ? 'pass' : 'pending',
      action: { label: 'Open Insights', onClick: () => onGoToTab('insights') },
    },
    {
      id: 'R4',
      title: 'Run a 7-day experiment and track daily adherence',
      check: 'Complete a full 7-day cycle and confirm before/after metrics display.',
      target: '7/7 days + before/after shown',
      measured: fullCycle
        ? `“${fullCycle.title}” completed 7/7. Fall-asleep time ${fullCycle.baselineMetrics.onsetLatencyMinutes}m → ${fullCycle.duringMetrics!.onsetLatencyMinutes}m; energy ${fullCycle.baselineMetrics.morningEnergy} → ${fullCycle.duringMetrics!.morningEnergy}/5`
        : activeExperiment
        ? `“${activeExperiment.title}” in progress: ${activeDays}/7 days adhered. Conclude it to see before/after.`
        : 'No experiment running. Start one from an insight card.',
      status: fullCycle ? 'pass' : 'pending',
      action: { label: 'Open Experiments', onClick: () => onGoToTab('experiments') },
    },
  ];

  const passCount = reqs.filter((r) => r.status === 'pass').length;

  const statusChip = (s: Status) =>
    s === 'pass' ? (
      <span className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${isDark ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
        <CheckCircle2 className="h-3.5 w-3.5" /> Pass
      </span>
    ) : s === 'fail' ? (
      <span className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${isDark ? 'border-rose-800/60 bg-rose-950/40 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
        <XCircle className="h-3.5 w-3.5" /> Not met
      </span>
    ) : (
      <span className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${isDark ? 'border-amber-800/60 bg-amber-950/40 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
        <CircleDashed className="h-3.5 w-3.5" /> Pending
      </span>
    );

  const card = `rounded-2xl border p-5 ${isDark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-white shadow-xs'}`;

  return (
    <div className="space-y-5">
      {/* Product brief */}
      <div className={card}>
        <div className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>
          <Target className="h-4 w-4" /> Product brief
        </div>
        <p className={`mt-2 text-sm leading-relaxed ${strong}`}>{PRODUCT_PITCH}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className={`rounded-xl border p-3 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${strong}`}>
              <Users className="h-3.5 w-3.5 text-indigo-500" /> Who it's for
            </div>
            <p className={`mt-1 text-[11px] leading-relaxed ${muted}`}>
              University students and young professionals in their 20s with an irregular sleep schedule. They suspect habits like late
              coffee, screen time or skipping the gym are disrupting their sleep, but don't know which ones actually matter for them.
            </p>
          </div>
          <div className={`rounded-xl border p-3 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${strong}`}>
              <ClipboardCheck className="h-3.5 w-3.5 text-indigo-500" /> Self-report first
              <span className={muted}>·</span>
              <Watch className="h-3.5 w-3.5 text-violet-500" /> tracker optional
            </div>
            <p className={`mt-1 text-[11px] leading-relaxed ${muted}`}>
              The sleep report is self-reported so anyone can use it. Users with an Apple Watch, Fitbit, Oura or similar can pair it to add
              sleep-stage data to their score.{' '}
              <span className="font-semibold">{pairedWearable ? `Currently paired: ${pairedWearable}.` : 'No tracker paired.'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={`text-base font-bold ${strong}`}>Core requirements</h2>
          <span className={`font-mono text-xs font-semibold ${muted}`}>
            {passCount}/{reqs.length} passing · live from app data
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {reqs.map((r) => (
            <div key={r.id} className={`rounded-xl border p-4 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[11px] font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{r.id}</span>
                    <span className={`text-sm font-semibold leading-snug ${strong}`}>{r.title}</span>
                  </div>
                </div>
                <div className="shrink-0">{statusChip(r.status)}</div>
              </div>

              <dl className="mt-3 grid gap-2 text-[11px] sm:grid-cols-[7rem_1fr]">
                <dt className={`font-semibold ${muted}`}>How we check</dt>
                <dd className={isDark ? 'text-slate-300' : 'text-slate-700'}>{r.check}</dd>
                <dt className={`font-semibold ${muted}`}>Target</dt>
                <dd className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{r.target}</dd>
                <dt className={`font-semibold ${muted}`}>Measured</dt>
                <dd className={`font-mono tabular-nums ${strong}`}>{r.measured}</dd>
              </dl>

              <button
                onClick={r.action.onClick}
                className={`mt-3 flex items-center gap-1 text-xs font-semibold ${isDark ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-600 hover:text-indigo-800'}`}
              >
                {r.action.label} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
