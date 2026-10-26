import React, { useEffect } from 'react';

interface SplashScreenProps {
  /** Called when the person taps to enter */
  onDone: () => void;
  /** Button text, e.g. when today's check-in is already done */
  ctaLabel?: string;
}

/**
 * Opening screen: asks how last night went and shows the tagline. It stays up until
 * the person taps (or presses Enter / Space), then hands off to the morning check-in.
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({ onDone, ctaLabel = 'Tap to start your check-in' }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onDone();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDone]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="How was your sleep last night?"
      onClick={onDone}
      className="sl-splash fixed inset-0 z-[60] flex cursor-pointer flex-col items-center justify-center bg-gradient-to-b from-[#0b0f19] via-indigo-950 to-[#1e1b4b] px-6 text-center text-white"
    >
      {/* A few quiet stars */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {[
          [12, 18], [78, 12], [88, 34], [22, 62], [64, 72], [40, 22], [8, 84], [92, 80],
        ].map(([l, t], i) => (
          <span
            key={i}
            className="sl-star absolute h-1 w-1 rounded-full bg-indigo-200"
            style={{ left: `${l}%`, top: `${t}%`, animationDelay: `${i * 0.25}s` }}
          />
        ))}
      </div>

      <svg viewBox="0 0 32 32" className="sl-rise h-16 w-16" aria-hidden="true">
        <defs>
          <linearGradient id="sl-moon-splash" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a5b4fc" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <path d="M20.5 4.5a11.5 11.5 0 1 0 7 20.6A9.5 9.5 0 0 1 20.5 4.5Z" fill="url(#sl-moon-splash)" />
        <circle cx="24.5" cy="9" r="2.2" fill="#c7d2fe" />
      </svg>

      <h1
        className="sl-rise mt-6 max-w-sm font-display text-4xl italic leading-tight tracking-[-0.015em] sm:text-5xl"
        style={{ animationDelay: '0.15s' }}
      >
        How was your sleep last night?
      </h1>

      <p className="sl-rise mt-4 text-sm font-medium text-indigo-200" style={{ animationDelay: '0.45s' }}>
        Keep on track with <span className="italic text-white">sleeplab</span>
      </p>

      {/* Waits here until tapped */}
      <button
        type="button"
        autoFocus
        onClick={(e) => {
          e.stopPropagation();
          onDone();
        }}
        className="sl-rise mt-12 rounded-full border border-indigo-300/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-300/60"
        style={{ animationDelay: '0.7s' }}
      >
        <span className="sl-pulse">{ctaLabel}</span>
      </button>
    </div>
  );
};
