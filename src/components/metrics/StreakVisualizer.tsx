import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { fetchCompletions, fetchRoutines, fetchCategories } from '../../services/api';
import { getDayCompletionStatus } from '../../lib/consistency';

export function StreakVisualizer() {
  const { data: completions = [] } = useQuery({ queryKey: ['completions'], queryFn: fetchCompletions });
  const { data: routines = [] } = useQuery({ queryKey: ['routines'], queryFn: fetchRoutines });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  // Compute the last 30 days
  const today = dayjs();
  const days: dayjs.Dayjs[] = [];
  for (let i = 29; i >= 0; i--) {
    days.push(today.subtract(i, 'day'));
  }

  // To make it a calendar grid, we need to pad the beginning with empty days to align with the first day's day-of-week
  const firstDay = days[0].day(); // 0 (Sun) to 6 (Sat)
  const prefixDays = Array(firstDay).fill(null);

  const getDayStatus = (date: dayjs.Dayjs) => {
    return getDayCompletionStatus(date.format('YYYY-MM-DD'), routines, categories, completions);
  };

  return (
    <div className="bg-app-surface border border-app-border p-4 md:p-6 rounded-2xl w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[11px] uppercase tracking-wider text-app-text-s font-mono">Last 30 Days Streak</h3>
      </div>
      
      <div className="grid grid-cols-7 gap-1.5 w-full">
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
          const isToday = day.isSame(today, 'day');
          
          let bgClass = 'bg-[#1a1a1a] border border-[#2a2a2a] text-app-text-s/30';
          let textColor = 'text-app-text-s/50';
          
          if (status !== 'NONE') {
            if (percentage === 100) {
              bgClass = 'bg-emerald-500 border border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
              textColor = 'text-white font-bold';
            } else if (percentage >= 50) {
              bgClass = 'bg-emerald-500/50 border border-emerald-500/50';
              textColor = 'text-emerald-50 font-medium';
            } else if (percentage > 0) {
              bgClass = 'bg-emerald-500/20 border border-emerald-500/20';
              textColor = 'text-emerald-100/70';
            } else if (isToday) {
              bgClass = 'bg-transparent border border-app-border/50 border-dashed';
              textColor = 'text-app-text-s/50';
            } else {
              bgClass = 'bg-rose-500/20 border border-rose-500/20';
              textColor = 'text-rose-200/50';
            }
          }

          return (
            <div 
              key={day.format('YYYY-MM-DD')} 
              className={`aspect-square rounded-[8px] flex items-center justify-center relative transition-all duration-300 ${bgClass} ${isToday ? 'ring-1 ring-white/50 ring-offset-1 ring-offset-app-surface' : ''}`}
              title={`${day.format('MMM D, YYYY')}: ${status === 'NONE' ? 'No scheduled tasks' : percentage + '% Complete'}`}
            >
               <span className={`text-[10px] font-mono flex items-center justify-center w-full h-full text-center relative z-10 ${textColor}`}>
                 {day.format('D')}
               </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
