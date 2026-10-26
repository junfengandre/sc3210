import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Clock,
  Sparkles,
  Check,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  Plus,
  Flame,
  Zap,
  Star,
  ChevronRight,
  Watch,
} from 'lucide-react';
import { useSleep } from '../context/SleepContext';
import { BehaviorType } from '../types/sleep';
import { QuickLogModal } from './QuickLogModal';
import { MorningReflectionModal } from './MorningReflectionModal';
import { ConcludeExperimentModal } from './ConcludeExperimentModal';
import { localDateStr } from '../data/testData';
import { SleepScoreCard } from './SleepScoreCard';
import { TestDataModal } from './TestDataModal';
import { HabitLibraryModal } from './HabitLibraryModal';
import { logEmoji, logEffect } from '../data/habitLibrary';

interface TodayViewProps {
  timeOfDayMode: 'auto' | 'morning' | 'evening';
  onNavigateTab: (tab: 'today' | 'insights' | 'experiments' | 'me') => void;
}

export const TodayView: React.FC<TodayViewProps> = ({ timeOfDayMode, onNavigateTab }) => {
  const {
    sleepRecords,
    behaviorLogs,
    activeExperiment,
    toggleAdherenceToday,
    quickLogBehavior,
    latestSleep,
    habits,
    logHabit,
    h1Metrics,
    theme,
  } = useSleep();

  const isDark = theme === 'dark';

  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [quickLogType, setQuickLogType] = useState<BehaviorType>('coffee');
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isConcludeOpen, setIsConcludeOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Derive time of day
  const hour = new Date().getHours();
  const isEvening = timeOfDayMode === 'evening' || (timeOfDayMode === 'auto' && hour >= 18);
  const greeting = isEvening ? 'Good evening, Andre' : 'Good morning, Andre';

  // Last night sleep record
  const lastSleep = latestSleep;
  const [isTestDataOpen, setIsTestDataOpen] = useState(false);
  const [isHabitLibraryOpen, setIsHabitLibraryOpen] = useState(false);

  // Adherence calculation
  const completedDaysCount = activeExperiment
    ? Object.values(activeExperiment.adherence).filter(Boolean).length
    : 0;
  const currentDayIndex = Math.min(completedDaysCount + 1, 7);
  const isTodayCompleted = activeExperiment?.adherence[currentDayIndex] || false;

  // Today's behavior logs
  const todayStr = localDateStr(new Date());
  const todaysLogs = behaviorLogs.filter(
    (b) => b.date === todayStr
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), msg.length > 80 ? 7000 : 3200);
  };

  const handleOpenDetailedLog = (type: BehaviorType) => {
    setQuickLogType(type);
    setIsQuickLogOpen(true);
  };

  return (
    <div className="space-y-6 pb-24 max-w-xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md items-start gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold leading-snug text-white shadow-xl animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="mt-px h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {greeting}
          </h1>
          <p className={`mt-0.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isEvening
              ? 'Prepare your evening wind-down and check today’s experiment.'
              : 'Here is your overnight recovery and active experiment.'}
          </p>
        </div>
        <button
          onClick={() => setIsCheckInOpen(true)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            isDark
              ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <Clock className={`h-3.5 w-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
          <span>Morning Check-in</span>
        </button>
      </div>

      {/* Sleep Score (tracking) */}
      <SleepScoreCard onOpenTestData={() => setIsTestDataOpen(true)} onOpenTrends={() => onNavigateTab('insights')} />
      <TestDataModal isOpen={isTestDataOpen} onClose={() => setIsTestDataOpen(false)} onLoaded={showToast} />

      {/* Last night: sleep + this morning's energy in one card */}
      <div
        className={`rounded-2xl border p-5 transition-colors ${
          isDark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200/90 bg-white shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Last Night{lastSleep ? ` · ${lastSleep.date}` : ''}
          </div>
          {lastSleep?.wearable && (
            <span className={`flex items-center gap-1 text-[10px] font-semibold ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
              <Watch className="h-3 w-3" /> {lastSleep.wearable.source}
            </span>
          )}
        </div>

        {lastSleep ? (
          <>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold tracking-tight font-mono tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {Math.floor(lastSleep.sleepDurationMinutes / 60)}h {String(lastSleep.sleepDurationMinutes % 60).padStart(2, '0')}m
                </span>
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>asleep</span>
              </div>
              <span className={`font-mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {lastSleep.bedTime} → {lastSleep.wakeTime}
              </span>
            </div>

            <div className={`mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3 sm:grid-cols-4 ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
              <div>
                <div className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Sleep quality</div>
                <div className="mt-1 flex items-center gap-0.5" aria-label={`Sleep quality ${lastSleep.quality} of 5`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        star <= lastSleep.quality ? 'fill-amber-400 text-amber-400' : isDark ? 'text-slate-700' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Energy this morning</div>
                <div className="mt-1 flex items-center gap-1" aria-label={`Morning energy ${lastSleep.morningEnergy} of 5`}>
                  {[1, 2, 3, 4, 5].map((dot) => (
                    <span
                      key={dot}
                      className={`h-2.5 w-2.5 rounded-full ${
                        dot <= lastSleep.morningEnergy ? 'bg-emerald-500' : isDark ? 'bg-slate-800' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                  <span className="ml-1 font-mono text-xs font-bold text-emerald-600">{lastSleep.morningEnergy}/5</span>
                </div>
              </div>
              <div>
                <div className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Fell asleep in</div>
                <div className={`mt-0.5 font-mono text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {lastSleep.sleepOnsetLatencyMinutes} min
                </div>
              </div>
              <div>
                <div className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Wake-ups</div>
                <div className={`mt-0.5 font-mono text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {lastSleep.nightAwakenings}
                </div>
              </div>
            </div>

            {lastSleep.wearable && (
              <div className={`mt-3 flex flex-wrap gap-x-4 gap-y-1 rounded-lg px-3 py-2 font-mono text-[11px] ${isDark ? 'bg-slate-950/60 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                {lastSleep.wearable.deepMinutes != null && <span>Deep {lastSleep.wearable.deepMinutes}m</span>}
                {lastSleep.wearable.remMinutes != null && <span>REM {lastSleep.wearable.remMinutes}m</span>}
                {lastSleep.wearable.awakeMinutes != null && <span>Awake {lastSleep.wearable.awakeMinutes}m</span>}
                {lastSleep.wearable.spo2Avg != null && <span>SpO₂ {lastSleep.wearable.spo2Avg}%</span>}
                {lastSleep.wearable.restingHeartRate != null && <span>RHR {lastSleep.wearable.restingHeartRate}</span>}
                {lastSleep.wearable.hrvMs != null && <span>HRV {lastSleep.wearable.hrvMs}ms</span>}
              </div>
            )}

            {lastSleep.notes && (
              <p className={`mt-2 text-[11px] italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>"{lastSleep.notes}"</p>
            )}
          </>
        ) : (
          <div className="mt-2">
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              No night logged yet. Do your morning check-in to see last night's sleep and this morning's energy here.
            </p>
            <button
              onClick={() => setIsCheckInOpen(true)}
              className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Start morning check-in
            </button>
          </div>
        )}
      </div>

      {/* Quick Log Section (Designed for <3s logging) */}
      <div
        className={`rounded-2xl border p-5 transition-colors ${
          isDark
            ? 'border-slate-800 bg-slate-900/70'
            : 'border-slate-200/90 bg-white shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Quick Log
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              1 tap to record factors in &lt;5 seconds
            </p>
          </div>
          <span
            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
              isDark
                ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40'
                : 'text-emerald-700 bg-emerald-50 border-emerald-200'
            }`}
          >
            {h1Metrics.totalQuickLogs ? `avg ${h1Metrics.avgQuickLogSeconds}s` : 'not timed yet'}
          </span>
        </div>

        {/* 6 Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {[
            { type: 'coffee' as BehaviorType, icon: '☕', label: 'Coffee' },
            { type: 'exercise' as BehaviorType, icon: '🏃', label: 'Exercise' },
            { type: 'nap' as BehaviorType, icon: '😴', label: 'Nap' },
            { type: 'stress' as BehaviorType, icon: '😰', label: 'Stress' },
            { type: 'alcohol' as BehaviorType, icon: '🍺', label: 'Alcohol' },
            { type: 'screen' as BehaviorType, icon: '📱', label: 'Screen' },
          ].map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => handleOpenDetailedLog(item.type)}
              className={`flex min-h-[54px] flex-col items-center justify-center rounded-xl border p-2 text-center active:scale-95 transition-all group ${
                isDark
                  ? 'border-slate-800 bg-slate-950/80 hover:border-indigo-500/60 hover:bg-slate-800'
                  : 'border-slate-200/80 bg-slate-50/70 hover:border-indigo-400 hover:bg-indigo-50/60 shadow-xs'
              }`}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              <span
                className={`mt-1 text-[11px] font-medium transition-colors ${
                  isDark
                    ? 'text-slate-300 group-hover:text-white'
                    : 'text-slate-700 group-hover:text-indigo-900'
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Your habits: one tap logs instantly */}
        <div className={`mt-4 pt-3 border-t ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}>
          <div className="mb-2 flex items-center justify-between">
            <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Your habits</span>
            <span className={`flex items-center gap-2 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <span className="flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> helps</span>
              <span className="flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> hurts</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
            {habits.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  logHabit(h);
                  showToast(`Logged: ${h.label}`);
                }}
                title={`${h.label} (${h.effect === 'helps' ? 'likely helps' : 'likely hurts'} sleep)`}
                className={`relative flex min-h-[54px] flex-col items-center justify-center rounded-xl border p-2 text-center active:scale-95 transition-all ${
                  isDark
                    ? 'border-slate-800 bg-slate-950/80 hover:border-indigo-500/60 hover:bg-slate-800'
                    : 'border-slate-200/80 bg-slate-50/70 hover:border-indigo-400 hover:bg-indigo-50/60 shadow-xs'
                }`}
              >
                <span
                  className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${h.effect === 'helps' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  aria-hidden="true"
                />
                <span className="text-xl">{h.emoji}</span>
                <span
                  className={`mt-1 line-clamp-2 text-[10px] font-medium leading-tight ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                >
                  {h.label}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsHabitLibraryOpen(true)}
              className={`flex min-h-[54px] flex-col items-center justify-center rounded-xl border border-dashed p-2 text-center transition-colors ${
                isDark ? 'border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-300' : 'border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-700'
              }`}
            >
              <Plus className="h-5 w-5" />
              <span className="mt-1 text-[10px] font-semibold">Add habit</span>
            </button>
          </div>
        </div>
        <HabitLibraryModal isOpen={isHabitLibraryOpen} onClose={() => setIsHabitLibraryOpen(false)} />

        {/* Today's recorded behaviors timeline */}
        {todaysLogs.length > 0 && (
          <div className={`mt-4 pt-3 border-t ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}>
            <div className={`text-[11px] font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Logged Today:
            </div>
            <div className="space-y-1.5">
              {todaysLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs border ${
                    isDark
                      ? 'bg-slate-950/50 border-slate-800/50 text-slate-300'
                      : 'bg-slate-50 border-slate-200/70 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="relative text-sm">
                      {logEmoji(log)}
                      {logEffect(log) && (
                        <span
                          className={`absolute -right-1 -top-0.5 h-1.5 w-1.5 rounded-full ${logEffect(log) === 'helps' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      {log.title}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {log.detail}
                    </span>
                  </div>
                  <span className={`font-mono text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {log.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active Experiment Card (The Heart of Sleep Lab) */}
      {activeExperiment ? (
        <div
          className={`rounded-2xl border p-5 transition-all ${
            isDark
              ? 'border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 shadow-lg shadow-indigo-950/20'
              : 'border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50/50 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                className={`flex items-center gap-2 text-sm font-bold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Sparkles className={`h-4 w-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <span>Want to improve your sleep?</span>
              </h2>
              <p className={`mt-0.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Try a 7-day experiment to work on one of your sleep habits.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('experiments')}
              className={`shrink-0 text-xs font-medium transition-colors flex items-center gap-1 ${
                isDark ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-600 hover:text-indigo-700'
              }`}
            >
              <span>View details</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Title & Rule */}
          <div className="mt-3 flex items-start gap-3">
            <span className="text-3xl leading-none">{activeExperiment.icon}</span>
            <div>
              <h3
                className={`text-lg font-bold tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {activeExperiment.title}
              </h3>
              <p
                className={`mt-1 text-xs leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {activeExperiment.actionRule}
              </p>
            </div>
          </div>

          {/* Day Progress & Stepper */}
          <div className={`mt-4 pt-3 border-t ${isDark ? 'border-slate-800/70' : 'border-slate-200/70'}`}>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Day{' '}
                <span className={`font-mono font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                  {completedDaysCount}
                </span>{' '}
                of 7
              </span>
              <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {Math.round((completedDaysCount / 7) * 100)}% complete
              </span>
            </div>

            {/* Visual 7-day pill grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((dayIdx) => {
                const isDone = !!activeExperiment.adherence[dayIdx];
                const isCurrent = dayIdx === currentDayIndex;
                return (
                  <button
                    key={dayIdx}
                    onClick={toggleAdherenceToday}
                    title={`Day ${dayIdx}: ${isDone ? 'Completed' : 'Pending'}`}
                    className={`h-2.5 rounded-full transition-all ${
                      isDone
                        ? isDark
                          ? 'bg-indigo-500 shadow-sm shadow-indigo-500/50'
                          : 'bg-indigo-600'
                        : isCurrent
                        ? isDark
                          ? 'bg-indigo-400/40 border border-indigo-400 animate-pulse'
                          : 'bg-indigo-200 border border-indigo-400 animate-pulse'
                        : isDark
                        ? 'bg-slate-800'
                        : 'bg-slate-200'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Adherence Checkbox Toggle */}
          <div
            className={`mt-5 flex items-center justify-between rounded-xl p-3 border transition-colors ${
              isDark
                ? 'bg-slate-950/60 border-slate-800/80'
                : 'bg-white border-slate-200/80 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={toggleAdherenceToday}
                className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-all ${
                  isTodayCompleted
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : isDark
                    ? 'border-slate-700 bg-slate-900 text-transparent hover:border-slate-500'
                    : 'border-slate-300 bg-slate-50 text-transparent hover:border-indigo-400'
                }`}
              >
                <Check className="h-4 w-4 stroke-[3]" />
              </button>
              <label
                onClick={toggleAdherenceToday}
                className={`cursor-pointer text-xs font-semibold ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                {isTodayCompleted ? 'Completed today ✓' : 'Mark completed today'}
              </label>
            </div>

            {completedDaysCount >= 7 && (
              <button
                onClick={() => setIsConcludeOpen(true)}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <span>Conclude Experiment</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`rounded-2xl border border-dashed p-5 text-center ${
            isDark
              ? 'border-slate-800 bg-slate-900/40'
              : 'border-slate-300 bg-white/70 shadow-xs'
          }`}
        >
          <Sparkles className="mx-auto h-6 w-6 text-indigo-500" />
          <h2 className={`mt-2 text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Want to improve your sleep?
          </h2>
          <p className={`mt-1 text-xs max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Try a 7-day experiment to work on one of your sleep habits.
          </p>
          <button
            onClick={() => onNavigateTab('experiments')}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
          >
            Browse 7-Day Experiments
          </button>
        </div>
      )}

      {/* Evening Wind-Down / Reflection Box */}
      {isEvening && (
        <div
          className={`rounded-2xl border p-5 transition-colors ${
            isDark
              ? 'border-slate-800 bg-slate-900/60'
              : 'border-slate-200/90 bg-white shadow-xs'
          }`}
        >
          <div
            className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-1 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <Moon className="h-3.5 w-3.5 text-indigo-600" />
            <span>Evening Reflection</span>
          </div>
          <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            How was your stress today? Quick reflection before bedtime:
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {['Low', 'Medium', 'High'].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => {
                  quickLogBehavior(
                    'stress',
                    'Evening Stress Check',
                    `${level} stress day`,
                    level.toLowerCase() as 'low' | 'medium' | 'high',
                    level === 'Low' ? 1 : level === 'Medium' ? 2 : 3,
                    1.4
                  );
                  showToast(`Stress recorded: ${level}`);
                }}
                className={`py-2 rounded-xl border text-xs font-semibold transition-colors ${
                  isDark
                    ? 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-indigo-500 hover:text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-900 shadow-xs'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <QuickLogModal
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        initialType={quickLogType}
        onLoggedSuccess={(type, dur) => {
          showToast(`Logged ${type} in ${dur}s!`);
        }}
      />

      <MorningReflectionModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
      />

      <ConcludeExperimentModal
        isOpen={isConcludeOpen}
        onClose={() => setIsConcludeOpen(false)}
        onConcluded={() => onNavigateTab('experiments')}
      />
    </div>
  );
};
