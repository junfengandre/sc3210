import React from 'react';
import { X, ArrowRight, CheckCircle2, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { SleepFactorInsight } from '../types/sleep';
import { useSleep } from '../context/SleepContext';

interface InsightDetailModalProps {
  insight: SleepFactorInsight | null;
  onClose: () => void;
  onStartExperimentFromInsight: (templateId: string) => void;
}

export const InsightDetailModal: React.FC<InsightDetailModalProps> = ({
  insight,
  onClose,
  onStartExperimentFromInsight,
}) => {
  const { activeExperiment, theme } = useSleep();
  const isDark = theme === 'dark';

  if (!insight) return null;

  const { withFactor, withoutFactor } = insight.comparisonData;
  const isAlreadyActive = activeExperiment?.templateId === insight.recommendedExperimentId;

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
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl border text-2xl ${
                isDark
                  ? 'bg-slate-800 border-slate-700/60'
                  : 'bg-slate-100 border-slate-200'
              }`}
            >
              {insight.icon}
            </span>
            <div>
              <h2 className="text-base font-bold">{insight.title}</h2>
              <div className={`flex items-center gap-2 text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span>Your personal comparison</span>
                <span aria-hidden="true">·</span>
                <span>Based on {insight.observationCount} days of your data</span>
              </div>
            </div>
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

        {/* Primary Discovery Headline */}
        <div
          className={`mt-5 rounded-xl border p-4 ${
            isDark
              ? 'border-indigo-900/50 bg-indigo-950/20'
              : 'border-indigo-200/80 bg-indigo-50/70'
          }`}
        >
          <div
            className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
              isDark ? 'text-indigo-400' : 'text-indigo-700'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Key Finding</span>
          </div>
          <p
            className={`mt-1 text-sm font-semibold leading-relaxed ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}
          >
            {insight.summary}
          </p>
          <p
            className={`mt-2 text-xs leading-relaxed ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            {insight.effect.explanation}
          </p>
        </div>

        {/* Personal comparison matrix (raw data) */}
        <div className="mt-5">
          <h3
            className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Your Personal Comparison Data
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {/* With Factor Card */}
            <div
              className={`rounded-xl border p-3.5 ${
                isDark
                  ? 'border-slate-800 bg-slate-950/70'
                  : 'border-slate-200 bg-slate-50 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  {withFactor.label}
                </span>
                <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {withFactor.count} days
                </span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Sleep Onset:</span>
                  <span className={`font-mono font-semibold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    ~{withFactor.onsetLatency} min
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Sleep Duration:</span>
                  <span className={`font-mono font-semibold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {withFactor.durationHours} hrs
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Morning Energy:</span>
                  <span className="font-mono font-semibold text-emerald-600 tabular-nums">
                    {withFactor.energy}/5
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Sleep Quality:</span>
                  <span className="font-mono font-semibold text-amber-600 tabular-nums">
                    {withFactor.quality}/5
                  </span>
                </div>
              </div>
            </div>

            {/* Without Factor Card */}
            <div
              className={`rounded-xl border p-3.5 ${
                isDark
                  ? 'border-slate-800 bg-slate-950/70'
                  : 'border-slate-200 bg-slate-50 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  {withoutFactor.label}
                </span>
                <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {withoutFactor.count} days
                </span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Sleep Onset:</span>
                  <span className={`font-mono font-semibold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    ~{withoutFactor.onsetLatency} min
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Sleep Duration:</span>
                  <span className={`font-mono font-semibold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {withoutFactor.durationHours} hrs
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Morning Energy:</span>
                  <span className="font-mono font-semibold text-emerald-600 tabular-nums">
                    {withoutFactor.energy}/5
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Sleep Quality:</span>
                  <span className="font-mono font-semibold text-amber-600 tabular-nums">
                    {withoutFactor.quality}/5
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistical Note */}
        <p className={`mt-3 text-[11px] leading-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          *Note: This reflects correlation in your personal routine over the past 14 days, not population averages.
        </p>

        {/* Action CTA: Turn Discovery into 7-Day Experiment */}
        <div className={`mt-5 pt-4 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
          {isAlreadyActive ? (
            <div
              className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-medium ${
                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Experiment currently in progress on your Today tab</span>
            </div>
          ) : insight.recommendedExperimentId ? (
            <button
              onClick={() => {
                onStartExperimentFromInsight(insight.recommendedExperimentId!);
                onClose();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.99] transition-all"
            >
              <span>Test This with a 7-Day Experiment</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className={`w-full rounded-xl py-3 text-xs font-semibold transition-colors ${
                isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
