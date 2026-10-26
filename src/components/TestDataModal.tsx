import React, { useMemo, useState } from 'react';
import { X, FlaskConical, Watch, Check, FileSpreadsheet, ListPlus, Upload, Trash2, CalendarClock } from 'lucide-react';
import { useSleep } from '../context/SleepContext';
import { SleepRecord, WearableData } from '../types/sleep';
import { computeSleepScore, simulateWearable, timeInBedMinutes, WEARABLE_SOURCES } from '../lib/sleepScore';
import {
  makeNight,
  parseSleepCsv,
  parseBehaviourCsv,
  parseDatasetJson,
  csvKind,
  csvExample,
  CSV_HEADER,
  BEHAVIOUR_CSV_HEADER,
  localDateStr,
  Dataset,
  daysToShift,
  shiftDataset,
  dateRange,
} from '../data/testData';
import { ScoreBreakdown, ScoreRing, ScoreBadge } from './ScoreBreakdown';
import sampleDataset from '../data/sampleDataset.json';

const SAMPLE_NAME = 'Built-in sample · student + 7-day caffeine experiment';

interface TestDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoaded?: (message: string) => void;
}

type Tab = 'upload' | 'csv' | 'night';

interface Source {
  name: string;
  text: string;
}

/** Turn uploaded files / pasted text into one dataset */
function buildDataset(sources: Source[]) {
  const data: Dataset = { sleepRecords: [], behaviorLogs: [], habits: [] };
  const errors: string[] = [];
  const kinds: string[] = [];
  let hasJson = false;
  for (const src of sources) {
    const t = src.text.trim();
    if (!t) continue;
    if (t.startsWith('{')) {
      const { data: d, error } = parseDatasetJson(t);
      if (!d) {
        errors.push(`${src.name}: ${error}`);
        continue;
      }
      hasJson = true;
      kinds.push(`${src.name} (full dataset)`);
      data.sleepRecords.push(...d.sleepRecords);
      data.behaviorLogs.push(...d.behaviorLogs);
      data.habits!.push(...(d.habits ?? []));
      if (d.scoreEntries) data.scoreEntries = { ...data.scoreEntries, ...d.scoreEntries };
      if (d.activeExperiment !== undefined) data.activeExperiment = d.activeExperiment;
      if (d.completedExperiments) data.completedExperiments = d.completedExperiments;
      continue;
    }
    const kind = csvKind(t);
    if (kind === 'nights') {
      const r = parseSleepCsv(t);
      errors.push(...r.errors.map((e) => `${src.name}: ${e}`));
      data.sleepRecords.push(...r.nights);
      kinds.push(`${src.name} (nights)`);
    } else if (kind === 'behaviours') {
      const r = parseBehaviourCsv(t);
      errors.push(...r.errors.map((e) => `${src.name}: ${e}`));
      data.behaviorLogs.push(...r.logs);
      data.habits!.push(...r.habits);
      kinds.push(`${src.name} (behaviours)`);
    } else {
      errors.push(`${src.name}: couldn't tell what this is. Use a nights CSV (has a bedtime column), a behaviours CSV (has type and time columns) or a sleeplab JSON file.`);
    }
  }
  return { data, errors, hasJson, kinds };
}

