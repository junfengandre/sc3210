import React, { useState } from 'react';
import { X, Plus, Check, ArrowUp, ArrowDown } from 'lucide-react';
import { useSleep } from '../context/SleepContext';
import { HabitDefinition, HabitEffect, HabitGroup } from '../types/sleep';
import { HABIT_LIBRARY, HABIT_GROUP_LABELS } from '../data/habitLibrary';

interface HabitLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Filter = 'all' | 'helps' | 'hurts' | HabitGroup;

export const EffectPill: React.FC<{ effect: HabitEffect; isDark: boolean }> = ({ effect, isDark }) =>
  effect === 'helps' ? (
    <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${isDark ? 'bg-emerald-950/60 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
      <ArrowUp className="h-3 w-3" /> Helps
    </span>
  ) : (
    <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${isDark ? 'bg-rose-950/60 text-rose-300' : 'bg-rose-50 text-rose-700'}`}>
      <ArrowDown className="h-3 w-3" /> Hurts
    </span>
  );

export const HabitLibraryModal: React.FC<HabitLibraryModalProps> = ({ isOpen, onClose }) => {
  const { theme, habits, addHabit, removeHabit } = useSleep();
  const isDark = theme === 'dark';
  const [filter, setFilter] = useState<Filter>('all');
  const [customLabel, setCustomLabel] = useState('');
  const [customEmoji, setCustomEmoji] = useState('⭐');
  const [customEffect, setCustomEffect] = useState<HabitEffect>('helps');

  if (!isOpen) return null;

  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const activeIds = new Set(habits.map((h) => h.id));
  const customHabits = habits.filter((h) => h.group === 'custom');
  const pool = [...HABIT_LIBRARY, ...customHabits];
  const shown = pool.filter((h) =>
    filter === 'all' ? true : filter === 'helps' || filter === 'hurts' ? h.effect === filter : h.group === filter
  );
  const groups: HabitGroup[] = ['general', 'student', 'professional', 'family', 'custom'];

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'helps', label: 'Helps sleep' },
    { id: 'hurts', label: 'Hurts sleep' },
    { id: 'student', label: 'Students' },
    { id: 'professional', label: 'Professionals' },
    { id: 'family', label: 'Family' },
  ];

  const createCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const label = customLabel.trim();
    if (!label) return;
    addHabit({
      id: `custom-${Date.now()}`,
      label,
      emoji: customEmoji.trim() || '⭐',
      effect: customEffect,
      group: 'custom',
    });
    setCustomLabel('');
  };

  const input = `rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none ${
    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Habits to track"
        className={`flex max-h-[92vh] w-full max-w-xl flex-col rounded-t-2xl sm:rounded-2xl border shadow-2xl ${
          isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        <div className={`flex items-start justify-between gap-3 border-b px-5 pt-5 pb-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div>
            <h2 className="text-lg font-bold">Habits to track</h2>
            <p className={`mt-0.5 text-xs ${muted}`}>
              Added habits become one-tap tiles in Quick Log. {habits.length} added.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto px-5 pt-3 pb-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                filter === f.id
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : isDark
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {groups.map((g) => {
            const items = shown.filter((h) => h.group === g);
            if (!items.length) return null;
            return (
              <section key={g}>
                <h3 className={`mb-1.5 text-[11px] font-semibold uppercase tracking-wider ${muted}`}>{HABIT_GROUP_LABELS[g]}</h3>
                <ul className="space-y-1.5">
                  {items.map((h) => {
                    const added = activeIds.has(h.id);
                    return (
                      <li
                        key={h.id}
                        className={`flex items-center gap-3 rounded-xl border p-2.5 ${
                          added
                            ? isDark
                              ? 'border-indigo-700/60 bg-indigo-950/30'
                              : 'border-indigo-200 bg-indigo-50/50'
                            : isDark
                            ? 'border-slate-800 bg-slate-950/40'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <span className="text-xl" aria-hidden="true">{h.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-semibold">{h.label}</span>
                            <EffectPill effect={h.effect} isDark={isDark} />
                          </div>
                          {h.why && <p className={`mt-0.5 text-[11px] leading-snug ${muted}`}>{h.why}</p>}
                        </div>
                        <button
                          onClick={() => (added ? removeHabit(h.id) : addHabit(h))}
                          aria-label={added ? `Remove ${h.label}` : `Add ${h.label}`}
                          className={`flex h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-colors ${
                            added
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                              : isDark
                              ? 'border border-slate-700 text-slate-200 hover:bg-slate-800'
                              : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {added ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          {added ? 'Added' : 'Add'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        {/* Create your own */}
        <form onSubmit={createCustom} className={`border-t px-5 py-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className={`mb-1.5 text-[11px] font-semibold ${muted}`}>Create your own</div>
          <div className="flex flex-wrap gap-2">
            <input
              id="habit-emoji"
              aria-label="Emoji"
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value)}
              maxLength={4}
              className={`${input} w-14 text-center`}
            />
            <input
              id="habit-label"
              aria-label="Habit name"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="e.g. Matcha after 3 PM"
              className={`${input} min-w-0 flex-1`}
            />
            <div className={`flex rounded-lg p-0.5 text-[11px] font-semibold ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              {(['helps', 'hurts'] as HabitEffect[]).map((ef) => (
                <button
                  key={ef}
                  type="button"
                  onClick={() => setCustomEffect(ef)}
                  aria-pressed={customEffect === ef}
                  className={`rounded-md px-2.5 py-1 ${
                    customEffect === ef
                      ? ef === 'helps'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                      : muted
                  }`}
                >
                  {ef === 'helps' ? 'Helps' : 'Hurts'}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={!customLabel.trim()}
              className="rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export type { HabitDefinition };
