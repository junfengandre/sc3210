import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { localDateStr } from '../data/testData';
import { SleepScore, DailyScore, bandFor, scoreAll, sortNewestFirst } from '../lib/sleepScore';
import { HABIT_LIBRARY, DEFAULT_HABIT_IDS } from '../data/habitLibrary';
import {
  SleepRecord,
  BehaviorLog,
  ActiveExperiment,
  ExperimentTemplate,
  SleepFactorInsight,
  BehaviorType,
  HabitDefinition,
} from '../types/sleep';
import {
  initialSleepRecords,
  initialBehaviorLogs,
  initialActiveExperiment,
  experimentTemplates,
} from '../data/mockData';

interface SleepContextType {
  sleepRecords: SleepRecord[];
  behaviorLogs: BehaviorLog[];
  activeExperiment: ActiveExperiment | null;
  completedExperiments: ActiveExperiment[];
  experimentTemplates: ExperimentTemplate[];
  insights: SleepFactorInsight[];
  selectedInsight: SleepFactorInsight | null;
  setSelectedInsight: (insight: SleepFactorInsight | null) => void;
  
  // Actions
  addSleepRecord: (record: Omit<SleepRecord, 'id'>) => SleepRecord;
  deleteSleepRecord: (id: string) => void;
  quickLogBehavior: (
    type: BehaviorType,
    title: string,
    detail: string,
    intensity?: 'low' | 'medium' | 'high',
    numericValue?: number,
    loggedDurationSeconds?: number
  ) => BehaviorLog;
  deleteBehaviorLog: (id: string) => void;
  
  // Experiment Actions
  startExperiment: (templateId: string) => void;
  toggleAdherenceToday: () => void;
  setAdherenceForDay: (dayIndex: number, completed: boolean) => void;
  concludeExperiment: (decision: 'keep' | 'change') => void;
  cancelActiveExperiment: () => void;
  
  // Reset
  resetToDemoData: () => void;
  importData: (data: unknown) => { ok: boolean; message: string };

  // Sleep score & tracking
  sleepScores: Record<string, SleepScore>;
  latestSleep: SleepRecord | undefined;
  pairedWearable: string | null;
  setPairedWearable: (source: string | null) => void;
  loadTestData: (
    data: {
      sleepRecords: (Omit<SleepRecord, 'id'> & { id?: string })[];
      behaviorLogs?: (Omit<BehaviorLog, 'id' | 'createdAt'> & { id?: string; createdAt?: string })[];
      habits?: HabitDefinition[];
      scoreEntries?: Record<string, number>;
      activeExperiment?: ActiveExperiment | null;
      completedExperiments?: ActiveExperiment[];
    },
    mode: 'append' | 'replace'
  ) => void;
  /** Times the insight cards recalculated after new data this session (requirement check) */
  insightRefreshCount: number;
  /** Averages from nights logged since the active experiment started (null if none yet) */
  experimentProgress: {
    onsetLatencyMinutes: number;
    sleepDurationMinutes: number;
    morningEnergy: number;
    sleepQuality: number;
    nights: number;
  } | null;

  // Typed-in scores & per-day scores
  scoreEntries: Record<string, number>;
  setScoreEntry: (date: string, value: number | null) => void;
  dailyScores: Record<string, DailyScore>;

  // Habits (one-tap tiles)
  habits: HabitDefinition[];
  addHabit: (habit: HabitDefinition) => void;
  removeHabit: (id: string) => void;
  logHabit: (habit: HabitDefinition) => BehaviorLog;
  
  // Validation / H1 logging speed metrics
  lastCheckInDurationSeconds: number;
  lastQuickLogDurationSeconds: number;
  h1Metrics: {
    avgCheckInSeconds: number;
    avgQuickLogSeconds: number;
    totalCheckIns: number;
    totalQuickLogs: number;
  };
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// Storage writes can throw (private windows, blocked site data) — never let that crash the app
const safeSet = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
};
const safeRemove = (key: string) => {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
};

