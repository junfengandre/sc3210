export type SleepQualityRating = 1 | 2 | 3 | 4 | 5;
export type EnergyRating = 1 | 2 | 3 | 4 | 5;

// Optional data imported from a wearable (Apple Watch, Oura, Fitbit, Garmin...)
export interface WearableData {
  source?: string;
  deepMinutes?: number;
  remMinutes?: number;
  lightMinutes?: number;
  awakeMinutes?: number; // wake after sleep onset (WASO)
  restingHeartRate?: number; // bpm — shown, not scored (personal baseline varies)
  hrvMs?: number; // ms — shown, not scored
  spo2Avg?: number; // %
}

export interface SleepRecord {
  id: string;
  date: string; // YYYY-MM-DD
  bedTime: string; // HH:MM
  wakeTime: string; // HH:MM
  sleepDurationMinutes: number; // calculated minutes asleep
  sleepOnsetLatencyMinutes: number; // minutes to fall asleep
  nightAwakenings: number; // count
  quality: SleepQualityRating; // 1-5
  morningEnergy: EnergyRating; // 1-5
  notes?: string;
  recordedAt?: string;
  checkInDurationSeconds?: number; // for H1 validation (e.g. 18 seconds)
  wearable?: WearableData;
}

export type BehaviorType = 'coffee' | 'exercise' | 'nap' | 'stress' | 'alcohol' | 'screen';

export type HabitEffect = 'helps' | 'hurts';
export type HabitGroup = 'general' | 'student' | 'professional' | 'family' | 'custom';

/** A habit the user tracks with a one-tap tile */
export interface HabitDefinition {
  id: string;
  label: string;
  emoji: string;
  effect: HabitEffect;
  group: HabitGroup;
  why?: string;
}

export interface BehaviorLog {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: BehaviorType | 'habit';
  habitId?: string;
  habitEmoji?: string;
  habitEffect?: HabitEffect;
  title: string;
  detail: string;
  intensity?: 'low' | 'medium' | 'high';
  numericValue?: number; // e.g. minutes of exercise, cups of coffee, mins of screen
  loggedDurationSeconds?: number; // for H1 logging speed test (< 3 sec)
  createdAt: string;
}

export type ExperimentCategory = 'caffeine' | 'movement' | 'digital' | 'circadian' | 'relaxation';

export interface ExperimentTemplate {
  id: string;
  title: string;
  icon: string;
  category: ExperimentCategory;
  tagline: string;
  hypothesis: string;
  actionRule: string;
  durationDays: number;
  whyItWorks: string;
  targetBehavior: BehaviorType;
}

export interface ActiveExperiment {
  id: string;
  templateId: string;
  title: string;
  icon: string;
  category: ExperimentCategory;
  actionRule: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationDays: number; // 7
  adherence: Record<number, boolean>; // dayIndex 1..7 -> completed boolean
  baselineMetrics: {
    onsetLatencyMinutes: number;
    sleepDurationMinutes: number;
    morningEnergy: number;
    sleepQuality: number;
    sampleDays: number;
  };
  duringMetrics?: {
    onsetLatencyMinutes: number;
    sleepDurationMinutes: number;
    morningEnergy: number;
    sleepQuality: number;
    completedDays: number;
  };
  status: 'active' | 'completed' | 'abandoned';
  completedDate?: string;
  decision?: 'keep' | 'change' | 'undecided';
  learnedTakeaway?: string;
}

export interface SleepFactorInsight {
  id: string;
  factor: BehaviorType;
  title: string;
  icon: string;
  summary: string;
  observationCount: number;
  effect: {
    metric: string;
    delta: string;
    isPositive: boolean;
    explanation: string;
  };
  comparisonData: {
    withFactor: {
      label: string;
      onsetLatency: number;
      durationHours: number;
      quality: number;
      energy: number;
      count: number;
    };
    withoutFactor: {
      label: string;
      onsetLatency: number;
      durationHours: number;
      quality: number;
      energy: number;
      count: number;
    };
  };
  recommendedExperimentId?: string;
  /** Headline stat shown on the card for each group, matching the insight's metric */
  cardStat?: { with: string; without: string };
  /** Size of the difference, used to rank insights */
  magnitude?: number;
}

