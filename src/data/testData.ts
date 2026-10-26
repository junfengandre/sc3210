import { ActiveExperiment, BehaviorLog, BehaviorType, HabitDefinition, HabitEffect, SleepRecord, SleepQualityRating, EnergyRating, WearableData } from '../types/sleep';
import { HABIT_LIBRARY } from './habitLibrary';
import { timeInBedMinutes } from '../lib/sleepScore';

export type NewNight = Omit<SleepRecord, 'id'>;
export type NewLog = Omit<BehaviorLog, 'id' | 'createdAt'>;

export const localDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Date string `daysAgo` days before today (local time) */
export const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDateStr(d);
};

const clampRating = (n: number) => Math.min(5, Math.max(1, Math.round(n))) as SleepQualityRating & EnergyRating;

export const makeNight = (
  date: string,
  bedTime: string,
  wakeTime: string,
  latency: number,
  wakeUps: number,
  quality: number,
  energy: number,
  notes?: string,
  wearable?: WearableData
): NewNight => ({
  date,
  bedTime,
  wakeTime,
  sleepOnsetLatencyMinutes: latency,
  sleepDurationMinutes: Math.max(0, timeInBedMinutes(bedTime, wakeTime) - latency),
  nightAwakenings: wakeUps,
  quality: clampRating(quality),
  morningEnergy: clampRating(energy),
  notes,
  wearable,
});

export const CSV_HEADER = 'date,bedtime,waketime,latency,wakeups,quality,energy,device,deep,rem,light,awake,rhr,hrv,spo2,notes';

export const csvExample = () =>
  [
    CSV_HEADER,
    `${daysAgo(3)},23:30,07:15,15,1,4,4,,,,,,,,,`,
    `${daysAgo(2)},01:45,08:00,45,3,2,2,,,,,,,,,Late coffee`,
    `${daysAgo(1)},23:50,07:30,20,1,4,3,Apple Watch,62,88,280,18,58,47,97,`,
  ].join('\n');

export interface CsvParseResult {
  nights: NewNight[];
  errors: string[];
}

const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse pasted CSV (header row required; device/wearable columns optional) */
export function parseSleepCsv(text: string): CsvParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const errors: string[] = [];
  if (lines.length < 2) return { nights: [], errors: ['Add a header row and at least one night.'] };

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  for (const req of ['date', 'bedtime', 'waketime', 'latency', 'wakeups', 'quality', 'energy']) {
    if (col(req) < 0) errors.push(`Missing column "${req}".`);
  }
  if (errors.length) return { nights: [], errors };

  const nights: NewNight[] = [];
  lines.slice(1).forEach((line, idx) => {
    const cells = line.split(',').map((c) => c.trim());
    const get = (name: string) => (col(name) >= 0 ? cells[col(name)] ?? '' : '');
    const num = (name: string) => {
      const v = get(name);
      return v === '' ? undefined : Number(v);
    };
    const row = idx + 2;
    const date = get('date');
    const bed = get('bedtime').padStart(5, '0');
    const wake = get('waketime').padStart(5, '0');
    if (!DATE_RE.test(date)) return errors.push(`Row ${row}: date must be YYYY-MM-DD.`);
    if (!TIME_RE.test(bed) || !TIME_RE.test(wake)) return errors.push(`Row ${row}: times must be HH:MM (24-hour).`);
    const latency = num('latency');
    const wakeups = num('wakeups');
    const quality = num('quality');
    const energy = num('energy');
    if ([latency, wakeups, quality, energy].some((v) => v == null || Number.isNaN(v))) {
      return errors.push(`Row ${row}: latency, wakeups, quality and energy must be numbers.`);
    }
    if (quality! < 1 || quality! > 5 || energy! < 1 || energy! > 5) {
      return errors.push(`Row ${row}: quality and energy are 1–5.`);
    }

    const wearableFields = {
      deepMinutes: num('deep'),
      remMinutes: num('rem'),
      lightMinutes: num('light'),
      awakeMinutes: num('awake'),
      restingHeartRate: num('rhr'),
      hrvMs: num('hrv'),
      spo2Avg: num('spo2'),
    };
    const hasWearable = Object.values(wearableFields).some((v) => v != null && !Number.isNaN(v));
    const wearable: WearableData | undefined = hasWearable
      ? { source: get('device') || 'Wearable', ...wearableFields }
      : undefined;

    nights.push(makeNight(date, bed, wake, latency!, wakeups!, quality!, energy!, get('notes') || undefined, wearable));
  });
  return { nights, errors };
}


