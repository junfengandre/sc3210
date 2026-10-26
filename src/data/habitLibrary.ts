import { BehaviorLog, HabitDefinition, HabitEffect, HabitGroup } from '../types/sleep';

/**
 * Suggested habits, each marked as more likely to help or hurt sleep quality.
 * Grouped by who they matter most for. Users can add any of these as one-tap tiles,
 * or create their own.
 */
export const HABIT_LIBRARY: HabitDefinition[] = [
  // --- General: likely to help ---
  { id: 'sunlight', emoji: '☀️', label: 'Morning sunlight', effect: 'helps', group: 'general', why: '10+ minutes of daylight soon after waking anchors your body clock.' },
  { id: 'early-exercise', emoji: '🏃', label: 'Exercise before 6 PM', effect: 'helps', group: 'general', why: 'Daytime activity builds sleep pressure without leaving you wired at bedtime.' },
  { id: 'same-wake', emoji: '⏰', label: 'Same wake time', effect: 'helps', group: 'general', why: 'Waking within ±30 min of yesterday keeps your rhythm steady.' },
  { id: 'screens-off', emoji: '📵', label: 'Screens off 1h before bed', effect: 'helps', group: 'general', why: 'Less light and stimulation in the last hour makes it easier to fall asleep.' },
  { id: 'caffeine-cutoff', emoji: '🕑', label: 'No caffeine after 2 PM', effect: 'helps', group: 'general', why: 'Caffeine lingers for 5–6 hours; an early cut-off protects sleep onset.' },
  { id: 'wind-down', emoji: '🛁', label: 'Wind-down routine', effect: 'helps', group: 'general', why: 'A consistent shower, stretch or reading routine signals the day is over.' },
  { id: 'cool-room', emoji: '❄️', label: 'Cool, dark bedroom', effect: 'helps', group: 'general', why: 'A cooler, darker room supports deeper, less broken sleep.' },
  { id: 'worry-list', emoji: '📝', label: 'Worry list / journaling', effect: 'helps', group: 'general', why: 'Writing down tomorrow’s to-dos reduces racing thoughts in bed.' },

  // --- General: likely to hurt ---
  { id: 'late-caffeine', emoji: '🥤', label: 'Caffeine after 2 PM', effect: 'hurts', group: 'general', why: 'Late caffeine is one of the most common causes of slow sleep onset.' },
  { id: 'late-alcohol', emoji: '🍷', label: 'Alcohol within 3h of bed', effect: 'hurts', group: 'general', why: 'Alcohol may make you drowsy but fragments the second half of the night.' },
  { id: 'phone-bed', emoji: '📱', label: 'Phone in bed', effect: 'hurts', group: 'general', why: 'Scrolling in bed delays sleep and links the bed with wakefulness.' },
  { id: 'late-meal', emoji: '🍔', label: 'Heavy meal within 2h of bed', effect: 'hurts', group: 'general', why: 'Digestion and reflux can keep you awake or wake you up.' },
  { id: 'late-workout', emoji: '🏋️', label: 'Intense workout within 2h of bed', effect: 'hurts', group: 'general', why: 'Raised heart rate and body temperature can delay sleep.' },
  { id: 'long-nap', emoji: '💤', label: 'Nap over 30 min or after 3 PM', effect: 'hurts', group: 'general', why: 'Long or late naps reduce sleep pressure at night.' },
  { id: 'late-work', emoji: '📚', label: 'Work or study past midnight', effect: 'hurts', group: 'general', why: 'Mental effort right before bed keeps your brain switched on.' },

  // --- Students ---
  { id: 'all-nighter', emoji: '🌙', label: 'All-nighter', effect: 'hurts', group: 'student', why: 'Skipping a night disrupts sleep for several nights after.' },
  { id: 'energy-drink', emoji: '⚡', label: 'Energy drink', effect: 'hurts', group: 'student', why: 'High caffeine plus sugar; often drunk late in the day.' },
  { id: 'group-call', emoji: '💬', label: 'Group-project call after 10 PM', effect: 'hurts', group: 'student', why: 'Late calls push bedtime back and leave you mentally alert.' },
  { id: 'gaming-late', emoji: '🎮', label: 'Gaming past midnight', effect: 'hurts', group: 'student', why: 'Bright screens and excitement delay sleep.' },
  { id: 'weekend-lie-in', emoji: '🛌', label: 'Weekend lie-in over 2h', effect: 'hurts', group: 'student', why: 'Sleeping in shifts your body clock (“social jet lag”), making Monday harder.' },
  { id: 'study-cutoff', emoji: '🎒', label: 'Stopped studying by 11 PM', effect: 'helps', group: 'student', why: 'A fixed cut-off gives your mind time to settle.' },

  // --- Young professionals ---
  { id: 'after-hours-msgs', emoji: '📧', label: 'Work email/Slack after 9 PM', effect: 'hurts', group: 'professional', why: 'Work messages late at night raise stress and alertness.' },
  { id: 'overtime', emoji: '💼', label: 'Worked past 9 PM', effect: 'hurts', group: 'professional', why: 'Long days compress wind-down time.' },
  { id: 'after-work-drinks', emoji: '🍻', label: 'After-work drinks', effect: 'hurts', group: 'professional', why: 'Evening alcohol fragments sleep.' },
  { id: 'travel', emoji: '✈️', label: 'Travel or time-zone change', effect: 'hurts', group: 'professional', why: 'Shifts in schedule and time zone throw off your body clock.' },
  { id: 'lunch-walk', emoji: '🚶', label: 'Lunchtime walk outside', effect: 'helps', group: 'professional', why: 'Daylight and movement mid-day support night-time sleep.' },
  { id: 'shutdown', emoji: '✅', label: 'Work shutdown ritual', effect: 'helps', group: 'professional', why: 'Closing loops at the end of the workday reduces bedtime rumination.' },

  // --- Family & caregivers ---
  { id: 'night-wake-family', emoji: '👶', label: 'Woken by a child or family member', effect: 'hurts', group: 'family', why: 'Night-time wake-ups break up sleep cycles.' },
  { id: 'late-caregiving', emoji: '🤲', label: 'Late-night caregiving', effect: 'hurts', group: 'family', why: 'Caring for someone late at night cuts into sleep and adds stress.' },
  { id: 'shared-night-duty', emoji: '🔁', label: 'Shared night duty', effect: 'helps', group: 'family', why: 'Taking turns protects at least some nights of unbroken sleep.' },
  { id: 'early-family-dinner', emoji: '🍽️', label: 'Family dinner before 7 PM', effect: 'helps', group: 'family', why: 'An earlier meal leaves time to digest before bed.' },
  { id: 'kids-bedtime', emoji: '📖', label: 'Kids’ bedtime routine on time', effect: 'helps', group: 'family', why: 'A predictable household evening makes your own bedtime more regular.' },
  { id: 'me-time', emoji: '🧘', label: '15 min to yourself before bed', effect: 'helps', group: 'family', why: 'A short buffer between caring for others and sleep helps you unwind.' },
];

