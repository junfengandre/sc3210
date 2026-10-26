import React from 'react';
import { Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { useSleep } from '../context/SleepContext';

interface NavigationProps {
  onGoHome: () => void;
  timeOfDayMode: 'auto' | 'morning' | 'evening';
  setTimeOfDayMode: (mode: 'auto' | 'morning' | 'evening') => void;
  onOpenCheckIn: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  onGoHome,
  timeOfDayMode,
  setTimeOfDayMode,
  onOpenCheckIn,
}) => {
  const { theme, toggleTheme } = useSleep();
  const isDark = theme === 'dark';

  return (
    <header
      className={`sticky top-0 z-40 w-full backdrop-blur-md transition-colors border-b ${
        isDark
          ? 'border-slate-800/80 bg-slate-950/80'
          : 'border-slate-200/80 bg-white/85 shadow-xs'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4 sm:px-6">
        {/* Zone 1: Single element brand wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={onGoHome}
            aria-label="sleeplab, go to Today"
            className="group flex items-center gap-2 text-left"
          >
            {/* Crescent mark: a moon with a small "lab" dot */}
            <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
              <defs>
                <linearGradient id="sl-moon" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
              <path
                d="M20.5 4.5a11.5 11.5 0 1 0 7 20.6A9.5 9.5 0 0 1 20.5 4.5Z"
                fill="url(#sl-moon)"
                className="motion-safe:transition-transform motion-safe:duration-500 origin-center group-hover:-rotate-12"
              />
              <circle cx="24.5" cy="9" r="2.2" fill="#a5b4fc" />
            </svg>
            <span
              className={`font-display italic text-[1.75rem] leading-none tracking-[-0.015em] ${isDark ? 'text-white' : 'text-slate-900'}`}
            >
              sleeplab
            </span>
          </button>
        </div>

        {/* Zone 3: 1-2 Primary contextual actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Theme Switcher Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
              isDark
                ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs'
            }`}
          >
            {isDark ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline text-[11px]">Light mode</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-indigo-600" />
                <span className="hidden sm:inline text-[11px]">Dark mode</span>
              </>
            )}
          </button>

          {/* Day / Evening context simulator */}
          <div
            role="group"
            aria-label="Simulate time of day"
            className={`flex items-center rounded-lg border p-0.5 ${
              isDark
                ? 'bg-slate-900 border-slate-800'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              title="Simulate morning" aria-label="Simulate morning" aria-pressed={timeOfDayMode === 'morning'}
              onClick={() => setTimeOfDayMode(timeOfDayMode === 'morning' ? 'auto' : 'morning')}
              className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors ${
                timeOfDayMode === 'morning'
                  ? isDark
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-white text-amber-600 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sunrise className="h-3.5 w-3.5" />
            </button>
            <button
              title="Simulate evening" aria-label="Simulate evening" aria-pressed={timeOfDayMode === 'evening'}
              onClick={() => setTimeOfDayMode(timeOfDayMode === 'evening' ? 'auto' : 'evening')}
              className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors ${
                timeOfDayMode === 'evening'
                  ? isDark
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'bg-white text-indigo-600 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sunset className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={onOpenCheckIn}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 active:scale-[0.98] transition-all whitespace-nowrap shadow-sm shadow-indigo-600/20"
          >
            <span className="hidden sm:inline">Morning Check-in</span>
            <span className="sm:hidden">Check-in</span>
            <span className="hidden md:inline text-[10px] text-indigo-200 font-mono">(&lt;30s)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
