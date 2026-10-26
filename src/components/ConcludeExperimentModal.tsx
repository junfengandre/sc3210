import React from 'react';
import { X, Check, RotateCcw, ArrowRight, TrendingUp } from 'lucide-react';
import { useSleep } from '../context/SleepContext';

interface ConcludeExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConcluded?: () => void;
}

export const ConcludeExperimentModal: React.FC<ConcludeExperimentModalProps> = ({
  isOpen,
  onClose,
  onConcluded,
}) => {
  const { activeExperiment, concludeExperiment, experimentProgress, theme } = useSleep();
  const isDark = theme === 'dark';

  if (!isOpen || !activeExperiment) return null;

  const baseline = activeExperiment.baselineMetrics;
  const during = experimentProgress;

  const handleDecision = (decision: 'keep' | 'change') => {
    concludeExperiment(decision);
    onClose();
    if (onConcluded) onConcluded();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-colors ${
          isDark
            ? 'border-slate-800 bg-slate-900 text-white'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-start justify-between border-b pb-4 ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{activeExperiment.icon}</span>
              <h2 className="text-base font-bold">
                7-Day Experiment Complete!
              </h2>
            </div>
            <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {activeExperiment.title} · Baseline vs Experiment Comparison
            </p>
          </div>
          <button
            onClick={onClose}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              isDark
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {during ? (
          <>
        {/* The Core Results Matrix */}
        <div className="mt-5 space-y-3">
          <div
            className={`rounded-xl border p-4 ${
              isDark
                ? 'border-slate-800 bg-slate-950/80'
                : 'border-slate-200 bg-slate-50 shadow-xs'
            }`}
          >
            <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Average Time to Fall Asleep
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Baseline:{' '}
                </span>
                <span className={`font-mono text-sm font-semibold tabular-nums ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {baseline.onsetLatencyMinutes} min
                </span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">
                  Experiment:{' '}
                </span>
                <span className="font-mono text-base font-bold text-emerald-600 tabular-nums">
                  {during.onsetLatencyMinutes} min
                </span>
                <span className="ml-1.5 text-xs text-emerald-600 font-medium">
                  (-{baseline.onsetLatencyMinutes - during.onsetLatencyMinutes}m faster)
                </span>
              </div>
            </div>
          </div>

          <div
            className={`rounded-xl border p-4 ${
              isDark
                ? 'border-slate-800 bg-slate-950/80'
                : 'border-slate-200 bg-slate-50 shadow-xs'
            }`}
          >
            <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Morning Energy Rating
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Baseline:{' '}
                </span>
                <span className={`font-mono text-sm font-semibold tabular-nums ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {baseline.morningEnergy} / 5
                </span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">
                  Experiment:{' '}
                </span>
                <span className="font-mono text-base font-bold text-emerald-600 tabular-nums">
                  {during.morningEnergy} / 5
                </span>
                <span className="ml-1.5 text-xs text-emerald-600 font-medium">
                  (+{(during.morningEnergy - baseline.morningEnergy).toFixed(1)} boost)
                </span>
              </div>
            </div>
          </div>

          <div
            className={`rounded-xl border p-4 ${
              isDark
                ? 'border-slate-800 bg-slate-950/80'
                : 'border-slate-200 bg-slate-50 shadow-xs'
            }`}
          >
            <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Subjective Sleep Quality
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Baseline:{' '}
                </span>
                <span className={`font-mono text-sm font-semibold tabular-nums ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {baseline.sleepQuality} / 5
                </span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-amber-600 font-bold">
                  Experiment:{' '}
                </span>
                <span className="font-mono text-base font-bold text-amber-600 tabular-nums">
                  {during.sleepQuality} / 5
                </span>
                <span className="ml-1.5 text-xs text-amber-600 font-medium">
                  (+{(during.sleepQuality - baseline.sleepQuality).toFixed(1)})
                </span>
              </div>
            </div>
          </div>
        </div>

          </>
        ) : (
          <div
            className={`mt-5 rounded-xl border p-4 text-xs leading-relaxed ${
              isDark ? 'border-amber-800/60 bg-amber-950/30 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            No nights have been logged since this experiment started, so there is no "after" to compare with your
            baseline yet. Do your morning check-ins during the experiment and the before/after results will appear here.
          </div>
        )}

        {/* The Soul of the Product: Keep habit / Try something else */}
        <div className={`mt-6 pt-4 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
          <div className={`text-xs font-semibold mb-3 text-center ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            What is your decision based on these results?
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDecision('keep')}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.99] transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Keep this habit</span>
            </button>
            <button
              onClick={() => handleDecision('change')}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold active:scale-[0.99] transition-all ${
                isDark
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <RotateCcw className="h-4 w-4" />
              <span>Try something else</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
