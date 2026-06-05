import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { fetchCompletions, fetchRoutines } from '../services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function HabitHeatmap({ category = 'All' }: { category?: string }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const { data: completions = [] } = useQuery({ queryKey: ['completions'], queryFn: fetchCompletions });
  const { data: routines = [] } = useQuery({ queryKey: ['routines'], queryFn: fetchRoutines });

  const currentMonth = dayjs().add(monthOffset, 'month').startOf('month');
  const daysInMonth = currentMonth.daysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) => currentMonth.add(i, 'day'));
  
  const startDay = currentMonth.day(); // 0 (Sun) to 6 (Sat)
  const prefixDays = Array(startDay).fill(null);

  const getDayStatus = (date: dayjs.Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const todayStr = dayjs().format('YYYY-MM-DD');
    const isDayEnded = dateStr < todayStr;

    let filteredCompletions = completions.filter((c: any) => {
      const cDateStr = typeof c.date === 'string' ? c.date.substring(0, 10) : new Date(c.date).toISOString().substring(0, 10);
      return cDateStr === dateStr;
    });

    const expectedRoutines = routines.filter(r => {
      if (category !== 'All' && r.category !== category) return false;
      if (!r.isActive) return false;
      const createdDateStr = new Date(r.createdAt).toISOString().split('T')[0];
      return createdDateStr <= dateStr;
    });

    if (category !== 'All') {
      const routineIdsInCategory = routines.filter(r => r.category === category).map(r => r.id);
      filteredCompletions = filteredCompletions.filter(c => routineIdsInCategory.includes(c.routineId));
    }

    const expectedIds = new Set(expectedRoutines.map(r => r.id));
    filteredCompletions.forEach(c => expectedIds.add(c.routineId));
    const totalTasks = expectedIds.size;

    if (totalTasks === 0) return 'NONE';

    let completedTasks = 0;
    let explicitlyMissed = 0;

    expectedIds.forEach(id => {
      if (filteredCompletions.some(c => c.routineId === id && c.status === 'COMPLETED')) {
        completedTasks++;
      } else if (filteredCompletions.some(c => c.routineId === id && c.status === 'MISSED')) {
        explicitlyMissed++;
      }
    });

    if (completedTasks === totalTasks && totalTasks > 0) {
      return 'ALL';
    } else if (completedTasks > 0) {
      return 'SOME';
    } else {
      if (isDayEnded || (explicitlyMissed === totalTasks && totalTasks > 0)) {
        return 'MISSED';
      }
      return 'NONE';
    }
  };

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
           const status = getDayStatus(day);
           let bgClass = 'bg-app-border/50'; // NONE
           if (status === 'ALL') bgClass = 'bg-emerald-500';
           else if (status === 'SOME') bgClass = 'bg-amber-500';
           else if (status === 'MISSED') bgClass = 'bg-[#ef4444]';
           
           const isToday = day.isSame(dayjs(), 'day');

           return (
             <div 
               key={day.format('YYYY-MM-DD')} 
               className={`aspect-square rounded-md ${bgClass} flex flex-col items-center justify-center relative hover:scale-110 transition-transform cursor-pointer`}
               title={`${day.format('MMM D, YYYY')}: ${status === 'ALL' ? 'All tasks complete' : status === 'SOME' ? 'Some tasks complete' : status === 'MISSED' ? 'Missed' : 'No tasks'}`}
             >
                <span className={`text-[10px] font-mono ${status === 'NONE' ? 'text-app-text-s' : 'text-white font-bold'}`}>
                  {day.format('D')}
                </span>
                {isToday && <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${status === 'NONE' ? 'bg-app-text-s' : 'bg-white'}`}/>}
             </div>
           );
         })}
      </div>
    </div>
  );
}
