/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useRef, useState } from 'react';
import { SleepProvider, useSleep } from './context/SleepContext';
import { Navigation } from './components/Navigation';
import { BottomTabBar, AppTab } from './components/BottomTabBar';
import { TodayView } from './components/TodayView';
import { InsightsView } from './components/InsightsView';
import { ExperimentsView } from './components/ExperimentsView';
import { MeView } from './components/MeView';
import { MorningReflectionModal } from './components/MorningReflectionModal';
import { SplashScreen } from './components/SplashScreen';
import { localDateStr } from './data/testData';

function AppContent() {
  const { activeExperiment, startExperiment, theme, sleepRecords } = useSleep();
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [timeOfDayMode, setTimeOfDayMode] = useState<'auto' | 'morning' | 'evening'>('auto');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Splash closes → go straight into the morning check-in, unless today's is already done
  const hasCheckedInToday = sleepRecords.some((r) => r.date === localDateStr(new Date()));
  const splashDone = useRef(false);
  const finishSplash = useCallback(() => {
    if (splashDone.current) return; // timer, tap and keypress can all fire
    splashDone.current = true;
    setShowSplash(false);
    if (!hasCheckedInToday) setIsCheckInModalOpen(true);
  }, [hasCheckedInToday]);

  const activeExpDaysCount = activeExperiment
    ? Object.values(activeExperiment.adherence).filter(Boolean).length
    : 0;

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark
          ? 'bg-[#0b0f19] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200'
          : 'bg-slate-50 text-slate-900 selection:bg-indigo-500/20 selection:text-indigo-900'
      }`}
    >
      {/* Top Bar Contract (Wordmark — View Switchers — Context Action) */}
      <Navigation
        onGoHome={() => setActiveTab('today')}
        timeOfDayMode={timeOfDayMode}
        setTimeOfDayMode={setTimeOfDayMode}
        onOpenCheckIn={() => setIsCheckInModalOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 pt-6 pb-20">
        <>
            {activeTab === 'today' && (
              <TodayView
                timeOfDayMode={timeOfDayMode}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === 'insights' && (
              <InsightsView
                onStartExperiment={(templateId) => {
                  startExperiment(templateId);
                  setActiveTab('experiments');
                }}
                onOpenExperiments={() => setActiveTab('experiments')}
              />
            )}
            {activeTab === 'experiments' && <ExperimentsView />}
            {activeTab === 'me' && (
              <MeView
                onOpenCheckIn={() => setIsCheckInModalOpen(true)}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}
        </>
      </main>

      {/* Opening screen → morning check-in */}
      {showSplash && (
        <SplashScreen
          onDone={finishSplash}
          ctaLabel={hasCheckedInToday ? 'Checked in today · tap to continue' : 'Tap to start your check-in'}
        />
      )}

      {/* Global Morning Check-in Modal */}
      <MorningReflectionModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
      />

      {/* Mobile-First / Touch-Friendly Bottom Tab Bar (Only in App View) */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        activeExperimentDaysCount={activeExpDaysCount}
      />
    </div>
  );
}

export default function App() {
  return (
    <SleepProvider>
      <AppContent />
    </SleepProvider>
  );
}
