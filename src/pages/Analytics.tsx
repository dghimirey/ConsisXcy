import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSections, fetchRestrictedTasks } from '../services/api';
import { Section } from '../types';

import { WeeklyMetrics } from '../components/metrics/WeeklyMetrics';
import { HabitHeatmap } from '../components/HabitHeatmap';
import { YearlyConsistency } from '../components/metrics/YearlyConsistency';
import { RestrictedHabitHeatmap } from '../components/metrics/RestrictedHabitHeatmap';
import { RestrictedYearlyConsistency } from '../components/metrics/RestrictedYearlyConsistency';

export default function Analytics() {
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [consistencyView, setConsistencyView] = useState<'monthly' | 'yearly'>('monthly');
  const [restrictedView, setRestrictedView] = useState<'monthly' | 'yearly'>('monthly');
  
  const { data: sectionsData = [] } = useQuery({ queryKey: ['sections'], queryFn: fetchSections });
  const { data: restrictedTasks = [] } = useQuery({ queryKey: ['restrictedTasks'], queryFn: fetchRestrictedTasks });

  const hasRestrictedTasks = restrictedTasks.length > 0;

  return (
    <div className="max-w-[1400px] mx-auto min-h-screen px-4 md:px-6 lg:px-8 py-6 md:py-8 font-sans animate-fade-in relative z-10 pb-24 md:pb-8">
      <header className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-display font-medium text-white tracking-tight mb-2">Analytics</h1>
        <p className="text-sm md:text-base text-app-text-s/80">Track your progress and consistency over time.</p>
        
        
      </header>

      <div className="w-full mb-6">
          <WeeklyMetrics section={selectedSection} />
      </div>
      
      <div className="w-full mb-12">
          <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-display font-medium text-white tracking-tight">Consistency</h2>
              <div className="ml-auto flex bg-app-surface border border-app-border rounded-lg p-1">
                  <button
                      onClick={() => setConsistencyView('monthly')}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${consistencyView === 'monthly' ? 'bg-app-accent/20 text-app-accent' : 'text-app-text-s hover:text-white'}`}
                  >
                      Monthly
                  </button>
                  <button
                      onClick={() => setConsistencyView('yearly')}
                       className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${consistencyView === 'yearly' ? 'bg-app-accent/20 text-app-accent' : 'text-app-text-s hover:text-white'}`}
                  >
                      Yearly
                  </button>
              </div>
          </div>
          <div className="w-full">
              {consistencyView === 'monthly' ? (
                  <HabitHeatmap section={selectedSection} />
              ) : (
                  <YearlyConsistency section={selectedSection} />
              )}
          </div>
      </div>

      {hasRestrictedTasks && selectedSection === 'All' && (
        <div className="w-full mb-12">
          <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-display font-medium text-white tracking-tight">Restricted Tasks Tracking</h2>
              <div className="ml-auto flex bg-app-surface border border-app-border rounded-lg p-1">
                  <button
                      onClick={() => setRestrictedView('monthly')}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${restrictedView === 'monthly' ? 'bg-rose-500/20 text-rose-400' : 'text-app-text-s hover:text-white'}`}
                  >
                      Monthly
                  </button>
                  <button
                      onClick={() => setRestrictedView('yearly')}
                       className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${restrictedView === 'yearly' ? 'bg-rose-500/20 text-rose-400' : 'text-app-text-s hover:text-white'}`}
                  >
                      Yearly
                  </button>
              </div>
          </div>
          <div className="w-full">
              {restrictedView === 'monthly' ? (
                  <RestrictedHabitHeatmap />
              ) : (
                  <RestrictedYearlyConsistency />
              )}
          </div>
        </div>
      )}
    </div>
  );
}