// ---------------- Behaviour / habit CSV ----------------

export const BEHAVIOUR_CSV_HEADER = 'date,time,type,title,detail,intensity,value,habit_id,emoji,effect';

const BUILTIN_TYPES: BehaviorType[] = ['coffee', 'exercise', 'nap', 'stress', 'alcohol', 'screen'];

export interface BehaviourCsvResult {
  logs: NewLog[];
  habits: HabitDefinition[];
  errors: string[];
}

const slug = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

/** Parse a behaviours CSV: built-in types (coffee, exercise…) or type "habit" with an effect */
export function parseBehaviourCsv(text: string): BehaviourCsvResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const errors: string[] = [];
  if (lines.length < 2) return { logs: [], habits: [], errors: ['Add a header row and at least one behaviour.'] };
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const col = (n: string) => header.indexOf(n);
  for (const req of ['date', 'time', 'type', 'title']) if (col(req) < 0) errors.push(`Missing column "${req}".`);
  if (errors.length) return { logs: [], habits: [], errors };

  const logs: NewLog[] = [];
  const habits = new Map<string, HabitDefinition>();
  lines.slice(1).forEach((line, idx) => {
    const cells = line.split(',').map((c) => c.trim());
    const get = (n: string) => (col(n) >= 0 ? cells[col(n)] ?? '' : '');
    const row = idx + 2;
    const date = get('date');
    const time = get('time').padStart(5, '0');
    const type = get('type').toLowerCase();
    const title = get('title');
    if (!DATE_RE.test(date)) return errors.push(`Row ${row}: date must be YYYY-MM-DD.`);
    if (!TIME_RE.test(time)) return errors.push(`Row ${row}: time must be HH:MM (24-hour).`);
    if (!title) return errors.push(`Row ${row}: title is required.`);
    const intensityRaw = get('intensity').toLowerCase();
    const intensity = ['low', 'medium', 'high'].includes(intensityRaw) ? (intensityRaw as 'low' | 'medium' | 'high') : undefined;
    const valueRaw = get('value');
    const numericValue = valueRaw === '' ? undefined : Number(valueRaw);

    if (type === 'habit') {
      const effect = get('effect').toLowerCase() as HabitEffect;
      if (effect !== 'helps' && effect !== 'hurts') return errors.push(`Row ${row}: habits need effect "helps" or "hurts".`);
      const id = get('habit_id') || slug(title);
      const known = HABIT_LIBRARY.find((h) => h.id === id);
      const def: HabitDefinition = known ?? { id, label: title, emoji: get('emoji') || '⭐', effect, group: 'custom' };
      habits.set(def.id, def);
      logs.push({
        date,
        time,
        type: 'habit',
        habitId: def.id,
        habitEmoji: def.emoji,
        habitEffect: def.effect,
        title: def.label,
        detail: get('detail') || (def.effect === 'helps' ? 'Likely helps sleep' : 'Likely hurts sleep'),
      });
      return;
    }
    if (!BUILTIN_TYPES.includes(type as BehaviorType)) {
      return errors.push(`Row ${row}: type must be one of ${BUILTIN_TYPES.join(', ')} or habit.`);
    }
    logs.push({ date, time, type: type as BehaviorType, title, detail: get('detail'), intensity, numericValue });
  });
  return { logs, habits: [...habits.values()], errors };
}

