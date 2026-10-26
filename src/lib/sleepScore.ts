import { SleepRecord, WearableData } from '../types/sleep';

/**
 * Sleep Score (0–100) built on standard sleep-hygiene thresholds:
 *  - Duration: NSF recommendation for adults 18–64 is 7–9 h (Hirshkowitz et al., 2015)
 *  - Latency, awakenings, WASO, efficiency: NSF sleep-quality indicators (Ohayon et al., 2017)
 *    latency ≤30 min good · ≤1 awakening good · WASO ≤20 min good · efficiency ≥85% good
 *  - Schedule regularity: bedtime within ±30 min of your recent average
 *  - Self-reported quality and morning energy
 * Wearable data, when present, adds stage-based components and the self-report
 * parts are scaled down so the total stays out of 100.
 */

export interface ScoreComponent {
  key: string;
  label: string;
  points: number; // earned (rounded to 1 dp)
  max: number; // possible
  value: string; // what was measured
  target: string; // the hygiene threshold
  source: 'check-in' | 'wearable';
}

export type ScoreBand = 'Excellent' | 'Good' | 'Fair' | 'Poor';

export interface SleepScore {
  total: number;
  band: ScoreBand;
  components: ScoreComponent[];
  usesWearable: boolean;
  biggestLoss: ScoreComponent | null;
  /** True when the user typed this score in, overriding the calculation */
  typed?: boolean;
  /** The calculated total before a typed override */
  calculatedTotal?: number;
}

export const bandFor = (total: number): ScoreBand =>
  total >= 85 ? 'Excellent' : total >= 70 ? 'Good' : total >= 55 ? 'Fair' : 'Poor';

