import React, { useState } from 'react';
import { StopwatchTab } from '../components/time/StopwatchTab';
import { TimerTab } from '../components/time/TimerTab';
import { PomodoroTab } from '../components/time/PomodoroTab';
import { FocusSessionsTab } from '../components/time/FocusSessionsTab';
import { TimeStatsTab } from '../components/time/TimeStatsTab';
import { Timer, Watch, Cherry, BrainCircuit, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'stopwatch' | 'timer' | 'pomodoro' | 'focus' | 'stats';

export default function TimeManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('pomodoro');

  const tabs = [
    { id: 'pomodoro', label: 'Pomodoro', icon: Cherry },
    { id: 'focus', label: 'Sessions', icon: BrainCircuit },
    { id: 'timer', label: 'Timer', icon: Timer },
    { id: 'stopwatch', label: 'Stopwatch', icon: Watch },
    { id: 'stats', label: 'Stats', icon: BarChart2 },
  ] as const;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto flex flex-col min-h-full">
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl lg:text-4xl font-display font-medium text-zinc-100 tracking-tight">Time Management</h1>
        <p className="text-app-text-p mt-2">Focus on what matters, track your progress.</p>
      </div>

      <div className="flex bg-app-surface/50 border border-app-border rounded-2xl p-1 mb-8 w-fit overflow-x-auto custom-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-app-glass text-white shadow-sm border border-app-border' : 'text-app-text-s hover:text-white border border-transparent'}`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-app-accent' : ''}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 w-full relative">
         <AnimatePresence mode="wait">
            <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
               className="w-full h-full"
            >
               {activeTab === 'pomodoro' && <PomodoroTab />}
               {activeTab === 'focus' && <FocusSessionsTab />}
               {activeTab === 'timer' && <TimerTab />}
               {activeTab === 'stopwatch' && <StopwatchTab />}
               {activeTab === 'stats' && <TimeStatsTab />}
            </motion.div>
         </AnimatePresence>
      </div>
    </div>
  );
}