export const TestDataModal: React.FC<TestDataModalProps> = ({ isOpen, onClose, onLoaded }) => {
  const { theme, sleepRecords, loadTestData, pairedWearable } = useSleep();
  const isDark = theme === 'dark';
  const [tab, setTab] = useState<Tab>('upload');
  const [files, setFiles] = useState<Source[]>([]);
  const [shiftOn, setShiftOn] = useState(true);
  const [mode, setMode] = useState<'append' | 'replace'>('append');

  // --- One night form ---
  const [date, setDate] = useState(localDateStr(new Date()));
  const [bedTime, setBedTime] = useState('23:45');
  const [wakeTime, setWakeTime] = useState('07:30');
  const [latency, setLatency] = useState(20);
  const [wakeUps, setWakeUps] = useState(1);
  const [quality, setQuality] = useState(4);
  const [energy, setEnergy] = useState(3);
  const [notes, setNotes] = useState('');
  const [useWearable, setUseWearable] = useState(!!pairedWearable);
  const [wearable, setWearable] = useState<WearableData>(() =>
    simulateWearable(pairedWearable || 'Apple Watch', 445, 4, 1)
  );

  // --- CSV ---
  const [csvText, setCsvText] = useState('');
  const sources: Source[] = tab === 'upload' ? files : tab === 'csv' && csvText.trim() ? [{ name: 'Pasted CSV', text: csvText }] : [];
  const built = useMemo(() => buildDataset(sources), [tab, files, csvText]); // eslint-disable-line react-hooks/exhaustive-deps
  const shiftDays = useMemo(() => (shiftOn ? daysToShift(built.data) : 0), [built, shiftOn]);
  const ready = useMemo(() => shiftDataset(built.data, shiftDays), [built, shiftDays]);
  const readyScores = useMemo(() => {
    const recs = ready.sleepRecords.map((n, i) => ({ ...n, id: `p${i}` }));
    return recs.map((r) => computeSleepScore(r, recs).total);
  }, [ready]);
  const effectiveMode: 'append' | 'replace' = built.hasJson ? 'replace' : mode;

  // If the data includes an experiment, summarise its effect: score before vs during
  const expSummary = useMemo(() => {
    const exp = ready.activeExperiment ?? ready.completedExperiments?.[0];
    if (!exp) return null;
    const scored = ready.sleepRecords.map((r, i) => ({ date: r.date, score: readyScores[i] }));
    const before = scored.filter((r) => r.date <= exp.startDate).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-7);
    const during = scored.filter((r) => r.date > exp.startDate && r.date <= exp.endDate);
    if (!before.length || !during.length) return null;
    const mean = (xs: { score: number }[]) => Math.round(xs.reduce((a, x) => a + x.score, 0) / xs.length);
    return {
      exp,
      before: mean(before),
      during: mean(during),
      kept: Object.values(exp.adherence).filter(Boolean).length,
      nights: during.length,
    };
  }, [ready, readyScores]);

  const readFiles = async (list: FileList | null) => {
    if (!list) return;
    const read = await Promise.all(Array.from(list).map(async (f) => ({ name: f.name, text: await f.text() })));
    setFiles((prev) => [...prev.filter((p) => !read.some((r) => r.name === p.name)), ...read]);
  };

  const loadReady = () => {
    loadTestData(
      {
        sleepRecords: ready.sleepRecords,
        behaviorLogs: ready.behaviorLogs,
        habits: ready.habits,
        scoreEntries: ready.scoreEntries,
        activeExperiment: ready.activeExperiment,
        completedExperiments: ready.completedExperiments,
      },
      effectiveMode
    );
    setFiles([]);
    setCsvText('');
    const base = `Loaded ${ready.sleepRecords.length} nights and ${ready.behaviorLogs.length} behaviour logs`;
    finish(
      expSummary
        ? `${base}. ${expSummary.exp.icon} "${expSummary.exp.title}" kept ${expSummary.kept}/7 days: sleep score ${expSummary.before} → ${expSummary.during}. See it on Insights.`
        : base
    );
  };

  const draft: SleepRecord = useMemo(() => {
    const n = makeNight(date, bedTime, wakeTime, latency, wakeUps, quality, energy, notes.trim() || undefined);
    return { ...n, id: 'draft', wearable: useWearable ? wearable : undefined };
  }, [date, bedTime, wakeTime, latency, wakeUps, quality, energy, notes, useWearable, wearable]);
  const draftScore = useMemo(() => computeSleepScore(draft, sleepRecords), [draft, sleepRecords]);

  if (!isOpen) return null;

  const input = `w-full rounded-lg border px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors ${
    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-900 focus:bg-white'
  }`;
  const label = `block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';

  const setW = (k: keyof WearableData, v: string) =>
    setWearable((prev) => ({ ...prev, [k]: v === '' ? undefined : k === 'source' ? v : Number(v) }));

  const finish = (message: string) => {
    onLoaded?.(message);
    onClose();
  };

  const addNight = () => {
    const { id, ...night } = draft;
    loadTestData({ sleepRecords: [night] }, 'append');
    finish(`Added ${date} · score ${draftScore.total}`);
  };

  const ratingButtons = (value: number, set: (n: number) => void, name: string) => (
    <div className="flex gap-1" role="group" aria-label={name}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => set(n)}
          aria-pressed={value === n}
          className={`h-8 flex-1 rounded-md text-xs font-bold transition-colors ${
            value === n
              ? 'bg-indigo-600 text-white'
              : isDark
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );

  const modeToggle = (
    <div className={`flex rounded-lg p-0.5 text-[11px] font-semibold ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
      {(['append', 'replace'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className={`rounded-md px-2.5 py-1 transition-colors ${
            mode === m
              ? isDark
                ? 'bg-slate-950 text-white'
                : 'bg-white text-slate-900 shadow-xs'
              : muted
          }`}
        >
          {m === 'append' ? 'Add to my data' : 'Replace all data'}
        </button>
      ))}
    </div>
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'upload', label: 'Upload file', icon: <Upload className="h-3.5 w-3.5" /> },
    { id: 'csv', label: 'Paste CSV', icon: <FileSpreadsheet className="h-3.5 w-3.5" /> },
    { id: 'night', label: 'One night', icon: <ListPlus className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Test data lab"
        className={`flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl sm:rounded-2xl border shadow-2xl ${
          isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-start justify-between gap-3 border-b px-5 pt-5 pb-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className={`h-4 w-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <h2 className="text-lg font-bold">Test Data Lab</h2>
            </div>
            <p className={`mt-0.5 text-xs ${muted}`}>
              Upload or enter data to demo every feature: scores, trends, insights, habits and experiments.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3">
          <div className={`flex gap-1 rounded-xl p-1 ${isDark ? 'bg-slate-950/70' : 'bg-slate-100'}`}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                  tab === t.id
                    ? isDark
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-slate-900 shadow-xs'
                    : muted
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'night' && (
            <div className="grid gap-5 md:grid-cols-[1fr_15rem]">
              {/* Form */}
              <div className="min-w-0 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="td-date" className={label}>Morning of</label>
                    <input id="td-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
                  </div>
                  <div>
                    <label htmlFor="td-bed" className={label}>Bedtime</label>
                    <input id="td-bed" type="time" value={bedTime} onChange={(e) => setBedTime(e.target.value)} className={input} />
                  </div>
                  <div>
                    <label htmlFor="td-wake" className={label}>Wake time</label>
                    <input id="td-wake" type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className={input} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="td-lat" className={label}>
                      Minutes to fall asleep <span className="font-mono text-indigo-500">{latency}</span>
                    </label>
                    <input id="td-lat" type="range" min={0} max={120} step={5} value={latency} onChange={(e) => setLatency(Number(e.target.value))} className="w-full accent-indigo-600" />
                  </div>
                  <div>
                    <label htmlFor="td-wu" className={label}>
                      Wake-ups <span className="font-mono text-indigo-500">{wakeUps}</span>
                    </label>
                    <input id="td-wu" type="range" min={0} max={8} value={wakeUps} onChange={(e) => setWakeUps(Number(e.target.value))} className="w-full accent-indigo-600" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className={label}>Sleep quality</span>
                    {ratingButtons(quality, setQuality, 'Sleep quality')}
                  </div>
                  <div>
                    <span className={label}>Morning energy</span>
                    {ratingButtons(energy, setEnergy, 'Morning energy')}
                  </div>
                </div>

                <div className={`text-[11px] ${muted}`}>
                  Time in bed {Math.floor(timeInBedMinutes(bedTime, wakeTime) / 60)}h {timeInBedMinutes(bedTime, wakeTime) % 60}m · asleep{' '}
                  {Math.floor(draft.sleepDurationMinutes / 60)}h {draft.sleepDurationMinutes % 60}m
                </div>

                {/* Wearable */}
                <div className={`rounded-xl border p-3 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/70'}`}>
                  <label className="flex cursor-pointer items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs font-semibold">
                      <Watch className="h-4 w-4 text-violet-500" />
                      Add wearable data
                    </span>
                    <input
                      id="td-use-wearable"
                      type="checkbox"
                      checked={useWearable}
                      onChange={(e) => setUseWearable(e.target.checked)}
                      className="h-4 w-4 accent-violet-600"
                    />
                  </label>
                  {useWearable && (
                    <div className="mt-3 space-y-3">
                      <div className="flex gap-2">
                        <select
                          id="td-source"
                          value={wearable.source || ''}
                          onChange={(e) => setW('source', e.target.value)}
                          className={`${input} font-sans`}
                          aria-label="Device"
                        >
                          {WEARABLE_SOURCES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setWearable(simulateWearable(wearable.source || 'Apple Watch', draft.sleepDurationMinutes, quality, wakeUps))
                          }
                          className={`shrink-0 rounded-lg border px-3 text-[11px] font-semibold ${
                            isDark ? 'border-violet-800/60 text-violet-300 hover:bg-violet-950/40' : 'border-violet-200 text-violet-700 hover:bg-violet-50'
                          }`}
                        >
                          Simulate sync
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            ['deepMinutes', 'Deep (min)'],
                            ['remMinutes', 'REM (min)'],
                            ['lightMinutes', 'Light (min)'],
                            ['awakeMinutes', 'Awake (min)'],
                            ['spo2Avg', 'SpO₂ (%)'],
                            ['restingHeartRate', 'Rest HR'],
                            ['hrvMs', 'HRV (ms)'],
                          ] as [keyof WearableData, string][]
                        ).map(([k, l]) => (
                          <div key={k}>
                            <label htmlFor={`td-w-${k}`} className={label}>{l}</label>
                            <input
                              id={`td-w-${k}`}
                              type="number"
                              inputMode="numeric"
                              value={(wearable[k] as number | undefined) ?? ''}
                              onChange={(e) => setW(k, e.target.value)}
                              className={input}
                            />
                          </div>
                        ))}
                      </div>
                      <p className={`text-[10px] ${muted}`}>Resting HR and HRV are shown for context but not scored, since healthy ranges differ a lot between people.</p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="td-notes" className={label}>Notes (optional)</label>
                  <input id="td-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className={`${input} font-sans`} placeholder="e.g. Late coffee at 4 PM" />
                </div>
              </div>

              {/* Live score preview */}
              <div className={`h-fit rounded-xl border p-4 md:sticky md:top-0 ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                <div className={`text-[11px] font-semibold uppercase tracking-wider ${muted}`}>Live score preview</div>
                <div className="mt-3 flex items-center gap-3">
                  <ScoreRing score={draftScore} isDark={isDark} size={76} />
                  <div className="min-w-0">
                    <ScoreBadge score={draftScore} isDark={isDark} />
                    <span className="ml-1.5 text-xs font-semibold">{draftScore.band}</span>
                    {draftScore.biggestLoss && (
                      <p className={`mt-1 text-[11px] leading-snug ${muted}`}>
                        Biggest drag: {draftScore.biggestLoss.label.toLowerCase()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <ScoreBreakdown score={draftScore} isDark={isDark} />
                </div>
              </div>
            </div>
          )}

          {tab === 'upload' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setFiles([{ name: SAMPLE_NAME, text: JSON.stringify(sampleDataset) }])}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                  isDark ? 'border-indigo-800/60 bg-indigo-950/30 hover:bg-indigo-950/50' : 'border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50'
                }`}
              >
                <span>
                  <span className="block text-sm font-semibold">Use the built-in sample</span>
                  <span className={`block text-[11px] ${muted}`}>
                    No file needed. 3 weeks of a student sleeping poorly (scores mostly 60–70), then 7 days sticking to “No caffeine after 2 PM”, with habits and tracker data.
                  </span>
                </span>
                <FlaskConical className={`h-5 w-5 shrink-0 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`} />
              </button>
              <div className={`text-center text-[11px] ${muted}`}>or</div>
              <label
                htmlFor="td-file"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  readFiles(e.dataTransfer.files);
                }}
                className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
                  isDark ? 'border-slate-700 hover:border-indigo-500 hover:bg-slate-800/40' : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/40'
                }`}
              >
                <Upload className={`h-6 w-6 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`} />
                <span className="text-sm font-semibold">Choose or drop files</span>
                <span className={`text-[11px] ${muted}`}>
                  A sleeplab JSON file (everything), or CSV files for nights and behaviours. You can add several.
                </span>
                <input
                  id="td-file"
                  type="file"
                  accept=".json,.csv,application/json,text/csv"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    readFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
              {files.length > 0 && (
                <ul className="space-y-1">
                  {files.map((f) => (
                    <li
                      key={f.name}
                      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-xs ${isDark ? 'bg-slate-800/60' : 'bg-slate-100'}`}
                    >
                      <span className="min-w-0 truncate font-mono">{f.name === SAMPLE_NAME ? f.name : built.kinds.find((k) => k.startsWith(f.name)) ?? f.name}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${f.name}`}
                        onClick={() => setFiles((prev) => prev.filter((p) => p.name !== f.name))}
                        className={`shrink-0 ${muted} hover:text-rose-500`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === 'csv' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={`text-xs ${muted}`}>Paste a nights CSV or a behaviours CSV. The first row must be the header.</p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCsvText(csvExample())}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    Nights example
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCsvText(
                        [
                          BEHAVIOUR_CSV_HEADER,
                          `${localDateStr(new Date(Date.now() - 2 * 864e5))},15:30,coffee,Afternoon cold brew,Late caffeine,medium,1,,,`,
                          `${localDateStr(new Date(Date.now() - 2 * 864e5))},23:40,habit,Phone in bed,,,,phone-bed,📱,hurts`,
                          `${localDateStr(new Date(Date.now() - 864e5))},17:30,exercise,Evening run,30 min run,medium,30,,,`,
                        ].join('\n')
                      )
                    }
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    Behaviours example
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto space-y-1">
                <code className={`block whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] ${isDark ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                  Nights: {CSV_HEADER}
                </code>
                <code className={`block whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] ${isDark ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                  Behaviours: {BEHAVIOUR_CSV_HEADER}
                </code>
              </div>
              <textarea
                id="td-csv"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={8}
                spellCheck={false}
                placeholder={csvExample()}
                className={`${input} text-xs leading-relaxed`}
              />
            </div>
          )}

          {/* Shared preview for upload + paste */}
          {tab !== 'night' && sources.length > 0 && (
            <div className="mt-3 space-y-2.5">
              {built.errors.length > 0 && (
                <ul className={`max-h-28 space-y-0.5 overflow-y-auto rounded-lg border p-2.5 text-[11px] ${isDark ? 'border-rose-900/60 bg-rose-950/40 text-rose-200' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
                  {built.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
              {(ready.sleepRecords.length > 0 || ready.behaviorLogs.length > 0) && (
                <div className={`rounded-xl border p-3 text-xs ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/70'}`}>
                  <div className="font-semibold">Ready to load</div>
                  <ul className={`mt-1 space-y-0.5 ${muted}`}>
                    <li>
                      {ready.sleepRecords.length} nights
                      {ready.sleepRecords.some((r) => r.wearable) && ` (${ready.sleepRecords.filter((r) => r.wearable).length} with tracker data)`} ·{' '}
                      {ready.behaviorLogs.length} behaviour logs
                      {ready.habits && ready.habits.length > 0 && ` · ${ready.habits.length} habits`}
                    </li>
                    {readyScores.length > 0 && (
                      <li>
                        Scores {Math.min(...readyScores)}–{Math.max(...readyScores)}, average{' '}
                        {Math.round(readyScores.reduce((a, b) => a + b, 0) / readyScores.length)}
                      </li>
                    )}
                    {built.hasJson && <li>Includes experiments and typed scores from the file, if any.</li>}
                    {expSummary && (
                      <li className={`font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                        {expSummary.exp.icon} {expSummary.exp.title}: kept {expSummary.kept}/7 days · score{' '}
                        {expSummary.before} → {expSummary.during} ({expSummary.during - expSummary.before >= 0 ? '+' : ''}
                        {expSummary.during - expSummary.before})
                      </li>
                    )}
                  </ul>
                  {dateRange(built.data) && (
                    <label className="mt-2.5 flex cursor-pointer items-start gap-2">
                      <input
                        id="td-shift"
                        type="checkbox"
                        checked={shiftOn}
                        onChange={(e) => setShiftOn(e.target.checked)}
                        className="mt-0.5 h-3.5 w-3.5 accent-indigo-600"
                      />
                      <span>
                        <span className="flex items-center gap-1 font-semibold">
                          <CalendarClock className="h-3.5 w-3.5 text-indigo-500" /> Move dates so the latest night is last night
                        </span>
                        <span className={`block text-[11px] ${muted}`}>
                          {dateRange(built.data)!.from} – {dateRange(built.data)!.to}
                          {shiftDays ? ` → ${dateRange(ready)!.from} – ${dateRange(ready)!.to}` : ' (no change needed)'}. Keeps the demo
                          current on any day and leaves today free for a live check-in.
                        </span>
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          {tab === 'night' ? (
            <span className={`text-[11px] ${muted}`}>A night on an existing date replaces that record.</span>
          ) : built.hasJson ? (
            <span className={`text-[11px] ${muted}`}>A JSON dataset replaces all current data.</span>
          ) : (
            modeToggle
          )}
          {tab === 'night' ? (
            <button onClick={addNight} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
              <Check className="h-4 w-4" />
              Add night · {draftScore.total}
            </button>
          ) : (
            <button
              disabled={ready.sleepRecords.length + ready.behaviorLogs.length === 0}
              onClick={loadReady}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="h-4 w-4" />
              Load data
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