export const DEFAULT_HABIT_IDS = ['sunlight', 'screens-off', 'phone-bed'];

export const HABIT_GROUP_LABELS: Record<HabitGroup, string> = {
  general: 'Everyone',
  student: 'Students',
  professional: 'Young professionals',
  family: 'Family & caregivers',
  custom: 'Your own',
};

/**
 * Whether a log is likely to help or hurt sleep. Built-in behaviours get a
 * sensible default (late coffee hurts, exercise helps); naps and morning coffee are neutral.
 */
export const logEffect = (log: BehaviorLog): HabitEffect | null => {
  if (log.type === 'habit') return log.habitEffect ?? null;
  if (log.type === 'exercise') return 'helps';
  if (log.type === 'alcohol' || log.type === 'screen' || log.type === 'stress') return 'hurts';
  if (log.type === 'coffee') return parseInt(log.time.split(':')[0], 10) >= 14 ? 'hurts' : null;
  return null;
};

export const BUILTIN_EMOJI: Record<string, string> = {
  coffee: '☕',
  exercise: '🏃',
  nap: '😴',
  stress: '😰',
  alcohol: '🍺',
  screen: '📱',
};

export const logEmoji = (log: BehaviorLog) => log.habitEmoji || BUILTIN_EMOJI[log.type] || '•';
