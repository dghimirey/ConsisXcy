import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSections, fetchRestrictedTasks } from '../services/api';
import { Section } from '../types';

import { WeeklyMetrics } from '../components/metrics/WeeklyMetrics';
import { MonthlyTrendsChart } from '../components/MonthlyTrendsChart';
import { HabitHeatmap } from '../components/HabitHeatmap';
import { YearlyConsistency } from '../components/metrics/YearlyConsistency';
import { RestrictedHabitHeatmap } from '../components/metrics/RestrictedHabitHeatmap';
import { RestrictedYearlyConsistency } from '../components/metrics/RestrictedYearlyConsistency';

export default function Analytics() {
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const { data: sectionsData = [] } = useQuery({ queryKey: ['sections'], queryFn: fetchSections });
  const { data: restrictedTasks = [] } = useQuery({ queryKey: ['restrictedTasks'], queryFn: fetchRestrictedTasks });

  const hasRestrictedTasks = restrictedTasks.length > 0;

  return (
    <div className="max-w-[1400px] mx-auto min-h-screen px-4 md:px-6 lg:px-8 py-6 md:py-8 font-sans animate-fade-in relative z-10 pb-24 md:pb-8">
      <header className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-display font-medium text-white tracking-tight mb-2">Analytics</h1>
        <p className="text-sm md:text-base text-app-text-s/80">Track your progress and consistency over time.</p>
        
        {sectionsData.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
             <button
                onClick={() => setSelectedSection('All')}
                className={`px-3 py-1.5 rounded-full text-xs font-mono tracking-wide transition-colors border ${selectedSection === 'All' ? 'bg-app-accent border-app-accent text-white' : 'bg-app-surface border-app-border text-app-text-s hover:text-white hover:border-app-text-s/50'}`}
             >
                All Areas
             </button>
             {sectionsData.map((sec: Section) => (
                <button
                   key={sec.id}
                   onClick={() => setSelectedSection(sec.id)}
                   className={`px-3 py-1.5 rounded-full text-xs font-mono tracking-wide transition-colors border ${selectedSection === sec.id ? 'bg-app-accent border-app-accent text-white' : 'bg-app-surface border-app-border text-app-text-s hover:text-white hover:border-app-text-s/50'}`}
                >
                   {sec.name}
                </button>
             ))}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mb-6">
          <WeeklyMetrics section={selectedSection} />
          <MonthlyTrendsChart section={selectedSection} />
      </div>
      
      <div className="w-full space-y-6 mb-12">
          <HabitHeatmap section={selectedSection} />
          <YearlyConsistency section={selectedSection} />
      </div>

      {hasRestrictedTasks && selectedSection === 'All' && (
        <>
          <h2 className="text-2xl font-display font-medium text-white tracking-tight mb-6">Restricted Tasks Tracking</h2>
          <div className="w-full space-y-6">
              <RestrictedHabitHeatmap />
              <RestrictedYearlyConsistency />
          </div>
        </>
      )}
    </div>
  );
}
