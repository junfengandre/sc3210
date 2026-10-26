import { SleepRecord, BehaviorLog, ActiveExperiment, ExperimentTemplate } from '../types/sleep';

// The app starts empty: data comes from live check-ins / quick logs, or an upload in the Test Data Lab.
export const initialSleepRecords: SleepRecord[] = [];
export const initialBehaviorLogs: BehaviorLog[] = [];
export const initialActiveExperiment: ActiveExperiment | null = null;

export const experimentTemplates: ExperimentTemplate[] = [
  {
    id: 'exp-caffeine-curfew',
    title: 'No caffeine after 2 PM',
    icon: '☕',
    category: 'caffeine',
    tagline: 'Clear caffeine half-life before bedtime',
    hypothesis: 'Caffeine has a 5–7 hour half-life. Cutting it after 2 PM allows adenosine receptors to clear naturally before midnight.',
    actionRule: 'Zero coffee, green/black tea, or energy drinks after 14:00. Decaf or herbal tea only.',
    durationDays: 7,
    whyItWorks: 'Adenosine builds sleep pressure through the day. Late caffeine blocks these receptors, delaying sleep onset and fragmenting deep slow-wave sleep even if you fall asleep.',
    targetBehavior: 'coffee',
  },
  {
    id: 'exp-evening-movement',
    title: '20 min Afternoon Movement',
    icon: '🏃',
    category: 'movement',
    tagline: 'Deepen slow-wave sleep through physical exertion',
    hypothesis: 'Engaging in 20+ minutes of moderate cardio or resistance training between 4 PM and 7 PM will increase sleep duration and morning energy.',
    actionRule: 'At least 20 minutes of brisk walking, jogging, cycling, or gym workout before 19:30.',
    durationDays: 7,
    whyItWorks: 'Physical exertion elevates core body temperature; its subsequent drop 3–4 hours later triggers natural melatonin release and deep sleep induction.',
    targetBehavior: 'exercise',
  },
  {
    id: 'exp-digital-winddown',
    title: 'Phone outside bedroom 30m before sleep',
    icon: '📱',
    category: 'digital',
    tagline: 'Eliminate doomscrolling arousal & blue light',
    hypothesis: 'Charging your phone across the room 30 minutes before lights-out will reduce pre-sleep cognitive stimulation and shorten sleep onset latency.',
    actionRule: 'Place phone on charger away from bed 30 minutes before intended bedtime. Read physical book or stretch.',
    durationDays: 7,
    whyItWorks: 'Social feeds trigger intermittent dopamine spikes, keeping the prefrontal cortex in high-vigilance mode and suppressing melatonin.',
    targetBehavior: 'screen',
  },
  {
    id: 'exp-consistent-wake',
    title: 'Consistent wake-up time ±30 min',
    icon: '⏰',
    category: 'circadian',
    tagline: 'Lock in your circadian pacemaker',
    hypothesis: 'Waking within 30 minutes of the same time every day—even weekends—will eliminate social jetlag and morning grogginess.',
    actionRule: 'Set alarm for within a 30-minute window every day (e.g., 07:30–08:00) without sleeping in.',
    durationDays: 7,
    whyItWorks: 'The suprachiasmatic nucleus (master clock) aligns hormone release (cortisol/melatonin) with morning light exposure at a fixed anchor time.',
    targetBehavior: 'nap',
  },
  {
    id: 'exp-morning-sunlight',
    title: '10 min Morning Sunlight',
    icon: '☀️',
    category: 'circadian',
    tagline: 'Anchor the circadian phase response curve',
    hypothesis: 'Getting 10 minutes of direct outdoor natural light within 45 minutes of waking will make falling asleep at night easier.',
    actionRule: 'Step outdoors or stand by open window for 10 minutes without sunglasses right after getting dressed.',
    durationDays: 7,
    whyItWorks: 'Bright photons hitting melanopsin-containing retinal ganglion cells trigger the internal circadian timer to set the timer for evening melatonin secretion ~14 hours later.',
    targetBehavior: 'exercise',
  },
  {
    id: 'exp-box-breathing',
    title: '5 min 4-7-8 Wind-down Breathing',
    icon: '🧘',
    category: 'relaxation',
    tagline: 'Vagal nerve down-regulation in bed',
    hypothesis: 'Practicing 4-7-8 breathing (inhale 4s, hold 7s, exhale 8s) when getting into bed will lower resting heart rate and alleviate pre-sleep racing thoughts.',
    actionRule: 'Do 4 cycles of 4-7-8 breath as soon as lights are turned off.',
    durationDays: 7,
    whyItWorks: 'Prolonged exhales activate the parasympathetic branch of the autonomic nervous system via the vagus nerve, reducing somatic hyperarousal.',
    targetBehavior: 'stress',
  }
];

