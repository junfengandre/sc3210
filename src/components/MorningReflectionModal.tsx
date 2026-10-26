import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, Star, Check, Watch, RefreshCw } from 'lucide-react';
import { computeSleepScore, simulateWearable, timeInBedMinutes, WEARABLE_SOURCES } from '../lib/sleepScore';
import { localDateStr } from '../data/testData';
import { ScoreWhy } from './ScoreBreakdown';
import { CareNotice } from './CareNotice';
import { useSleep } from '../context/SleepContext';
import { SleepQualityRating, EnergyRating, WearableData } from '../types/sleep';

interface MorningReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MorningReflectionModal: React.FC<MorningReflectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addSleepRecord, theme, pairedWearable, sleepRecords } = useSleep();
  const isDark = theme === 'dark';

  // Form state
  const [bedTime, setBedTime] = useState('00:45');
  const [wakeTime, setWakeTime] = useState('07:45');
  const [onsetLatency, setOnsetLatency] = useState(20);
  const [awakenings, setAwakenings] = useState(1);
  const [quality, setQuality] = useState<SleepQualityRating>(4);
  const [energy, setEnergy] = useState<EnergyRating>(4);
  const [notes, setNotes] = useState('');
  // Tracker data: pre-filled from the paired device's overnight sync, always editable
  const [trackerOn, setTrackerOn] = useState(false);
  const [tracker, setTracker] = useState<WearableData>({});
  const syncTracker = (device: string) =>
    setTracker(
      simulateWearable(
        device,
        Math.max(0, timeInBedMinutes(bedTime, wakeTime) - onsetLatency),
        quality,
        awakenings
      )
    );

  // Silent timing for requirement R1 (<30 s check-in): measured, not shown while you fill it in
  const openedAtRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      setTrackerOn(!!pairedWearable);
      syncTracker(pairedWearable || 'Apple Watch');
      openedAtRef.current = Date.now();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate sleep duration in minutes
  const calculateDurationMinutes = () => {
    const [bH, bM] = bedTime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);
    let totalMinutes = wH * 60 + wM - (bH * 60 + bM);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    return Math.max(0, totalMinutes - onsetLatency);
  };

  const durationMin = calculateDurationMinutes();
  const durationHours = (durationMin / 60).toFixed(1);
  const today = localDateStr(new Date());

  // Paired tracker: simulated overnight sync attached automatically (no extra taps)
  const wearable = trackerOn ? tracker : undefined;
  const setT = (k: keyof WearableData, v: string) =>
    setTracker((prev) => ({ ...prev, [k]: v === '' ? undefined : k === 'source' ? v : Number(v) }));
  const trackerFields: [keyof WearableData, string][] = [
    ['deepMinutes', 'Deep (min)'],
    ['remMinutes', 'REM (min)'],
    ['lightMinutes', 'Light (min)'],
    ['awakeMinutes', 'Awake (min)'],
    ['spo2Avg', 'SpO₂ (%)'],
    ['restingHeartRate', 'Resting HR'],
    ['hrvMs', 'HRV (ms)'],
  ];
  const fieldCls = `w-full rounded-lg border px-2 py-1.5 text-xs font-mono focus:border-indigo-500 focus:outline-none transition-colors ${
    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-900'
  }`;
  const previewScore = computeSleepScore(
    {
      id: 'preview',
      date: today,
      bedTime,
      wakeTime,
      sleepDurationMinutes: durationMin,
      sleepOnsetLatencyMinutes: onsetLatency,
      nightAwakenings: awakenings,
      quality,
      morningEnergy: energy,
      wearable,
    },
    sleepRecords
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSleepRecord({
      date: today,
      bedTime,
      wakeTime,
      sleepDurationMinutes: durationMin,
      sleepOnsetLatencyMinutes: onsetLatency,
      nightAwakenings: awakenings,
      quality,
      morningEnergy: energy,
      notes: notes.trim() || undefined,
      checkInDurationSeconds: Math.max(1, Math.round((Date.now() - openedAtRef.current) / 1000)),
      wearable,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl transition-colors ${
          isDark
            ? 'border-slate-800 bg-slate-900 text-white'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-start justify-between border-b pb-4 ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
          <div>
            <h2 className="font-display italic text-3xl leading-tight">Good morning, Andre</h2>
            <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Morning reflection · how did you sleep, and how do you feel now?
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Bedtime & Wake time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Bedtime
              </label>
              <input
                type="time"
                value={bedTime}
                onChange={(e) => setBedTime(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none transition-colors ${
                  isDark
                    ? 'border-slate-700 bg-slate-950 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-900 focus:bg-white'
                }`}
                required
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Wake Time
              </label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none transition-colors ${
                  isDark
                    ? 'border-slate-700 bg-slate-950 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-900 focus:bg-white'
                }`}
                required
              />
            </div>
          </div>

          {/* Sleep duration computed preview */}
          <div
            className={`flex items-center justify-between rounded-lg p-2.5 border text-xs ${
              isDark
                ? 'bg-slate-950/60 border-slate-800/60'
                : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Calculated Sleep Duration:</span>
            <span className={`font-mono font-semibold tabular-nums ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
              {Math.floor(durationMin / 60)}h {durationMin % 60}m ({durationHours} hours)
            </span>
          </div>

          {/* Time to fall asleep (Sleep Latency) */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-700 font-semibold'}>
                Time to fall asleep
              </span>
              <span className={`font-mono tabular-nums font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                ~{onsetLatency} min
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 35, 50].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setOnsetLatency(mins)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    onsetLatency === mins
                      ? isDark
                        ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300 font-bold'
                        : 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-xs'
                      : isDark
                      ? 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {mins === 50 ? '45m+' : `~${mins}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Night Awakenings */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-700 font-semibold'}>
                Night awakenings
              </span>
              <span className={`font-mono tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {awakenings} times
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[0, 1, 2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setAwakenings(count)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    awakenings === count
                      ? isDark
                        ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                        : 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-xs'
                      : isDark
                      ? 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {count === 4 ? '4+' : count}
                </button>
              ))}
            </div>
          </div>

          {/* Sleep Quality (1-5) */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-700 font-semibold'}>
                Subjective sleep quality
              </span>
              <span className="font-mono text-amber-600 tabular-nums font-semibold">
                {quality}/5 · {['Very Poor', 'Poor', 'Fair', 'Good', 'Restful'][quality - 1]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {([1, 2, 3, 4, 5] as SleepQualityRating[]).map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setQuality(star)}
                  className={`flex-1 py-2 rounded-lg border flex items-center justify-center transition-all ${
                    quality >= star
                      ? isDark
                        ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                        : 'border-amber-400 bg-amber-50 text-amber-500 shadow-xs'
                      : isDark
                      ? 'border-slate-800 bg-slate-950/40 text-slate-700 hover:text-slate-400'
                      : 'border-slate-200 bg-slate-50 text-slate-300 hover:text-slate-500'
                  }`}
                >
                  <Star className="h-4 w-4 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Morning Energy (1-5) */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-700 font-semibold'}>
                Energy right now
              </span>
              <span className="font-mono text-emerald-600 tabular-nums font-semibold">
                {energy}/5 · {['Drained', 'Sluggish', 'Neutral', 'Clear', 'Energized'][energy - 1]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {([1, 2, 3, 4, 5] as EnergyRating[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setEnergy(level)}
                  className={`flex-1 py-2 rounded-lg border flex items-center justify-center transition-all ${
                    energy >= level
                      ? isDark
                        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400'
                        : 'border-emerald-400 bg-emerald-50 text-emerald-600 shadow-xs'
                      : isDark
                      ? 'border-slate-800 bg-slate-950/40 text-slate-700 hover:text-slate-400'
                      : 'border-slate-200 bg-slate-50 text-slate-300 hover:text-slate-500'
                  }`}
                >
                  <Zap className="h-4 w-4 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Optional notes */}
          <div>
            <label
              htmlFor="ci-notes"
              className={`block text-xs ${isDark ? 'text-slate-300 font-medium' : 'text-slate-700 font-semibold'}`}
            >
              What did you think about your sleep yesterday?
            </label>
            <p className={`mt-0.5 mb-1.5 text-[11px] leading-snug ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Putting it into words helps you become more conscious of your sleep habits.
            </p>
            <input
              id="ci-notes"
              type="text"
              placeholder="e.g. late cold brew, room was warm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none transition-colors ${
                isDark
                  ? 'border-slate-800 bg-slate-950 text-white placeholder-slate-500'
                  : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white'
              }`}
            />
          </div>

          {/* Tracker data */}
          <div
            className={`rounded-xl border p-3 ${
              isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <label className="flex cursor-pointer items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-xs font-semibold">
                <Watch className="h-4 w-4 text-violet-500" />
                <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>Tracker data</span>
                {trackerOn && tracker.source && (
                  <span className={`font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    · {tracker.source}
                    {pairedWearable === tracker.source ? ' · synced' : ''}
                  </span>
                )}
              </span>
              <input
                id="ci-tracker"
                type="checkbox"
                checked={trackerOn}
                onChange={(e) => setTrackerOn(e.target.checked)}
                className="h-4 w-4 accent-violet-600"
              />
            </label>

            {!trackerOn && (
              <p className={`mt-1 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Optional. Tick to add sleep stages, blood oxygen and heart data from a watch or ring.
              </p>
            )}

            {trackerOn && (
              <div className="mt-3 space-y-2.5">
                <div className="flex gap-2">
                  <select
                    id="ci-tracker-device"
                    aria-label="Tracker device"
                    value={tracker.source || ''}
                    onChange={(e) => setT('source', e.target.value)}
                    className={`${fieldCls} font-sans`}
                  >
                    {WEARABLE_SOURCES.map((w) => (
                      <option key={w}>{w}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => syncTracker(tracker.source || pairedWearable || 'Apple Watch')}
                    className={`flex shrink-0 items-center gap-1 rounded-lg border px-2.5 text-[11px] font-semibold ${
                      isDark ? 'border-violet-800/60 text-violet-300 hover:bg-violet-950/40' : 'border-violet-200 text-violet-700 hover:bg-violet-50'
                    }`}
                  >
                    <RefreshCw className="h-3 w-3" />
                    {pairedWearable ? 'Re-sync' : 'Simulate sync'}
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {trackerFields.map(([k, l]) => (
                    <div key={k}>
                      <label htmlFor={`ci-t-${k}`} className={`mb-0.5 block text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {l}
                      </label>
                      <input
                        id={`ci-t-${k}`}
                        type="number"
                        inputMode="numeric"
                        value={(tracker[k] as number | undefined) ?? ''}
                        onChange={(e) => setT(k, e.target.value)}
                        className={fieldCls}
                      />
                    </div>
                  ))}
                </div>
                <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  {pairedWearable
                    ? `Pre-filled from your ${pairedWearable} (simulated sync). Edit any value before saving.`
                    : 'Type values from your tracker app, or simulate a sync. Pair a tracker in Me to pre-fill these every morning.'}
                </p>
              </div>
            )}
          </div>

          {/* Live score, visualised */}
          <ScoreWhy score={previewScore} isDark={isDark} />

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.99] transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Save Morning Reflection</span>
            </button>
            <div className="mt-2 text-center">
              <CareNotice compact />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
