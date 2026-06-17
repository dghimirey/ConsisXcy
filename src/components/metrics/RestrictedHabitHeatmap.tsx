import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { fetchRestrictedTasks, fetchRestrictedCompletions } from '../../services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getRestrictedDayCompletionStatus } from '../../lib/consistency';

export function RestrictedHabitHeatmap() {
  const [monthOffset, setMonthOffset] = useState(0);
  const { data: tasks = [] } = useQuery({ queryKey: ['restrictedTasks'], queryFn: fetchRestrictedTasks });
  const { data: completions = [] } = useQuery({ queryKey: ['restrictedCompletions'], queryFn: fetchRestrictedCompletions });

  const currentMonth = dayjs().add(monthOffset, 'month').startOf('month');
  const daysInMonth = currentMonth.daysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) => currentMonth.add(i, 'day'));
  
  const startDay = currentMonth.day(); // 0 (Sun) to 6 (Sat)
  const prefixDays = Array(startDay).fill(null);

  const getDayStatus = (date: dayjs.Dayjs) => {
    return getRestrictedDayCompletionStatus(date.format('YYYY-MM-DD'), tasks, completions);
  };

  const currentStreakDates = new Set<string>();
  if (tasks.length > 0) {
    let d = dayjs().subtract(1, 'day');
    while (true) {
      const res = getDayStatus(d);
      if (res.status === 'ALL_AVOIDED' && res.totalTasks > 0) {
        currentStreakDates.add(d.format('YYYY-MM-DD'));
        d = d.subtract(1, 'day');
      } else if (res.status === 'PENDING' || res.status === 'NONE') {
        d = d.subtract(1, 'day');
      } else {
        break;
      }
      if (dayjs().diff(d, 'day') > 1000) break;
    }
    if (getDayStatus(dayjs()).status === 'ALL_AVOIDED' && getDayStatus(dayjs()).totalTasks > 0) {
       currentStreakDates.add(dayjs().format('YYYY-MM-DD'));
    }
  }

  return (
    <div className="bg-app-surface border border-app-border p-4 md:p-6 rounded-2xl w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[11px] uppercase tracking-wider text-app-text-s font-mono">Restricted Tasks (Monthly)</h3>
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
           const isToday = day.isSame(dayjs(), 'day');
           const percentage = result.percentage;
           
           let bgClass = 'bg-[#1a1a1a] border border-[#2a2a2a] text-app-text-s/30 z-10 hover:bg-[#222222] hover:scale-[1.05]'; // NONE
           
           if (status !== 'NONE') {
             if (status === 'ALL_AVOIDED') {
               bgClass = 'bg-[#16A34A] border-none text-white font-bold shadow-[0_0_12px_rgba(22,163,74,0.4)] hover:shadow-[0_0_16px_rgba(22,163,74,0.6)] z-20 hover:scale-[1.05]';
             } else if (status === 'SOME_AVOIDED' && result.failedTasks === 0) {
               // partial avoid, no fails yet
               bgClass = 'bg-[#FBBF24] border-none text-[#451a03] font-medium z-10 hover:scale-[1.05]';
             } else if (status === 'FAILED_SOME') {
               // Red for any failures
               bgClass = 'bg-[#EF4444] border-none text-white font-bold z-10 hover:scale-[1.05] shadow-[0_0_8px_rgba(239,68,68,0.25)]';
             } else if (status === 'PENDING') {
               // Not passed yet (Pending / no progress today or future)
               bgClass = 'bg-transparent border border-app-border/50 border-dashed text-app-text-s/50 hover:border-app-border hover:scale-[1.05]';
             }
           }
           
           const isPartOfStreak = currentStreakDates.has(day.format('YYYY-MM-DD'));
           
           return (
             <div 
               key={day.format('YYYY-MM-DD')} 
               className={`aspect-square rounded-[8px] flex flex-col items-center justify-center relative transition-all duration-300 cursor-pointer w-full h-full ${bgClass} ${isPartOfStreak ? 'ring-1 ring-[#16A34A]/80 ring-offset-1 ring-offset-app-surface z-20 shadow-[0_0_8px_rgba(22,163,74,0.25)]' : (isToday ? 'z-30' : '')}`}
               title={`${day.format('MMM D, YYYY')}: ${status === 'NONE' ? 'No tasks' : (status === 'PENDING' ? 'Pending' : (status === 'ALL_AVOIDED' ? 'Successfully Avoided All' : (status === 'FAILED_SOME' ? 'Failed' : 'Partially Avoided')))}`}
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
                {isPartOfStreak && status === 'ALL_AVOIDED' && !isToday && <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-white/60 animate-pulse drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]" />}
             </div>
           );
         })}
      </div>
    </div>
  );
}
