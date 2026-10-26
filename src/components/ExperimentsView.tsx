import React, { useState } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Check,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { useSleep } from '../context/SleepContext';
import { ExperimentTemplate } from '../types/sleep';
import { ConcludeExperimentModal } from './ConcludeExperimentModal';

export const ExperimentsView: React.FC = () => {
  const {
    activeExperiment,
    completedExperiments,
    experimentTemplates,
    startExperiment,
    setAdherenceForDay,
    cancelActiveExperiment,
    theme,
    experimentProgress,
  } = useSleep();

  const isDark = theme === 'dark';
  const [isConcludeOpen, setIsConcludeOpen] = useState(false);

  const completedDaysCount = activeExperiment
    ? Object.values(activeExperiment.adherence).filter(Boolean).length
    : 0;

  return (
    <div className="space-y-6 pb-24 max-w-xl mx-auto">
      {/* View Header */}
      <div>
        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          7-Day Experiments
        </h1>
        <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          The core loop: test one behavioral variable for 7 days against your baseline.
        </p>
      </div>

      {/* Active Experiment Spotlight */}
      {activeExperiment ? (
        <div
          className={`rounded-2xl border p-5 transition-all ${
            isDark
              ? 'border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 shadow-xl'
              : 'border-indigo-200/90 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-indigo-400' : 'text-indigo-700'
              }`}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              <span>Active Experiment</span>
            </span>
            <span className={`text-xs font-mono font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
              Day {completedDaysCount} / 7
            </span>
          </div>

          <div className="mt-3 flex items-start gap-3">
            <span className="text-3xl">{activeExperiment.icon}</span>
            <div>
              <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeExperiment.title}
              </h2>
              <p className={`mt-1 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {activeExperiment.actionRule}
              </p>
            </div>
          </div>

          {/* 7-Day Checklist Interactive Grid */}
          <div className={`mt-4 pt-3 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200/70'}`}>
            <div className={`text-xs font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Daily Adherence Checklist:
            </div>
            <div className="grid grid-cols-7 gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((dayIdx) => {
                const isChecked = !!activeExperiment.adherence[dayIdx];
                return (
                  <button
                    key={dayIdx}
                    onClick={() => setAdherenceForDay(dayIdx, !isChecked)}
                    className={`flex flex-col items-center justify-center rounded-xl p-2 border transition-all ${
                      isChecked
                        ? isDark
                          ? 'border-indigo-500 bg-indigo-600/30 text-white'
                          : 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                        : isDark
                        ? 'border-slate-800 bg-slate-950/60 text-slate-500 hover:border-slate-700'
                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-medium">D{dayIdx}</span>
                    <div
                      className={`mt-1 flex h-4 w-4 items-center justify-center rounded-full ${
                        isChecked
                          ? 'bg-indigo-600 text-white'
                          : isDark
                          ? 'border border-slate-700'
                          : 'border border-slate-300'
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Baseline vs Current Live Comparison */}
          <div
            className={`mt-4 grid grid-cols-2 gap-3 pt-3 border-t text-xs ${
              isDark ? 'border-slate-800/80' : 'border-slate-200/70'
            }`}
          >
            <div
              className={`rounded-xl p-3 border ${
                isDark
                  ? 'bg-slate-950/70 border-slate-800'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Time to Fall Asleep
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-base font-bold text-emerald-600">
                  {experimentProgress ? `${experimentProgress.onsetLatencyMinutes}m` : '—'}
                </span>
                <span className={`text-[11px] line-through ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  {activeExperiment.baselineMetrics.onsetLatencyMinutes}m
                </span>
              </div>
            </div>

            <div
              className={`rounded-xl p-3 border ${
                isDark
                  ? 'bg-slate-950/70 border-slate-800'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Morning Energy
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-base font-bold text-emerald-600">
                  {experimentProgress ? `${experimentProgress.morningEnergy}/5` : '—'}
                </span>
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  (was {activeExperiment.baselineMetrics.morningEnergy})
                </span>
              </div>
            </div>
          </div>

          <p className={`mt-2 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {experimentProgress
              ? `Now: average of ${experimentProgress.nights} night${experimentProgress.nights === 1 ? '' : 's'} logged since ${activeExperiment.startDate}. Crossed-out / "was": your ${activeExperiment.baselineMetrics.sampleDays} nights before.`
              : `Baseline from your ${activeExperiment.baselineMetrics.sampleDays} nights before the experiment. "Now" fills in from your next morning check-in.`}
          </p>

          {/* Action CTAs */}
          <div
            className={`mt-5 flex items-center justify-between gap-3 pt-3 border-t ${
              isDark ? 'border-slate-800/80' : 'border-slate-200/70'
            }`}
          >
            <button
              onClick={cancelActiveExperiment}
              className={`text-xs transition-colors ${
                isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Cancel experiment
            </button>
            <button
              onClick={() => setIsConcludeOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
            >
              <span>Conclude & Review Results</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Catalog of Curated 7-Day Experiments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Experiment Catalog
          </h2>
        </div>

        <div className="space-y-3">
          {experimentTemplates.map((template) => {
            const isCurrentlyActive = activeExperiment?.templateId === template.id;
            return (
              <div
                key={template.id}
                className={`rounded-2xl border p-4 transition-all ${
                  isDark
                    ? 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl ${
                        isDark
                          ? 'bg-slate-800 border-slate-700/60'
                          : 'bg-slate-100 border-slate-200'
                      }`}
                    >
                      {template.icon}
                    </span>
                    <div>
                      <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {template.title}
                      </h3>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {template.tagline}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-mono font-semibold ${
                      isDark
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    7 Days
                  </span>
                </div>

                {/* Hypothesis & Rule */}
                <div
                  className={`mt-3 rounded-lg p-2.5 text-xs border ${
                    isDark
                      ? 'bg-slate-950/60 border-slate-800/60 text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className={`font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                    Rule:{' '}
                  </span>
                  {template.actionRule}
                </div>

                <p className={`mt-2 text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {template.whyItWorks}
                </p>

                {/* Start Button */}
                <div className={`mt-3 pt-2.5 border-t flex justify-end ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}>
                  {isCurrentlyActive ? (
                    <span className="flex items-center gap-1 text-xs text-indigo-600 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Active Now</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => startExperiment(template.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Start 7-Day Experiment</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed Experiments & Retained Habits */}
      {completedExperiments.length > 0 && (
        <div>
          <h2 className={`text-base font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Completed Experiments
          </h2>
          <div className="space-y-3">
            {completedExperiments.map((exp) => (
              <div
                key={exp.id}
                className={`rounded-2xl border p-4 ${
                  isDark
                    ? 'border-slate-800 bg-slate-900/60'
                    : 'border-slate-200 bg-white shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{exp.icon}</span>
                    <div>
                      <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {exp.title}
                      </h4>
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Completed on {exp.completedDate}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      exp.decision === 'keep'
                        ? isDark
                          ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isDark
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {exp.decision === 'keep' ? 'Habit Retained ✓' : 'Tried & Pivoted'}
                  </span>
                </div>
                <p className={`mt-2 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {exp.learnedTakeaway}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conclude Modal */}
      <ConcludeExperimentModal
        isOpen={isConcludeOpen}
        onClose={() => setIsConcludeOpen(false)}
      />
    </div>
  );
};