/** Which kind of CSV is this? */
export const csvKind = (text: string): 'nights' | 'behaviours' | 'unknown' => {
  const header = text.split(/\r?\n/)[0]?.toLowerCase() ?? '';
  if (header.includes('bedtime')) return 'nights';
  if (header.includes('type') && header.includes('time')) return 'behaviours';
  return 'unknown';
};

// ---------------- Full dataset (JSON) & date shifting ----------------

export interface Dataset {
  sleepRecords: NewNight[];
  behaviorLogs: NewLog[];
  habits?: HabitDefinition[];
  scoreEntries?: Record<string, number>;
  activeExperiment?: ActiveExperiment | null;
  completedExperiments?: ActiveExperiment[];
}

/** Read a sleeplab JSON file (the app's own export format) */
export function parseDatasetJson(text: string): { data: Dataset | null; error?: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { data: null, error: 'This file is not valid JSON.' };
  }
  if (!raw || typeof raw !== 'object') return { data: null, error: 'This file is not a sleeplab dataset.' };
  const d = raw as Record<string, unknown>;
  if (!Array.isArray(d.sleepRecords) || !Array.isArray(d.behaviorLogs)) {
    return { data: null, error: 'The file needs "sleepRecords" and "behaviorLogs" lists.' };
  }
  return {
    data: {
      sleepRecords: d.sleepRecords as NewNight[],
      behaviorLogs: d.behaviorLogs as NewLog[],
      habits: Array.isArray(d.habits) ? (d.habits as HabitDefinition[]) : undefined,
      scoreEntries: d.scoreEntries && typeof d.scoreEntries === 'object' ? (d.scoreEntries as Record<string, number>) : undefined,
      activeExperiment: 'activeExperiment' in d ? ((d.activeExperiment as ActiveExperiment | null) ?? null) : undefined,
      completedExperiments: Array.isArray(d.completedExperiments) ? (d.completedExperiments as ActiveExperiment[]) : undefined,
    },
  };
}

const shiftDate = (iso: string, days: number) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return localDateStr(dt) + iso.slice(10);
};

/** Days to add so the latest night in the data lands on yesterday (today stays free for a live check-in) */
export function daysToShift(data: Pick<Dataset, 'sleepRecords' | 'behaviorLogs'>): number {
  const dates = [...data.sleepRecords.map((r) => r.date), ...data.behaviorLogs.map((b) => b.date)].sort();
  const latest = data.sleepRecords.length ? data.sleepRecords.map((r) => r.date).sort().pop()! : dates.pop();
  if (!latest) return 0;
  const [y, m, d] = latest.split('-').map(Number);
  const from = new Date(y, m - 1, d).getTime();
  const target = new Date();
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() - 1);
  return Math.round((target.getTime() - from) / 86400000);
}

export function shiftDataset(data: Dataset, days: number): Dataset {
  if (!days) return data;
  const shiftExp = (e: ActiveExperiment): ActiveExperiment => ({
    ...e,
    startDate: shiftDate(e.startDate, days),
    endDate: shiftDate(e.endDate, days),
    completedDate: e.completedDate ? shiftDate(e.completedDate, days) : e.completedDate,
  });
  return {
    ...data,
    sleepRecords: data.sleepRecords.map((r) => ({ ...r, date: shiftDate(r.date, days) })),
    behaviorLogs: data.behaviorLogs.map((b) => ({ ...b, date: shiftDate(b.date, days) })),
    scoreEntries: data.scoreEntries
      ? Object.fromEntries(Object.entries(data.scoreEntries).map(([k, v]) => [shiftDate(k, days), v]))
      : undefined,
    activeExperiment: data.activeExperiment ? shiftExp(data.activeExperiment) : data.activeExperiment,
    completedExperiments: data.completedExperiments?.map(shiftExp),
  };
}

export const dateRange = (data: Pick<Dataset, 'sleepRecords' | 'behaviorLogs'>) => {
  const dates = [...data.sleepRecords.map((r) => r.date), ...data.behaviorLogs.map((b) => b.date)].sort();
  return dates.length ? { from: dates[0], to: dates[dates.length - 1] } : null;
};