/** One score per calendar day: a typed-in value wins over the calculated one */
export interface DailyScore {
  date: string;
  total: number;
  band: ScoreBand;
  source: 'typed' | 'calculated';
  recordId?: string;
}

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
/** Linear map of x from [x0,x1] to [y0,y1], clamped to the y range */
const lerp = (x: number, x0: number, x1: number, y0: number, y1: number) => {
  const t = clamp((x - x0) / (x1 - x0));
  return y0 + (y1 - y0) * t;
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Minutes after 18:00 so that 23:30 and 01:00 compare correctly */
export const bedtimeEveningMinutes = (hhmm: string) => (toMinutes(hhmm) - 18 * 60 + 1440) % 1440;

export const timeInBedMinutes = (bedTime: string, wakeTime: string) => {
  let diff = toMinutes(wakeTime) - toMinutes(bedTime);
  if (diff <= 0) diff += 1440;
  return diff;
};

const fmtHm = (min: number) => `${Math.floor(min / 60)}h ${String(Math.round(min % 60)).padStart(2, '0')}m`;

export const durationFraction = (hours: number) => {
  if (hours >= 7 && hours <= 9) return 1;
  if (hours < 7) return hours >= 6 ? lerp(hours, 6, 7, 0.5, 1) : lerp(hours, 4, 6, 0, 0.5);
  return hours <= 10 ? lerp(hours, 9, 10, 1, 0.8) : lerp(hours, 10, 11, 0.8, 0.5);
};

const latencyFraction = (min: number) =>
  min <= 30 ? 1 : min <= 45 ? lerp(min, 30, 45, 1, 0.4) : lerp(min, 45, 75, 0.4, 0);

const awakeningsFraction = (n: number) => (n <= 1 ? 1 : n <= 3 ? lerp(n, 1, 3, 1, 0.3) : lerp(n, 3, 5, 0.3, 0));

const regularityFraction = (deviationMin: number) =>
  deviationMin <= 30 ? 1 : lerp(deviationMin, 30, 120, 1, 0);

/** Total sleep from wearable stages if all three are present, else from the check-in */
export const effectiveSleepMinutes = (r: SleepRecord) => {
  const w = r.wearable;
  if (w && w.deepMinutes != null && w.remMinutes != null && w.lightMinutes != null) {
    return w.deepMinutes + w.remMinutes + w.lightMinutes;
  }
  return r.sleepDurationMinutes;
};

const hasWearable = (w?: WearableData) =>
  !!w && [w.deepMinutes, w.remMinutes, w.awakeMinutes, w.spo2Avg].some((v) => v != null && !Number.isNaN(v));

/**
 * @param record the night to score
 * @param history earlier nights (any order); the 7 most recent before this date set the bedtime baseline
 */
export function computeSleepScore(record: SleepRecord, history: SleepRecord[] = []): SleepScore {
  const usesWearable = hasWearable(record.wearable);
  const selfScale = usesWearable ? 0.75 : 1;
  const comps: ScoreComponent[] = [];
  const add = (c: Omit<ScoreComponent, 'points' | 'max'> & { fraction: number; weight: number }) => {
    const max = c.weight;
    comps.push({
      key: c.key,
      label: c.label,
      value: c.value,
      target: c.target,
      source: c.source,
      max: Math.round(max * 10) / 10,
      points: Math.round(clamp(c.fraction) * max * 10) / 10,
    });
  };

  // --- Check-in components (100 pts, or 75 when wearable data adds 25) ---
  const sleepMin = effectiveSleepMinutes(record);
  add({
    key: 'duration',
    label: 'Sleep duration',
    value: fmtHm(sleepMin),
    target: '7–9 h',
    source: 'check-in',
    fraction: durationFraction(sleepMin / 60),
    weight: 30 * selfScale,
  });
  add({
    key: 'latency',
    label: 'Time to fall asleep',
    value: `${record.sleepOnsetLatencyMinutes} min`,
    target: '≤ 30 min',
    source: 'check-in',
    fraction: latencyFraction(record.sleepOnsetLatencyMinutes),
    weight: 15 * selfScale,
  });
  add({
    key: 'awakenings',
    label: 'Night wake-ups',
    value: `${record.nightAwakenings}`,
    target: '0–1',
    source: 'check-in',
    fraction: awakeningsFraction(record.nightAwakenings),
    weight: 15 * selfScale,
  });

  const prior = history
    .filter((h) => h.id !== record.id && h.date < record.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 7);
  if (prior.length >= 2) {
    const avg = prior.reduce((acc, h) => acc + bedtimeEveningMinutes(h.bedTime), 0) / prior.length;
    const dev = Math.abs(bedtimeEveningMinutes(record.bedTime) - avg);
    add({
      key: 'regularity',
      label: 'Bedtime regularity',
      value: `${Math.round(dev)} min off your average`,
      target: '± 30 min',
      source: 'check-in',
      fraction: regularityFraction(dev),
      weight: 10 * selfScale,
    });
  } else {
    add({
      key: 'regularity',
      label: 'Bedtime regularity',
      value: 'Not enough history yet',
      target: '± 30 min',
      source: 'check-in',
      fraction: 1,
      weight: 10 * selfScale,
    });
  }

  add({
    key: 'quality',
    label: 'Rated sleep quality',
    value: `${record.quality}/5`,
    target: '5/5',
    source: 'check-in',
    fraction: (record.quality - 1) / 4,
    weight: 20 * selfScale,
  });
  add({
    key: 'energy',
    label: 'Morning energy',
    value: `${record.morningEnergy}/5`,
    target: '5/5',
    source: 'check-in',
    fraction: (record.morningEnergy - 1) / 4,
    weight: 10 * selfScale,
  });

  // --- Wearable components (25 pts) ---
  const w = record.wearable;
  if (usesWearable && w) {
    const total = sleepMin || 1;
    if (w.deepMinutes != null) {
      const pct = (w.deepMinutes / total) * 100;
      add({
        key: 'deep',
        label: 'Deep sleep',
        value: `${Math.round(pct)}% (${w.deepMinutes} min)`,
        target: '≥ 13%',
        source: 'wearable',
        fraction: lerp(pct, 5, 13, 0, 1),
        weight: 8,
      });
    }
    if (w.remMinutes != null) {
      const pct = (w.remMinutes / total) * 100;
      add({
        key: 'rem',
        label: 'REM sleep',
        value: `${Math.round(pct)}% (${w.remMinutes} min)`,
        target: '≥ 20%',
        source: 'wearable',
        fraction: lerp(pct, 10, 20, 0, 1),
        weight: 7,
      });
    }
    if (w.awakeMinutes != null) {
      add({
        key: 'waso',
        label: 'Awake after falling asleep',
        value: `${w.awakeMinutes} min`,
        target: '≤ 20 min',
        source: 'wearable',
        fraction: w.awakeMinutes <= 20 ? 1 : w.awakeMinutes <= 40 ? lerp(w.awakeMinutes, 20, 40, 1, 0.5) : lerp(w.awakeMinutes, 40, 60, 0.5, 0),
        weight: 6,
      });
    }
    if (w.spo2Avg != null) {
      add({
        key: 'spo2',
        label: 'Blood oxygen (avg)',
        value: `${w.spo2Avg}%`,
        target: '≥ 95%',
        source: 'wearable',
        fraction: lerp(w.spo2Avg, 90, 95, 0, 1),
        weight: 4,
      });
    }
  }

  const earned = comps.reduce((a, c) => a + c.points, 0);
  const possible = comps.reduce((a, c) => a + c.max, 0) || 1;
  const totalScore = Math.round((earned / possible) * 100);
  const band = bandFor(totalScore);

  const losses = comps.filter((c) => c.max - c.points >= 0.5).sort((a, b) => b.max - b.points - (a.max - a.points));

  return { total: totalScore, band, components: comps, usesWearable, biggestLoss: losses[0] ?? null };
}

/** Newest first: by date, then by when it was recorded */
export const sortNewestFirst = (records: SleepRecord[]) =>
  [...records].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return (b.recordedAt || '') > (a.recordedAt || '') ? 1 : -1;
  });

