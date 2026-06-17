import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { fetchCompletions, fetchRoutines, fetchCategories } from '../services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDayCompletionStatus } from '../lib/consistency';

export function HabitHeatmap({ section = 'All' }: { section?: string }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const { data: completions = [] } = useQuery({ queryKey: ['completions'], queryFn: fetchCompletions });
  const { data: routines = [] } = useQuery({ queryKey: ['routines'], queryFn: fetchRoutines });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const currentMonth = dayjs().add(monthOffset, 'month').startOf('month');
  const daysInMonth = currentMonth.daysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) => currentMonth.add(i, 'day'));
  
  const startDay = currentMonth.day(); // 0 (Sun) to 6 (Sat)
  const prefixDays = Array(startDay).fill(null);

  const getDayStatus = (date: dayjs.Dayjs) => {
    return getDayCompletionStatus(date.format('YYYY-MM-DD'), routines, categories, completions, section);
  };

  // Calculate current active streak set for highlighting
  const currentStreakDates = new Set<string>();
  if (routines.length > 0) {
    let d = dayjs().subtract(1, 'day'); // start checking from yesterday
    while (true) {
      const res = getDayStatus(d);
      if (res.status === 'ALL' && res.totalTasks > 0) {
        currentStreakDates.add(d.format('YYYY-MM-DD'));
        d = d.subtract(1, 'day');
      } else if (res.status === 'PENDING' || res.status === 'NONE') {
        // "NONE" means no tasks. We should skip over it to see if streak continues before
        d = d.subtract(1, 'day');
      } else {
        break; // missed or some
      }
      
      // Stop condition if we check back too far (prevent infinite loops)
      if (dayjs().diff(d, 'day') > 1000) break;
    }
    // Check if today is completed too
    if (getDayStatus(dayjs()).status === 'ALL' && getDayStatus(dayjs()).totalTasks > 0) {
       currentStreakDates.add(dayjs().format('YYYY-MM-DD'));
    }
  }

  return (
    <div className="bg-app-surface border border-app-border p-4 md:p-6 rounded-2xl w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[11px] uppercase tracking-wider text-app-text-s font-mono">Monthly Consistency</h3>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMonthOffset(prev => prev - 1)}
            className="p-1 rounded bg-app-glass border border-app-border cursor-pointer hover:bg-app-border/50 transition-colors text-app-text-s hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] uppercase tracking-wider text-app-text-s font-mono text-center w-20">{currentMonth.format('MMM YYYY')}</span>
          <button 
            onClick={() => setMonthOffset(prev => prev + 1)}
            className="p-1 rounded bg-app-glass border border-app-border cursor-pointer hover:bg-app-border/50 transition-colors text-app-text-s hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 max-w-sm mx-auto w-full">
         {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
           <div key={`header-${i}`} className="flex items-center justify-center text-[10px] text-app-text-s font-mono pb-1">
             {day}
           </div>
         ))}
         {prefixDays.map((_, i) => (
           <div key={`empty-${i}`} className="aspect-square" />
         ))}
          {days.map(day => {
           const result = getDayStatus(day);
           const status = result.status;
           const percentage = result.percentage;
           const isToday = day.isSame(dayjs(), 'day');
           
           let bgClass = 'bg-[#1a1a1a] border border-[#2a2a2a] text-app-text-s/30 z-10 hover:bg-[#222222] hover:scale-[1.05]'; // NONE
           
           if (status !== 'NONE') {
             if (percentage === 100) {
               // Perfect Day (100%) - Premium emerald green
               bgClass = 'bg-[#16A34A] border-none text-white font-bold shadow-[0_0_12px_rgba(22,163,74,0.4)] hover:shadow-[0_0_16px_rgba(22,163,74,0.6)] z-20 hover:scale-[1.05]';
             } else if (percentage >= 76) {
               // 76-99% Completion - Fresh green
               bgClass = 'bg-[#4ADE80] border-none text-[#022c22] font-semibold z-10 hover:scale-[1.05]';
             } else if (percentage >= 51) {
               // 51-75% Completion - Soft orange
               bgClass = 'bg-[#FB923C] border-none text-[#431407] font-medium z-10 hover:scale-[1.05]';
             } else if (percentage >= 26) {
               // 26-50% Completion - Rich amber
               bgClass = 'bg-[#F59E0B] border-none text-[#451a03] font-medium z-10 hover:scale-[1.05]';
             } else if (percentage > 0) {
               // 1-25% Completion - Warm yellow
               bgClass = 'bg-[#FBBF24] border-none text-[#451a03] font-medium z-10 hover:scale-[1.05]';
             } else if (isToday || day.isAfter(dayjs(), 'day')) {
               // Not passed yet (Pending / no progress today or future)
               bgClass = 'bg-transparent border border-app-border/50 border-dashed text-app-text-s/50 hover:border-app-border hover:scale-[1.05]';
             } else {
               // 0% strictly for missed/passed days - Red
               bgClass = 'bg-[#EF4444] border-none text-white font-bold z-10 hover:scale-[1.05] shadow-[0_0_8px_rgba(239,68,68,0.25)]';
             }
           }
           
           const isPartOfStreak = currentStreakDates.has(day.format('YYYY-MM-DD'));
           
           return (
             <div 
               key={day.format('YYYY-MM-DD')} 
               className={`aspect-square rounded-[8px] flex flex-col items-center justify-center relative transition-all duration-300 cursor-pointer w-full h-full ${bgClass} ${isPartOfStreak ? 'ring-1 ring-[#16A34A]/80 ring-offset-1 ring-offset-app-surface z-20 shadow-[0_0_8px_rgba(22,163,74,0.25)]' : (isToday ? 'z-30' : '')}`}
               title={`${day.format('MMM D, YYYY')}: ${status === 'NONE' ? 'No tasks' : percentage + '% Complete'}`}
             >
                {isToday && (
                  <div className="absolute inset-0 overflow-hidden rounded-[8px] pointer-events-none z-0">
                    <div className="absolute top-0 bottom-0 left-0 w-[80%] bg-gradient-to-r from-transparent via-white/50 to-transparent animate-sweep" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/40 rounded-[8px]" />
                  </div>
                )}
                <span className={`text-[10px] font-mono flex items-center justify-center w-full h-full text-center relative z-10`}>
                  {day.format('D')}
                </span>
                {/* Optional subtle indicator for 100% or streak record */}
                {isPartOfStreak && percentage === 100 && !isToday && <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-white/60 animate-pulse drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]" />}
             </div>
           );
         })}
      </div>
    </div>
  );
}