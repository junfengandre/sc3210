import React from 'react';
import { HeartPulse } from 'lucide-react';
import { useSleep } from '../context/SleepContext';

/** Required: sleeplab gives health-related guidance, so it says what it is not and points to real help. */
export const CareNotice: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { theme } = useSleep();
  const isDark = theme === 'dark';
  if (compact) {
    return (
      <p className={`text-[10px] leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
        sleeplab is a self-tracking tool, not a medical service. Poor sleep for weeks? See a GP or polyclinic doctor.
        Struggling emotionally? National Mindline 1771 (24/7).
      </p>
    );
  }
  return (
    <div
      role="note"
      className={`rounded-2xl border p-4 text-xs leading-relaxed ${
        isDark ? 'border-slate-800 bg-slate-900/60 text-slate-300' : 'border-slate-200 bg-white text-slate-600'
      }`}
    >
      <div className={`mb-1 flex items-center gap-1.5 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
        <HeartPulse className="h-4 w-4 text-rose-500" /> Not a medical service
      </div>
      <p>
        sleeplab helps you notice patterns in your own sleep. It is not a doctor, a sleep clinic or a counsellor, and its scores
        and insights are not a diagnosis.
      </p>
      <ul className="mt-2 list-disc space-y-0.5 pl-4">
        <li>If poor sleep goes on for weeks or affects your day-to-day life, see a GP or polyclinic doctor.</li>
        <li>
          If you are struggling emotionally, call or WhatsApp <span className="font-semibold">National Mindline 1771</span>, any time,
          or use its webchat.
        </li>
        <li>In an emergency, call <span className="font-semibold">995</span>.</li>
      </ul>
    </div>
  );
};