export const scoreAll = (records: SleepRecord[]): Record<string, SleepScore> => {
  const out: Record<string, SleepScore> = {};
  for (const r of records) out[r.id] = computeSleepScore(r, records);
  return out;
};

export const bandClasses = (band: ScoreBand, isDark: boolean) => {
  switch (band) {
    case 'Excellent':
      return isDark ? 'text-emerald-300 bg-emerald-950/50 border-emerald-800/50' : 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'Good':
      return isDark ? 'text-sky-300 bg-sky-950/50 border-sky-800/50' : 'text-sky-700 bg-sky-50 border-sky-200';
    case 'Fair':
      return isDark ? 'text-amber-300 bg-amber-950/50 border-amber-800/50' : 'text-amber-700 bg-amber-50 border-amber-200';
    default:
      return isDark ? 'text-rose-300 bg-rose-950/50 border-rose-800/50' : 'text-rose-700 bg-rose-50 border-rose-200';
  }
};

export const bandBarColor = (band: ScoreBand) =>
  band === 'Excellent' ? 'bg-emerald-500' : band === 'Good' ? 'bg-sky-500' : band === 'Fair' ? 'bg-amber-500' : 'bg-rose-500';

/** Simulated wearable sync: plausible stage split for a given night, nudged by self-report */
export function simulateWearable(source: string, sleepMinutes: number, quality: number, awakenings: number): WearableData {
  const q = clamp((quality - 1) / 4);
  const deepPct = 0.1 + 0.08 * q; // 10–18%
  const remPct = 0.16 + 0.07 * q; // 16–23%
  const deep = Math.round(sleepMinutes * deepPct);
  const rem = Math.round(sleepMinutes * remPct);
  return {
    source,
    deepMinutes: deep,
    remMinutes: rem,
    lightMinutes: Math.max(0, sleepMinutes - deep - rem),
    awakeMinutes: Math.round(8 + awakenings * 7),
    restingHeartRate: Math.round(62 - 6 * q),
    hrvMs: Math.round(38 + 22 * q),
    spo2Avg: Math.round(95 + 2 * q),
  };
}

export const WEARABLE_SOURCES = ['Apple Watch', 'Fitbit', 'Oura Ring', 'Garmin', 'Samsung Galaxy Watch', 'Other'];
