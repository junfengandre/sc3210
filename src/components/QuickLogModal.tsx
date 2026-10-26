import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, Check } from 'lucide-react';
import { useSleep } from '../context/SleepContext';
import { BehaviorType } from '../types/sleep';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: BehaviorType;
  onLoggedSuccess?: (type: BehaviorType, duration: number) => void;
}

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  isOpen,
  onClose,
  initialType = 'coffee',
  onLoggedSuccess,
}) => {
  const { quickLogBehavior, activeExperiment, theme } = useSleep();
  const isDark = theme === 'dark';

  const [selectedType, setSelectedType] = useState<BehaviorType>(initialType);
  const [customDetail, setCustomDetail] = useState('');
  
  // Stopwatch to demonstrate H1 validation (<3s)
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedType(initialType);
      const now = Date.now();
      setStartTime(now);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(Number(((Date.now() - now) / 1000).toFixed(1)));
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const presetsByType: Record<BehaviorType, { label: string; detail: string; intensity?: 'low' | 'medium' | 'high'; val?: number }[]> = {
    coffee: [
      { label: 'Morning Coffee', detail: 'Morning cup (before 12 PM)', intensity: 'medium', val: 1 },
      { label: 'Afternoon Coffee (1-2 PM)', detail: 'Before 2 PM cut-off', intensity: 'medium', val: 1 },
      { label: 'Late Coffee (>2 PM)', detail: 'After 2 PM cutoff ⚠️', intensity: 'high', val: 1 },
      { label: 'Espresso / Pre-workout', detail: 'High caffeine dose (150mg+)', intensity: 'high', val: 2 },
    ],
    exercise: [
      { label: '30m Cardio / Run', detail: 'Moderate aerobic exercise', intensity: 'medium', val: 30 },
      { label: 'Gym / Strength 45m', detail: 'Resistance training', intensity: 'high', val: 45 },
      { label: '20m Brisk Walk', detail: 'Light movement', intensity: 'low', val: 20 },
      { label: 'Evening Yoga / Stretch', detail: 'Parasympathetic movement', intensity: 'low', val: 15 },
    ],
    nap: [
      { label: '20m Power Nap', detail: 'Restorative short nap', intensity: 'low', val: 20 },
      { label: '45m Nap', detail: 'Deep afternoon nap', intensity: 'medium', val: 45 },
      { label: 'Late Nap (>4 PM)', detail: 'Disrupted evening sleep pressure', intensity: 'high', val: 60 },
    ],
    stress: [
      { label: 'Low / Calm', detail: 'Relaxed mindset, no major pressure', intensity: 'low', val: 1 },
      { label: 'Medium Stress', detail: 'Standard workload, slight worry', intensity: 'medium', val: 2 },
      { label: 'High / Deadline Panic', detail: 'Racing mind, intense deadline pressure', intensity: 'high', val: 3 },
    ],
    alcohol: [
      { label: '1 Drink (Beer/Wine)', detail: '1 standard drink with dinner', intensity: 'low', val: 1 },
      { label: '2-3 Drinks', detail: 'Social drinking evening', intensity: 'medium', val: 2 },
      { label: 'Late Night Heavy', detail: 'Alcohol within 2h of bedtime', intensity: 'high', val: 3 },
    ],
    screen: [
      { label: '30m Phone in Bed', detail: 'Late scrolling before lights-out', intensity: 'medium', val: 30 },
      { label: 'Late Laptop Work', detail: 'Work/coding in bedroom', intensity: 'high', val: 60 },
      { label: 'Docked Phone Early', detail: 'No screens 30m before sleep ✓', intensity: 'low', val: 0 },
    ],
  };

  const handleQuickSubmit = (detail: string, intensity?: 'low' | 'medium' | 'high', val?: number) => {
    const duration = Number(((Date.now() - startTime) / 1000).toFixed(1));
    const titleMap: Record<BehaviorType, string> = {
      coffee: 'Coffee Logged',
      exercise: 'Workout Logged',
      nap: 'Nap Logged',
      stress: 'Stress Check-in',
      alcohol: 'Drink Logged',
      screen: 'Screen Habit Logged',
    };

    quickLogBehavior(
      selectedType,
      titleMap[selectedType],
      customDetail.trim() || detail,
      intensity || 'medium',
      val,
      duration
    );

    if (onLoggedSuccess) {
      onLoggedSuccess(selectedType, duration);
    }
    onClose();
  };

  const categoryIcons: Record<BehaviorType, string> = {
    coffee: '☕',
    exercise: '🏃',
    nap: '😴',
    stress: '😰',
    alcohol: '🍺',
    screen: '📱',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl transition-colors ${
          isDark
            ? 'border-slate-800 bg-slate-900 text-white'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        {/* Header with live <5s validation timer */}
        <div className={`flex items-start justify-between border-b pb-3 ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold">1-Tap Behavior Log</h2>
              <span
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-mono font-medium border ${
                  isDark
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/50'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                <Clock className="h-3 w-3" />
                <span className="tabular-nums font-semibold">{elapsed}s</span>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>/ goal &lt;5s</span>
              </span>
            </div>
            <p className={`mt-0.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              One tap to log daytime factors. No tedious forms.
            </p>
          </div>
          <button
            onClick={onClose}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              isDark
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Category selector row */}
        <div className="mt-4 grid grid-cols-6 gap-1.5">
          {(['coffee', 'exercise', 'nap', 'stress', 'alcohol', 'screen'] as BehaviorType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`flex flex-col items-center justify-center rounded-xl p-2 transition-all ${
                selectedType === type
                  ? isDark
                    ? 'bg-indigo-600/30 border border-indigo-500 text-white shadow-sm'
                    : 'bg-indigo-50 border border-indigo-400 text-indigo-700 shadow-xs'
                  : isDark
                  ? 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="text-lg leading-none">{categoryIcons[type]}</span>
              <span className="mt-1 text-[10px] font-medium capitalize truncate w-full text-center">
                {type}
              </span>
            </button>
          ))}
        </div>

        {/* Experiment reminder context banner */}
        {activeExperiment && activeExperiment.category === (selectedType === 'coffee' ? 'caffeine' : selectedType === 'exercise' ? 'movement' : selectedType === 'screen' ? 'digital' : '') && (
          <div
            className={`mt-3 rounded-lg p-2 text-[11px] flex items-center justify-between border ${
              isDark
                ? 'bg-indigo-950/40 border-indigo-800/40 text-indigo-300'
                : 'bg-indigo-50/80 border-indigo-200 text-indigo-700 font-medium'
            }`}
          >
            <span>Current Experiment: {activeExperiment.title}</span>
            <span className="font-mono font-semibold">Active</span>
          </div>
        )}

        {/* 1-Tap Presets (Instant click-to-save!) */}
        <div className="mt-4 space-y-2">
          <label className={`block text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Tap to record instantly:
          </label>
          <div className="space-y-1.5">
            {presetsByType[selectedType].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickSubmit(preset.detail, preset.intensity, preset.val)}
                className={`w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs font-medium active:scale-[0.99] transition-all group ${
                  isDark
                    ? 'border-slate-800 bg-slate-950/70 text-white hover:border-indigo-500 hover:bg-indigo-600/10'
                    : 'border-slate-200 bg-slate-50/80 text-slate-900 hover:border-indigo-400 hover:bg-indigo-50/70 shadow-xs'
                }`}
              >
                <div>
                  <div
                    className={`font-semibold transition-colors ${
                      isDark ? 'text-slate-200 group-hover:text-indigo-300' : 'text-slate-800 group-hover:text-indigo-700'
                    }`}
                  >
                    {preset.label}
                  </div>
                  <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {preset.detail}
                  </div>
                </div>
                <div
                  className={`flex items-center gap-1.5 transition-colors ${
                    isDark ? 'text-slate-500 group-hover:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-600'
                  }`}
                >
                  <span className="text-[10px] font-mono">1-tap</span>
                  <Check className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom entry alternative */}
        <div className={`mt-3 pt-3 border-t ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Or type custom detail (e.g. matcha latte 3:15pm)"
              value={customDetail}
              onChange={(e) => setCustomDetail(e.target.value)}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none transition-colors ${
                isDark
                  ? 'border-slate-800 bg-slate-950 text-white placeholder-slate-500'
                  : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white'
              }`}
            />
            {customDetail.trim() && (
              <button
                type="button"
                onClick={() => handleQuickSubmit(customDetail.trim())}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
              >
                Log
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
