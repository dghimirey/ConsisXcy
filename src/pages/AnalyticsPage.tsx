import { useQuery } from '@tanstack/react-query';
import { Activity, Flame, Filter } from 'lucide-react';
import { useMemo, useState } from 'react';
import { fetchStreaks, fetchRoutines } from '../services/api';
import { HabitHeatmap } from '../components/HabitHeatmap';
import { YearlyHeatmap } from '../components/YearlyHeatmap';
import { Routine } from '../types';

export default function AnalyticsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const { data: routines = [] } = useQuery({ queryKey: ['routines'], queryFn: fetchRoutines });
  const { data: streaks = [] } = useQuery({ queryKey: ['streaks'], queryFn: fetchStreaks });

  const categories = useMemo(() => ['All', ...new Set(routines.map((r: Routine) => r.category).filter(Boolean))], [routines]);

  const routineIdsInCategory = useMemo(() => {
    if (selectedCategory === 'All') return routines.map(r => r.id);
    return routines.filter(r => r.category === selectedCategory).map(r => r.id);
  }, [routines, selectedCategory]);

  const filteredStreaks = useMemo(() => 
    streaks.filter(s => routineIdsInCategory.includes(s.routineId)),
  [streaks, routineIdsInCategory]);

  const longestStreak = Math.max(...filteredStreaks.map(s => s.longestStreak), 0);
  const totalCompleted = filteredStreaks.reduce((acc, s) => acc + s.totalCompletedDays, 0);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-white mb-1">Analytics</h1>
          <p className="text-app-text-s">Track your consistency and growth</p>
        </div>
        {categories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              <Filter className="w-4 h-4 text-app-text-s shrink-0" />
              {categories.map((cat: any) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat 
                      ? 'bg-app-accent text-zinc-900 border border-app-accent' 
                      : 'bg-app-glass border border-app-border text-app-text hover:border-app-text-s'
                  }`}
                >
                  {cat || 'Uncategorized'}
                </button>
              ))}
            </div>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 mt-4">
        <div className="bg-app-glass border border-app-border p-4 md:p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-app-accent/10 flex items-center justify-center shrink-0">
                <Flame className="w-6 h-6 text-app-accent" />
            </div>
            <div>
                <p className="text-app-text-s text-[11px] uppercase tracking-wider font-mono">Longest Streak</p>
                <p className="text-3xl font-display font-bold text-white leading-none mt-1">{longestStreak} <span className="text-sm font-mono text-app-text-s font-normal">days</span></p>
            </div>
        </div>
        <div className="bg-app-glass border border-app-border p-4 md:p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-app-accent/10 flex items-center justify-center shrink-0">
                <Activity className="w-6 h-6 text-app-accent" />
            </div>
            <div>
                <p className="text-app-text-s text-[11px] uppercase tracking-wider font-mono">Total Completed</p>
                <p className="text-3xl font-display font-bold text-white leading-none mt-1">{totalCompleted} <span className="text-sm font-mono text-app-text-s font-normal">routines</span></p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="col-span-1 md:col-span-2">
            <YearlyHeatmap category={selectedCategory} />
        </div>
        <div className="col-span-1 md:col-span-2 flex justify-center">
            <HabitHeatmap category={selectedCategory} />
        </div>
      </div>
    </div>
  );
}
