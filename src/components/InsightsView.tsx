import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ChevronRight,
  FlaskConical,
  BarChart2,
  Calendar,
} from 'lucide-react';
import { useSleep } from '../context/SleepContext';
import { SleepFactorInsight } from '../types/sleep';
import { InsightDetailModal } from './InsightDetailModal';
import { ScoreTrends } from './ScoreTrends';
import { CareNotice } from './CareNotice';
import { ExperimentTracker } from './ExperimentTracker';

interface InsightsViewProps {
  onStartExperiment: (templateId: string) => void;
  onOpenExperiments?: () => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ onStartExperiment, onOpenExperiments }) => {
  const { insights, sleepRecords, behaviorLogs, activeExperiment, experimentTemplates, theme } = useSleep();
  // Strongest insight where the behaviour is hurting sleep → its matching experiment
  const tryNext = insights.find((i) => !i.effect.isPositive);
  const tryNextTemplate = tryNext ? experimentTemplates.find((t) => t.id === tryNext.recommendedExperimentId) : undefined;
  const isDark = theme === 'dark';
  const [selectedInsight, setSelectedInsight] = useState<SleepFactorInsight | null>(null);

  return (
    <div className="space-y-6 pb-24 max-w-xl mx-auto">
      {/* View Header */}
      <div>
        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Insights
        </h1>
        <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Patterns in your own logs. What actually affects your sleep?
        </p>
      </div>

      {/* 7-day experiment: night-by-night vs baseline */}
      <ExperimentTracker onOpenExperiments={onOpenExperiments} />

      {/* Sleep score trends: 7-day (typed) and monthly calendar */}
      <ScoreTrends />

      {/* What your data shows: built from the strongest real insights */}
      {insights.length === 0 ? (
        <div
          className={`rounded-2xl border border-dashed p-5 ${
            isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-300 bg-white'
          }`}
        >
          <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>
            <Sparkles className="h-3.5 w-3.5" />
            <span>No insights yet</span>
          </div>
          <p className={`mt-2 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Insights compare your sleep on days with and without a behaviour, so each one needs at least 2 nights with it and 2
            without. Log check-ins and quick logs, or upload data in the Test Data Lab (Me tab).
          </p>
          <p className={`mt-2 font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {sleepRecords.length} nights · {behaviorLogs.length} behaviour logs so far
          </p>
        </div>
      ) : (
        <div
          className={`rounded-2xl border p-5 transition-all ${
            isDark
              ? 'border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 shadow-lg'
              : 'border-indigo-200/90 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 shadow-sm'
          }`}
        >
          <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>
            <Sparkles className="h-3.5 w-3.5" />
            <span>What Your Data Shows</span>
          </div>
          <div className="mt-4 space-y-3">
            {insights.slice(0, 3).map((ins) => (
              <div key={ins.id} className="flex items-start gap-2.5">
                <span className="text-base leading-none">{ins.icon}</span>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {ins.summary}{' '}
                  <span className={`font-mono text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    ({ins.comparisonData.withFactor.count} vs {ins.comparisonData.withoutFactor.count} nights)
                  </span>
                </p>
              </div>
            ))}
          </div>

          {tryNext && tryNextTemplate && (
            <div className={`mt-5 pt-3.5 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200/70'}`}>
              <div className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                One Thing to Try Next
              </div>
              <div
                className={`mt-2 flex items-center justify-between gap-3 rounded-xl p-3 border transition-colors ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="text-xl">{tryNextTemplate.icon}</span>
                  <div className="min-w-0">
                    <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{tryNextTemplate.title}</div>
                    <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Biggest drag: {tryNext.effect.metric.toLowerCase()} ({tryNext.effect.delta})
                    </div>
                  </div>
                </div>
                {activeExperiment?.templateId === tryNextTemplate.id ? (
                  <span className="shrink-0 text-[11px] font-semibold text-emerald-600">Running</span>
                ) : (
                  <button
                    onClick={() => onStartExperiment(tryNextTemplate.id)}
                    className="flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
                  >
                    <span>Test it</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Primary Section: What's Affecting My Sleep? */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            What's Affecting My Sleep?
          </h2>
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Tap to inspect raw data
          </span>
        </div>

        <div className="space-y-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              onClick={() => setSelectedInsight(insight)}
              className={`group cursor-pointer rounded-2xl border p-4 active:scale-[0.99] transition-all ${
                isDark
                  ? 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl ${
                      isDark
                        ? 'bg-slate-800 border-slate-700/50'
                        : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    {insight.icon}
                  </span>
                  <div>
                    <h3
                      className={`text-sm font-bold transition-colors ${
                        isDark ? 'text-white group-hover:text-indigo-300' : 'text-slate-900 group-hover:text-indigo-600'
                      }`}
                    >
                      {insight.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] mt-0.5">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Associated with</span>
                      <span className={`font-mono font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                        {insight.effect.delta}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-1 transition-colors ${
                    isDark ? 'text-slate-500 group-hover:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-600'
                  }`}
                >
                  <span className="text-[11px] font-mono">Inspect</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>

              {/* Data comparison quick glimpse */}
              <div
                className={`mt-3 grid grid-cols-2 gap-2 pt-2 border-t text-xs ${
                  isDark ? 'border-slate-800/60' : 'border-slate-100'
                }`}
              >
                <div
                  className={`rounded-lg p-2 border ${
                    isDark
                      ? 'bg-slate-950/60 border-slate-800/40'
                      : 'bg-slate-50 border-slate-200/70'
                  }`}
                >
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {insight.comparisonData.withFactor.label}
                  </div>
                  <div
                    className={`mt-1 font-mono text-sm font-semibold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {insight.cardStat?.with ?? `${insight.comparisonData.withFactor.onsetLatency}m latency`}
                  </div>
                </div>
                <div
                  className={`rounded-lg p-2 border ${
                    isDark
                      ? 'bg-slate-950/60 border-slate-800/40'
                      : 'bg-slate-50 border-slate-200/70'
                  }`}
                >
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {insight.comparisonData.withoutFactor.label}
                  </div>
                  <div
                    className={`mt-1 font-mono text-sm font-semibold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {insight.cardStat?.without ?? `${insight.comparisonData.withoutFactor.onsetLatency}m latency`}
                  </div>
                </div>
              </div>

              <div
                className={`mt-2.5 flex items-center justify-between text-[11px] ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                <span>Based on {insight.observationCount} nights</span>
                <span className={isDark ? 'text-indigo-400 group-hover:underline' : 'text-indigo-600 font-medium group-hover:underline'}>
                  View comparison →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CareNotice />

      {/* Statistical Methodology Disclaimer */}
      <div
        className={`rounded-xl border p-3.5 text-xs leading-relaxed ${
          isDark
            ? 'border-slate-800/60 bg-slate-950/40 text-slate-400'
            : 'border-slate-200 bg-white text-slate-600 shadow-xs'
        }`}
      >
        <strong className={isDark ? 'text-slate-300' : 'text-slate-900'}>Why only your data? </strong>
        Big sleep studies average out thousands of different people. sleeplab looks only at your own nights and habits, so you see what matters for you.
      </div>

      {/* Deep-dive Inspection Modal */}
      <InsightDetailModal
        insight={selectedInsight}
        onClose={() => setSelectedInsight(null)}
        onStartExperimentFromInsight={(templateId) => {
          onStartExperiment(templateId);
          setSelectedInsight(null);
        }}
      />
    </div>
  );
};