const SleepContext = createContext<SleepContextType | undefined>(undefined);

const STORAGE_KEY_SLEEP = 'sleep_lab_records_v2';
const STORAGE_KEY_BEHAVIORS = 'sleep_lab_behaviors_v2';
const STORAGE_KEY_EXP_ACTIVE = 'sleep_lab_active_exp_v2';
const STORAGE_KEY_EXP_COMPLETED = 'sleep_lab_completed_exp_v2';

export const SleepProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SLEEP);
      return saved ? JSON.parse(saved) : initialSleepRecords;
    } catch {
      return initialSleepRecords;
    }
  });

  const [behaviorLogs, setBehaviorLogs] = useState<BehaviorLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BEHAVIORS);
      return saved ? JSON.parse(saved) : initialBehaviorLogs;
    } catch {
      return initialBehaviorLogs;
    }
  });

  const [activeExperiment, setActiveExperiment] = useState<ActiveExperiment | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXP_ACTIVE);
      if (saved) return JSON.parse(saved);
      return initialActiveExperiment;
    } catch {
      return initialActiveExperiment;
    }
  });

  const [completedExperiments, setCompletedExperiments] = useState<ActiveExperiment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXP_COMPLETED);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedInsight, setSelectedInsight] = useState<SleepFactorInsight | null>(null);
  const [lastCheckInDurationSeconds, setLastCheckInDurationSeconds] = useState<number>(0);
  const [lastQuickLogDurationSeconds, setLastQuickLogDurationSeconds] = useState<number>(0);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('sleep_lab_theme_v1');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [scoreEntries, setScoreEntries] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('sleep_lab_typed_scores_v2');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  useEffect(() => {
    safeSet('sleep_lab_typed_scores_v2', JSON.stringify(scoreEntries));
  }, [scoreEntries]);
  const setScoreEntry = (date: string, value: number | null) => {
    setScoreEntries((prev) => {
      const next = { ...prev };
      if (value == null || Number.isNaN(value)) delete next[date];
      else next[date] = Math.max(0, Math.min(100, Math.round(value)));
      return next;
    });
  };

  const [habits, setHabits] = useState<HabitDefinition[]>(() => {
    try {
      const saved = localStorage.getItem('sleep_lab_habits_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      /* fall through */
    }
    return HABIT_LIBRARY.filter((h) => DEFAULT_HABIT_IDS.includes(h.id));
  });
  useEffect(() => {
    safeSet('sleep_lab_habits_v2', JSON.stringify(habits));
  }, [habits]);
  const addHabit = (habit: HabitDefinition) =>
    setHabits((prev) => (prev.some((h) => h.id === habit.id) ? prev : [...prev, habit]));
  const removeHabit = (id: string) => setHabits((prev) => prev.filter((h) => h.id !== id));

  const [pairedWearable, setPairedWearableState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('sleep_lab_wearable_v1');
    } catch {
      return null;
    }
  });
  const setPairedWearable = (source: string | null) => {
    setPairedWearableState(source);
    if (source) safeSet('sleep_lab_wearable_v1', source);
    else safeRemove('sleep_lab_wearable_v1');
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      safeSet('sleep_lab_theme_v1', next);
      return next;
    });
  };

  // Sync with localStorage
  useEffect(() => {
    safeSet(STORAGE_KEY_SLEEP, JSON.stringify(sleepRecords));
  }, [sleepRecords]);

  useEffect(() => {
    safeSet(STORAGE_KEY_BEHAVIORS, JSON.stringify(behaviorLogs));
  }, [behaviorLogs]);

  useEffect(() => {
    if (activeExperiment) {
      safeSet(STORAGE_KEY_EXP_ACTIVE, JSON.stringify(activeExperiment));
    } else {
      safeRemove(STORAGE_KEY_EXP_ACTIVE);
    }
  }, [activeExperiment]);

  useEffect(() => {
    safeSet(STORAGE_KEY_EXP_COMPLETED, JSON.stringify(completedExperiments));
  }, [completedExperiments]);

  // Compute personal insights dynamically based on sleep records and behavior logs
  // Personal with/without comparisons, calculated only from logged data.
  // An insight appears once there are at least 2 nights with and 2 without the behaviour.
  const insights = useMemo<SleepFactorInsight[]>(() => {
    const MIN_NIGHTS = 2;
    const mean = (rs: SleepRecord[], f: (r: SleepRecord) => number) =>
      rs.length ? rs.reduce((a, r) => a + f(r), 0) / rs.length : 0;
    const groupStats = (rs: SleepRecord[], label: string) => ({
      label,
      onsetLatency: Math.round(mean(rs, (r) => r.sleepOnsetLatencyMinutes)),
      durationHours: Number((mean(rs, (r) => r.sleepDurationMinutes) / 60).toFixed(1)),
      quality: Number(mean(rs, (r) => r.quality).toFixed(1)),
      energy: Number(mean(rs, (r) => r.morningEnergy).toFixed(1)),
      count: rs.length,
    });
    const hhmm = (min: number) => `${Math.floor(min / 60)}h ${String(Math.round(min % 60)).padStart(2, '0')}m`;

    type Def = {
      id: string;
      factor: BehaviorType;
      title: string;
      icon: string;
      days: Set<string>;
      withLabel: string;
      withoutLabel: string;
      metric: 'duration' | 'latency' | 'awakenings';
      goodWhenHigher: boolean;
      explanation: string;
      phrase: string; // "on days you exercised"
      recommendedExperimentId: string;
    };
    // A check-in is dated the morning after the night it describes, so a behaviour
    // on day D is compared with the sleep record dated D + 1.
    const nextDay = (iso: string) => {
      const [y, m, d] = iso.split('-').map(Number);
      return localDateStr(new Date(y, m - 1, d + 1));
    };
    const daysOf = (pred: (b: BehaviorLog) => boolean) => new Set(behaviorLogs.filter(pred).map((b) => nextDay(b.date)));
    const defs: Def[] = [
      {
        id: 'insight-exercise',
        factor: 'exercise',
        title: 'Exercise & Sleep Duration',
        icon: '🏃',
        days: daysOf((b) => b.type === 'exercise'),
        withLabel: 'On Exercise Days',
        withoutLabel: 'On Inactive Days',
        metric: 'duration',
        goodWhenHigher: true,
        explanation: 'Physical activity during the day builds sleep pressure and is linked to longer, deeper sleep and better next-day energy.',
        phrase: 'on days you exercised',
        recommendedExperimentId: 'exp-evening-movement',
      },
      {
        id: 'insight-caffeine',
        factor: 'coffee',
        title: 'Late Caffeine & Sleep Onset',
        icon: '☕',
        days: daysOf(
          (b) =>
            (b.type === 'coffee' && parseInt(b.time.split(':')[0], 10) >= 14) ||
            (b.type === 'habit' && ['late-caffeine', 'energy-drink'].includes(b.habitId || ''))
        ),
        withLabel: 'Caffeine After 2 PM',
        withoutLabel: 'No Caffeine After 2 PM',
        metric: 'latency',
        goodWhenHigher: false,
        explanation: 'Caffeine blocks adenosine, the chemical that builds sleepiness. Taken within about 8 hours of bed, it tends to lengthen the time it takes to fall asleep.',
        phrase: 'on days with caffeine after 2 PM',
        recommendedExperimentId: 'exp-caffeine-curfew',
      },
      {
        id: 'insight-screen',
        factor: 'screen',
        title: 'Pre-bed Screen & Sleep Latency',
        icon: '📱',
        days: daysOf(
          (b) =>
            (b.type === 'screen' && (b.numericValue ?? 1) > 0) ||
            (b.type === 'habit' && ['phone-bed', 'gaming-late'].includes(b.habitId || ''))
        ),
        withLabel: 'Screens Before Bed',
        withoutLabel: 'No Late Screens',
        metric: 'latency',
        goodWhenHigher: false,
        explanation: 'Bright screens and engaging feeds keep the brain alert and can push back the time you fall asleep.',
        phrase: 'after late screen use',
        recommendedExperimentId: 'exp-digital-winddown',
      },
      {
        id: 'insight-stress',
        factor: 'stress',
        title: 'Stress & Mid-Night Awakenings',
        icon: '😰',
        days: daysOf((b) => b.type === 'stress' && (b.intensity === 'high' || b.intensity === 'medium')),
        withLabel: 'Stressful Days',
        withoutLabel: 'Calm Days',
        metric: 'awakenings',
        goodWhenHigher: false,
        explanation: 'Stress hormones keep the body on alert, which makes it easier to wake during lighter stages of sleep.',
        phrase: 'after stressful days',
        recommendedExperimentId: 'exp-box-breathing',
      },
    ];

    const out: SleepFactorInsight[] = [];
    for (const d of defs) {
      const withR = sleepRecords.filter((r) => d.days.has(r.date));
      const withoutR = sleepRecords.filter((r) => !d.days.has(r.date));
      if (withR.length < MIN_NIGHTS || withoutR.length < MIN_NIGHTS) continue;

      const wStats = groupStats(withR, d.withLabel);
      const woStats = groupStats(withoutR, d.withoutLabel);
      let diff: number, delta: string, metricName: string, sentence: string, cardStat: { with: string; without: string };
      if (d.metric === 'duration') {
        diff = Math.round(mean(withR, (r) => r.sleepDurationMinutes) - mean(withoutR, (r) => r.sleepDurationMinutes));
        metricName = 'Total Sleep Time';
        delta = `${diff >= 0 ? '+' : '−'}${Math.abs(diff)} min`;
        sentence = `You slept ${Math.abs(diff)} min ${diff >= 0 ? 'longer' : 'less'} ${d.phrase}.`;
        cardStat = {
          with: `${hhmm(mean(withR, (r) => r.sleepDurationMinutes))} asleep`,
          without: `${hhmm(mean(withoutR, (r) => r.sleepDurationMinutes))} asleep`,
        };
      } else if (d.metric === 'latency') {
        diff = wStats.onsetLatency - woStats.onsetLatency;
        metricName = 'Time to Fall Asleep';
        delta = `${diff >= 0 ? '+' : '−'}${Math.abs(diff)} min onset`;
        sentence = `You took ${Math.abs(diff)} min ${diff >= 0 ? 'longer' : 'less time'} to fall asleep ${d.phrase}.`;
        cardStat = { with: `${wStats.onsetLatency}m to fall asleep`, without: `${woStats.onsetLatency}m to fall asleep` };
      } else {
        const a = mean(withR, (r) => r.nightAwakenings);
        const b = mean(withoutR, (r) => r.nightAwakenings);
        diff = Number((a - b).toFixed(1));
        metricName = 'Night Awakenings';
        delta = `${diff >= 0 ? '+' : '−'}${Math.abs(diff).toFixed(1)} wake-ups`;
        sentence = `You woke ${a.toFixed(1)} times a night ${d.phrase}, vs ${b.toFixed(1)} otherwise.`;
        cardStat = { with: `${a.toFixed(1)} wake-ups`, without: `${b.toFixed(1)} wake-ups` };
      }
      const isPositive = d.goodWhenHigher ? diff >= 0 : diff <= 0;
      // Normalise magnitude so different metrics can be ranked: 30 min ≈ 1 wake-up
      const magnitude = d.metric === 'awakenings' ? Math.abs(diff) * 30 : Math.abs(diff);

      out.push({
        id: d.id,
        factor: d.factor,
        title: d.title,
        icon: d.icon,
        summary: sentence,
        observationCount: withR.length + withoutR.length,
        effect: { metric: metricName, delta, isPositive, explanation: d.explanation },
        comparisonData: { withFactor: wStats, withoutFactor: woStats },
        recommendedExperimentId: d.recommendedExperimentId,
        cardStat,
        magnitude,
      });
    }
    return out.sort((x, y) => (y.magnitude ?? 0) - (x.magnitude ?? 0));
  }, [sleepRecords, behaviorLogs]);

  // Count insight recalculations caused by new/changed data (skip the first render)
  const [insightRefreshCount, setInsightRefreshCount] = useState(0);
  const firstInsightRun = useRef(true);
  useEffect(() => {
    if (firstInsightRun.current) {
      firstInsightRun.current = false;
      return;
    }
    setInsightRefreshCount((n) => n + 1);
  }, [insights]);

  const experimentProgress = useMemo(() => {
    if (!activeExperiment) return null;
    const nights = sleepRecords.filter(
      (r) => r.date > activeExperiment.startDate && r.date <= activeExperiment.endDate
    );
    if (!nights.length) return null;
    const avg = (f: (r: SleepRecord) => number) => nights.reduce((a, r) => a + f(r), 0) / nights.length;
    return {
      onsetLatencyMinutes: Math.round(avg((r) => r.sleepOnsetLatencyMinutes)),
      sleepDurationMinutes: Math.round(avg((r) => r.sleepDurationMinutes)),
      morningEnergy: Number(avg((r) => r.morningEnergy).toFixed(1)),
      sleepQuality: Number(avg((r) => r.quality).toFixed(1)),
      nights: nights.length,
    };
  }, [activeExperiment, sleepRecords]);

  // Calculated scores, with typed-in values applied to the day's most recent record
  const { sleepScores, dailyScores } = useMemo(() => {
    const scores = scoreAll(sleepRecords);
    const daily: Record<string, DailyScore> = {};
    for (const r of sortNewestFirst(sleepRecords)) {
      if (daily[r.date]) continue; // newest record represents the day
      const typed = scoreEntries[r.date];
      if (typed != null) {
        scores[r.id] = { ...scores[r.id], total: typed, band: bandFor(typed), typed: true, calculatedTotal: scores[r.id].total };
      }
      daily[r.date] = {
        date: r.date,
        total: scores[r.id].total,
        band: scores[r.id].band,
        source: typed != null ? 'typed' : 'calculated',
        recordId: r.id,
      };
    }
    // Typed scores for days with no logged night
    for (const [date, total] of Object.entries(scoreEntries)) {
      if (!daily[date]) daily[date] = { date, total, band: bandFor(total), source: 'typed' };
    }
    return { sleepScores: scores, dailyScores: daily };
  }, [sleepRecords, scoreEntries]);
  const latestSleep = useMemo(() => sortNewestFirst(sleepRecords)[0], [sleepRecords]);

  // H1 validation telemetry stats
  const h1Metrics = useMemo(() => {
    // Only timed entries count: check-ins done in the app, quick logs done in the app
    const checkInTimes = sleepRecords
      .map((r) => r.checkInDurationSeconds)
      .filter((n): n is number => typeof n === 'number' && n > 0);
    const avgCheckInSeconds = checkInTimes.length
      ? Math.round(checkInTimes.reduce((a, b) => a + b, 0) / checkInTimes.length)
      : 0;

    const quickLogTimes = behaviorLogs
      .map((b) => b.loggedDurationSeconds)
      .filter((n): n is number => typeof n === 'number' && n > 0);
    const avgQuickLogSeconds = quickLogTimes.length
      ? Number((quickLogTimes.reduce((a, b) => a + b, 0) / quickLogTimes.length).toFixed(1))
      : 0;

    return {
      avgCheckInSeconds,
      avgQuickLogSeconds,
      totalCheckIns: checkInTimes.length,
      totalQuickLogs: quickLogTimes.length,
    };
  }, [sleepRecords, behaviorLogs]);

  // Action implementations
  const addSleepRecord = (record: Omit<SleepRecord, 'id'>) => {
    const newRecord: SleepRecord = {
      ...record,
      id: `sleep-${Date.now()}`,
      recordedAt: new Date().toISOString(),
    };
    setSleepRecords((prev) => [newRecord, ...prev]);
    if (record.checkInDurationSeconds) {
      setLastCheckInDurationSeconds(record.checkInDurationSeconds);
    }
    return newRecord;
  };

  const deleteSleepRecord = (id: string) => {
    setSleepRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const quickLogBehavior = (
    type: BehaviorType,
    title: string,
    detail: string,
    intensity?: 'low' | 'medium' | 'high',
    numericValue?: number,
    loggedDurationSeconds: number = 1.8
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = localDateStr(now);

    const newLog: BehaviorLog = {
      id: `log-${Date.now()}`,
      date: dateStr,
      time: timeStr,
      type,
      title,
      detail,
      intensity,
      numericValue,
      loggedDurationSeconds,
      createdAt: now.toISOString(),
    };

    setBehaviorLogs((prev) => [newLog, ...prev]);
    setLastQuickLogDurationSeconds(loggedDurationSeconds);
    return newLog;
  };

  const logHabit = (habit: HabitDefinition) => {
    const now = new Date();
    const newLog: BehaviorLog = {
      id: `habit-${Date.now()}`,
      date: localDateStr(now),
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      type: 'habit',
      habitId: habit.id,
      habitEmoji: habit.emoji,
      habitEffect: habit.effect,
      title: habit.label,
      detail: habit.effect === 'helps' ? 'Likely helps sleep' : 'Likely hurts sleep',
      createdAt: now.toISOString(),
    };
    setBehaviorLogs((prev) => [newLog, ...prev]);
    return newLog;
  };

  const deleteBehaviorLog = (id: string) => {
    setBehaviorLogs((prev) => prev.filter((b) => b.id !== id));
  };

  const startExperiment = (templateId: string) => {
    const template = experimentTemplates.find((t) => t.id === templateId);
    if (!template) return;

    const today = new Date();
    const startDate = localDateStr(today);
    const end = new Date(today);
    end.setDate(end.getDate() + 7);
    const endDate = localDateStr(end);

    // Compute baseline from the previous 7 days of sleep records
    const recent = sortNewestFirst(sleepRecords)
      .filter((r) => r.date <= startDate) // the morning you start describes the night before: baseline
      .slice(0, 7);
    const avgLatency = recent.length
      ? Math.round(recent.reduce((acc, s) => acc + s.sleepOnsetLatencyMinutes, 0) / recent.length)
      : 31;
    const avgDuration = recent.length
      ? Math.round(recent.reduce((acc, s) => acc + s.sleepDurationMinutes, 0) / recent.length)
      : 400;
    const avgEnergy = recent.length
      ? Number((recent.reduce((acc, s) => acc + s.morningEnergy, 0) / recent.length).toFixed(1))
      : 2.9;
    const avgQuality = recent.length
      ? Number((recent.reduce((acc, s) => acc + s.quality, 0) / recent.length).toFixed(1))
      : 3.0;

    const newActive: ActiveExperiment = {
      id: `exp-${Date.now()}`,
      templateId: template.id,
      title: template.title,
      icon: template.icon,
      category: template.category,
      actionRule: template.actionRule,
      startDate,
      endDate,
      durationDays: 7,
      adherence: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false },
      baselineMetrics: {
        onsetLatencyMinutes: avgLatency,
        sleepDurationMinutes: avgDuration,
        morningEnergy: avgEnergy,
        sleepQuality: avgQuality,
        sampleDays: recent.length,
      },
      status: 'active',
    };

    setActiveExperiment(newActive);
  };

  const toggleAdherenceToday = () => {
    if (!activeExperiment) return;
    const completedDays = Object.values(activeExperiment.adherence).filter(Boolean).length;
    // Next day to toggle
    const currentDay = Math.min(completedDays + 1, 7);
    const currentVal = !!activeExperiment.adherence[currentDay];
    
    setActiveExperiment((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        adherence: {
          ...prev.adherence,
          [currentDay]: !currentVal,
        },
      };
    });
  };

  const setAdherenceForDay = (dayIndex: number, completed: boolean) => {
    if (!activeExperiment) return;
    setActiveExperiment((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        adherence: {
          ...prev.adherence,
          [dayIndex]: completed,
        },
      };
    });
  };

  const concludeExperiment = (decision: 'keep' | 'change') => {
    if (!activeExperiment) return;
    const completedDays = Object.values(activeExperiment.adherence).filter(Boolean).length;
    
    const windowNights = sleepRecords.filter(
      (r) => r.date > activeExperiment.startDate && r.date <= activeExperiment.endDate
    );
    const avg = (f: (r: SleepRecord) => number) =>
      windowNights.reduce((a, r) => a + f(r), 0) / windowNights.length;
    const measuredDuring = windowNights.length
      ? {
          onsetLatencyMinutes: Math.round(avg((r) => r.sleepOnsetLatencyMinutes)),
          sleepDurationMinutes: Math.round(avg((r) => r.sleepDurationMinutes)),
          morningEnergy: Number(avg((r) => r.morningEnergy).toFixed(1)),
          sleepQuality: Number(avg((r) => r.quality).toFixed(1)),
          completedDays,
        }
      : null;
    const during = measuredDuring;
    const base = activeExperiment.baselineMetrics;
    let resultLine = 'No nights were logged during the experiment, so there is nothing to compare yet.';
    if (during) {
      const latencyDelta = base.onsetLatencyMinutes - during.onsetLatencyMinutes;
      const energyDelta = Number((during.morningEnergy - base.morningEnergy).toFixed(1));
      resultLine = `Over ${windowNights.length} nights, time to fall asleep went ${base.onsetLatencyMinutes}m → ${during.onsetLatencyMinutes}m (${
        latencyDelta >= 0 ? `−${latencyDelta}` : `+${-latencyDelta}`
      } min); morning energy ${base.morningEnergy} → ${during.morningEnergy}/5 (${energyDelta >= 0 ? '+' : ''}${energyDelta}).`;
    }

    const completed: ActiveExperiment = {
      ...activeExperiment,
      status: 'completed',
      completedDate: localDateStr(new Date()),
      decision,
      duringMetrics: during ?? undefined,
      learnedTakeaway:
        decision === 'keep'
          ? `Adhered ${completedDays}/7 days. ${resultLine} Habit retained.`
          : `Completed ${completedDays}/7 days. ${resultLine} Trying a different factor next.`,
    };

    setCompletedExperiments((prev) => [completed, ...prev]);
    setActiveExperiment(null);
  };

  const cancelActiveExperiment = () => {
    setActiveExperiment(null);
  };

  const resetToDemoData = () => {
    setSleepRecords(initialSleepRecords);
    setBehaviorLogs(initialBehaviorLogs);
    setActiveExperiment(initialActiveExperiment);
    setCompletedExperiments([]);
    safeRemove(STORAGE_KEY_SLEEP);
    safeRemove(STORAGE_KEY_BEHAVIORS);
    safeRemove(STORAGE_KEY_EXP_ACTIVE);
    safeRemove(STORAGE_KEY_EXP_COMPLETED);
    setScoreEntries({});
  };

  const loadTestData: SleepContextType['loadTestData'] = (data, mode) => {
    const stamp = Date.now();
    const nights: SleepRecord[] = data.sleepRecords.map((r, i) => ({
      ...r,
      id: r.id || `up-sleep-${stamp}-${i}`,
      recordedAt: r.recordedAt || new Date(stamp + i).toISOString(),
    }));
    const logs: BehaviorLog[] = (data.behaviorLogs || []).map((b, i) => ({
      ...b,
      id: b.id || `up-log-${stamp}-${i}`,
      createdAt: b.createdAt || `${b.date}T${b.time}:00`,
    }));
    if (mode === 'replace') {
      setSleepRecords(nights);
      setBehaviorLogs(logs);
      // Experiments and typed scores belong to the old data, so they are replaced too
      setActiveExperiment(data.activeExperiment ?? null);
      setCompletedExperiments(data.completedExperiments ?? []);
      setScoreEntries(data.scoreEntries ?? {});
    } else {
      // A night on a date that already exists replaces that record
      const dates = new Set(nights.map((n) => n.date));
      setSleepRecords((prev) => [...nights, ...prev.filter((r) => !dates.has(r.date))]);
      if (logs.length) setBehaviorLogs((prev) => [...logs, ...prev]);
      if (data.scoreEntries) setScoreEntries((prev) => ({ ...prev, ...data.scoreEntries }));
      if (data.activeExperiment !== undefined && data.activeExperiment) setActiveExperiment(data.activeExperiment);
      if (data.completedExperiments?.length) setCompletedExperiments((prev) => [...data.completedExperiments!, ...prev]);
    }
    if (data.habits?.length) {
      // Add any habits the data uses as tiles
      setHabits((prev) => {
        const ids = new Set(prev.map((h) => h.id));
        return [...prev, ...data.habits!.filter((h) => !ids.has(h.id))];
      });
    }
  };

  const importData = (data: unknown): { ok: boolean; message: string } => {
    if (!data || typeof data !== 'object') {
      return { ok: false, message: 'File is not a valid sleeplab export.' };
    }
    const d = data as Record<string, unknown>;
    if (!Array.isArray(d.sleepRecords) || !Array.isArray(d.behaviorLogs)) {
      return { ok: false, message: 'Missing sleepRecords or behaviorLogs in file.' };
    }
    setSleepRecords(d.sleepRecords as SleepRecord[]);
    setBehaviorLogs(d.behaviorLogs as BehaviorLog[]);
    if ('activeExperiment' in d) {
      setActiveExperiment((d.activeExperiment as ActiveExperiment | null) ?? null);
    }
    if (d.scoreEntries && typeof d.scoreEntries === 'object') {
      setScoreEntries(d.scoreEntries as Record<string, number>);
    }
    if (Array.isArray(d.habits)) {
      setHabits(d.habits as HabitDefinition[]);
    }
    if (Array.isArray(d.completedExperiments)) {
      setCompletedExperiments(d.completedExperiments as ActiveExperiment[]);
    }
    return {
      ok: true,
      message: `Imported ${d.sleepRecords.length} sleep records and ${d.behaviorLogs.length} behaviour logs.`,
    };
  };

  return (
    <SleepContext.Provider
      value={{
        sleepRecords,
        behaviorLogs,
        activeExperiment,
        completedExperiments,
        experimentTemplates,
        insights,
        selectedInsight,
        setSelectedInsight,
        addSleepRecord,
        deleteSleepRecord,
        quickLogBehavior,
        deleteBehaviorLog,
        startExperiment,
        toggleAdherenceToday,
        setAdherenceForDay,
        concludeExperiment,
        cancelActiveExperiment,
        resetToDemoData,
        importData,
        sleepScores,
        latestSleep,
        pairedWearable,
        setPairedWearable,
        loadTestData,
        insightRefreshCount,
        experimentProgress,
        scoreEntries,
        setScoreEntry,
        dailyScores,
        habits,
        addHabit,
        removeHabit,
        logHabit,
        lastCheckInDurationSeconds,
        lastQuickLogDurationSeconds,
        h1Metrics,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </SleepContext.Provider>
  );
};

export const useSleep = () => {
  const context = useContext(SleepContext);
  if (!context) {
    throw new Error('useSleep must be used within a SleepProvider');
  }
  return context;
};
