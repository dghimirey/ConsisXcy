import React, { useState } from 'react';
import { StopwatchTab } from '../components/time/StopwatchTab';
import { TimerTab } from '../components/time/TimerTab';
import { PomodoroTab } from '../components/time/PomodoroTab';
import { Timer, Watch, Cherry } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'stopwatch' | 'timer' | 'pomodoro';

export default function TimeManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('pomodoro');

  const tabs = [
    { id: 'pomodoro', label: 'Pomodoro', icon: Cherry },
    { id: 'timer', label: 'Timer', icon: Timer },
    { id: 'stopwatch', label: 'Stopwatch', icon: Watch },
  ] as const;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto flex flex-col min-h-full">
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl lg:text-4xl font-display font-medium text-zinc-100 tracking-tight">Time</h1>
      </div>

      <div className="flex flex-wrap bg-app-surface/50 border border-app-border rounded-2xl p-1 mb-6 sm:mb-8 w-full gap-1 sm:w-fit justify-center sm:justify-start">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-none min-w-[100px] sm:min-w-0 ${activeTab === tab.id ? 'bg-app-glass text-white shadow-sm border border-app-border' : 'text-app-text-s hover:text-white border border-transparent'}`}
          >
            <tab.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === tab.id ? 'text-app-accent' : ''}`} />
            <span className="truncate">{tab.label}</span>
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
               {activeTab === 'timer' && <TimerTab />}
               {activeTab === 'stopwatch' && <StopwatchTab />}
            </motion.div>
         </AnimatePresence>
      </div>
    </div>
  );
}
