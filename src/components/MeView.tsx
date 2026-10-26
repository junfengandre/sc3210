import React, { useRef, useState } from 'react';
import {
  User,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Zap,
  Star,
  Trash2,
  Clock,
  Activity,
  Sliders,
  FlaskConical,
  Watch,
} from 'lucide-react';
import { useSleep } from '../context/SleepContext';
import { WEARABLE_SOURCES, sortNewestFirst } from '../lib/sleepScore';
import { ScoreBadge } from './ScoreBreakdown';
import { TestDataModal } from './TestDataModal';
import { RequirementsPanel } from './RequirementsPanel';
import { CareNotice } from './CareNotice';
import { EffectPill } from './HabitLibraryModal';
import { logEmoji, logEffect } from '../data/habitLibrary';

interface MeViewProps {
  onOpenCheckIn: () => void;
  onNavigateTab: (tab: 'today' | 'insights' | 'experiments' | 'me') => void;
}

export const MeView: React.FC<MeViewProps> = ({ onOpenCheckIn, onNavigateTab }) => {
  const {
    sleepRecords,
    behaviorLogs,
    deleteSleepRecord,
    deleteBehaviorLog,
    resetToDemoData,
    importData,
    scoreEntries,
    habits,
    sleepScores,
    pairedWearable,
    setPairedWearable,
    activeExperiment,
    completedExperiments,
    h1Metrics,
    theme,
  } = useSleep();

  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'sleep' | 'behaviors'>('sleep');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTestDataOpen, setIsTestDataOpen] = useState(false);

  // Import dataset from a previously exported JSON file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setImportStatus(importData(JSON.parse(String(reader.result))));
      } catch {
        setImportStatus({ ok: false, message: 'Could not read file — is it valid JSON?' });
      }
    };
    reader.readAsText(file);
  };

  // Export dataset as JSON
  const handleExportData = async () => {
    const data = {
      exportDate: new Date().toISOString(),
      user: {
        name: 'Andre',
      },
      sleepRecords,
      behaviorLogs,
      activeExperiment,
      completedExperiments,
      scoreEntries,
      habits,
      h1Metrics,
    };
    const json = JSON.stringify(data, null, 2);
    const filename = `sleeplab-data-${new Date().toISOString().split('T')[0]}.json`;

    // When hosted as a claude.ai artifact, downloads go through the viewer's save prompt
    const host = (window as unknown as { claude?: { use?: (n: string) => Promise<any> } }).claude;
    const downloads = host?.use ? await host.use('downloads').catch(() => null) : null;
    if (downloads) {
      try {
        await downloads.save({ filename, data: json });
        setImportStatus({ ok: true, message: `Exported ${filename}.` });
      } catch (err: any) {
        if (err?.code !== 'declined') {
          setImportStatus({ ok: false, message: 'Export could not be saved in this view. Try opening the downloaded HTML file instead.' });
        }
      }
      return;
    }

    // Standalone file: regular browser download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-24 max-w-xl mx-auto">
      {/* View Header */}
      <div>
        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Profile & Your Data
        </h1>
        <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Your personal longitudinal records, logging telemetry, and data controls.
        </p>
      </div>

      {/* Target User Persona Card */}
      <div
        className={`rounded-2xl border p-5 transition-colors ${
          isDark
            ? 'border-slate-800 bg-slate-900/70'
            : 'border-slate-200/90 bg-white shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-lg font-bold ${
                isDark
                  ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
            >
              A
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Andre
              </h2>
              <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span>Student</span>
                <span>·</span>
                <span className={isDark ? 'text-indigo-400' : 'text-indigo-600 font-medium'}>
                  Irregular schedule
                </span>
              </div>
            </div>
          </div>
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-mono font-semibold border ${
              isDark
                ? 'bg-indigo-950 text-indigo-300 border-indigo-800/40'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}
          >
            You
          </span>
        </div>

        <div
          className={`mt-4 rounded-xl p-3 border text-xs space-y-1.5 ${
            isDark
              ? 'bg-slate-950/60 border-slate-800/60 text-slate-300'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            Current Objective:
          </div>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Find out which of my habits (late coffee, screens, skipping the gym, stress) actually affect my sleep, then test one change at a time.
          </p>
        </div>

        {/* Wearable pairing (optional — self-report always works) */}
        <div
          className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
            isDark ? 'border-slate-800/60' : 'border-slate-100'
          }`}
        >
          <label htmlFor="me-wearable" className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <Watch className="h-4 w-4 text-violet-500" />
            <span>Sleep tracker:</span>
          </label>
          <div className="flex items-center gap-2">
            <select
              id="me-wearable"
              value={pairedWearable || ''}
              onChange={(e) => setPairedWearable(e.target.value || null)}
              className={`rounded-lg border px-2 py-1 text-xs font-semibold focus:border-indigo-500 focus:outline-none ${
                isDark ? 'border-slate-700 bg-slate-950 text-slate-200' : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              <option value="">None (self-report only)</option>
              {WEARABLE_SOURCES.map((w) => (
                <option key={w} value={w}>
                  {w} (simulated)
                </option>
              ))}
            </select>
            {pairedWearable ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Paired</span>
              </span>
            ) : (
              <span className={`flex items-center gap-1 text-[11px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <Activity className="h-3.5 w-3.5" />
                <span>Optional</span>
              </span>
            )}
          </div>
          <p className={`w-full text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            {pairedWearable
              ? `Morning check-ins pull stage, SpO₂ and heart data from your ${pairedWearable} and add it to your sleep score.`
              : 'Self-reported check-ins are all you need. Pair a tracker to add sleep-stage data to your score.'}
          </p>
        </div>
      </div>

      {/* H1 Friction Telemetry Card */}
      <div
        className={`rounded-2xl border p-5 transition-colors ${
          isDark
            ? 'border-slate-800 bg-slate-900/70'
            : 'border-slate-200/90 bg-white shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Hypothesis 1: Logging Friction Telemetry
          </div>
          {h1Metrics.totalCheckIns > 0 && h1Metrics.totalQuickLogs > 0 && (
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                h1Metrics.avgCheckInSeconds < 30 && h1Metrics.avgQuickLogSeconds < 5
                  ? isDark
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : isDark
                  ? 'text-rose-300 bg-rose-950/60 border-rose-800/40'
                  : 'text-rose-700 bg-rose-50 border-rose-200'
              }`}
            >
              {h1Metrics.avgCheckInSeconds < 30 && h1Metrics.avgQuickLogSeconds < 5 ? 'Goal Met' : 'Over goal'}
            </span>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div
            className={`rounded-xl p-3 border ${
              isDark
                ? 'bg-slate-950/60 border-slate-800'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Morning Check-in Avg:
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-lg font-bold font-mono tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {h1Metrics.totalCheckIns ? `${h1Metrics.avgCheckInSeconds}s` : '—'}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">(&lt;30s goal)</span>
            </div>
            <div className={`mt-1 text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {h1Metrics.totalCheckIns} timed check-ins
            </div>
          </div>

          <div
            className={`rounded-xl p-3 border ${
              isDark
                ? 'bg-slate-950/60 border-slate-800'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Quick Behavior Log Avg:
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-lg font-bold font-mono tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {h1Metrics.totalQuickLogs ? `${h1Metrics.avgQuickLogSeconds}s` : '—'}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">(&lt;5s goal)</span>
            </div>
            <div className={`mt-1 text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {h1Metrics.totalQuickLogs} timed quick logs
            </div>
          </div>
        </div>
      </div>

      {/* Longitudinal Dataset Table */}
      <div
        className={`rounded-2xl border p-5 transition-colors ${
          isDark
            ? 'border-slate-800 bg-slate-900/70'
            : 'border-slate-200/90 bg-white shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Your Data Log
          </h3>
          <div
            className={`flex items-center rounded-lg p-0.5 border text-xs ${
              isDark
                ? 'bg-slate-950 border-slate-800'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              onClick={() => setActiveTab('sleep')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === 'sleep'
                  ? isDark
                    ? 'bg-slate-800 text-white font-medium'
                    : 'bg-white text-slate-900 font-semibold shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sleep ({sleepRecords.length})
            </button>
            <button
              onClick={() => setActiveTab('behaviors')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === 'behaviors'
                  ? isDark
                    ? 'bg-slate-800 text-white font-medium'
                    : 'bg-white text-slate-900 font-semibold shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Behaviors ({behaviorLogs.length})
            </button>
          </div>
        </div>

        {activeTab === 'sleep' ? (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {sortNewestFirst(sleepRecords).map((record) => (
              <div
                key={record.id}
                className={`flex items-center justify-between rounded-xl p-3 text-xs border ${
                  isDark
                    ? 'bg-slate-950/60 border-slate-800/60'
                    : 'bg-slate-50 border-slate-200/80 text-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {record.date}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className={`font-mono font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                      {Math.floor(record.sleepDurationMinutes / 60)}h {record.sleepDurationMinutes % 60}m
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                      onset ~{record.sleepOnsetLatencyMinutes}m
                    </span>
                  </div>
                  {record.notes && (
                    <div className={`mt-1 text-[11px] italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      "{record.notes}"
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {sleepScores[record.id] && <ScoreBadge score={sleepScores[record.id]} isDark={isDark} />}
                  <div className="flex items-center gap-1 text-amber-500 font-mono text-[11px] font-semibold">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{record.quality}/5</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 font-mono text-[11px] font-semibold">
                    <Zap className="h-3 w-3 fill-current" />
                    <span>{record.morningEnergy}/5</span>
                  </div>
                  <button
                    onClick={() => deleteSleepRecord(record.id)}
                    className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                    title="Delete record"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {behaviorLogs.map((log) => (
              <div
                key={log.id}
                className={`flex items-center justify-between rounded-xl p-3 text-xs border ${
                  isDark
                    ? 'bg-slate-950/60 border-slate-800/60'
                    : 'bg-slate-50 border-slate-200/80 text-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {log.date} {log.time}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {logEmoji(log)} {log.title}
                    </span>
                    {logEffect(log) && <EffectPill effect={logEffect(log)!} isDark={isDark} />}
                  </div>
                  <div className={`mt-0.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {log.detail}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {log.loggedDurationSeconds}s log
                  </span>
                  <button
                    onClick={() => deleteBehaviorLog(log.id)}
                    className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                    title="Delete log"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CareNotice />

      {/* Product brief & core requirements (live checks) */}
      <RequirementsPanel onOpenCheckIn={onOpenCheckIn} onGoToTab={onNavigateTab} />

      {/* Data Export & Reset Controls */}
      <div
        className={`rounded-2xl border p-5 transition-colors ${
          isDark
            ? 'border-slate-800 bg-slate-900/70'
            : 'border-slate-200/90 bg-white shadow-xs'
        }`}
      >
        <h3 className={`text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Data Management
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExportData}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-colors ${
              isDark
                ? 'border border-slate-700 bg-slate-800 text-white hover:bg-slate-700'
                : 'border border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100 shadow-xs'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>Export Your Data (JSON)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-colors ${
              isDark
                ? 'border border-slate-700 bg-slate-800 text-white hover:bg-slate-700'
                : 'border border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100 shadow-xs'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Import Data (JSON)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />

          <button
            onClick={() => setIsTestDataOpen(true)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-colors ${
              isDark
                ? 'border border-indigo-800/60 bg-indigo-950/40 text-indigo-200 hover:bg-indigo-900/40'
                : 'border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <FlaskConical className="h-4 w-4" />
            <span>Test Data Lab</span>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-semibold transition-colors ${
              isDark
                ? 'border border-rose-900/40 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40'
                : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear all data</span>
          </button>
        </div>

        <TestDataModal
          isOpen={isTestDataOpen}
          onClose={() => setIsTestDataOpen(false)}
          onLoaded={(message) => setImportStatus({ ok: true, message })}
        />

        {importStatus && (
          <div
            className={`mt-4 flex items-start justify-between gap-3 rounded-xl border p-3 text-xs ${
              importStatus.ok
                ? isDark
                  ? 'border-emerald-900/60 bg-emerald-950/40 text-emerald-200'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : isDark
                ? 'border-rose-900/60 bg-rose-950/40 text-rose-200'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            <p className="font-medium">{importStatus.message}</p>
            <button onClick={() => setImportStatus(null)} className="font-bold opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {showResetConfirm && (
          <div
            className={`mt-4 rounded-xl border p-3 text-xs ${
              isDark
                ? 'border-rose-900/60 bg-rose-950/40 text-rose-200'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            <p className="font-medium">Delete all nights, logs, typed scores and experiments? Export first if you want a backup. Your habit tiles and tracker pairing stay.</p>
            <div className="mt-2 flex gap-2 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToDemoData();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold"
              >
                Yes, clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
