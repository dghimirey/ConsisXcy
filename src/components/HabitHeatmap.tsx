import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { fetchCompletions, fetchRoutines, fetchCategories } from '../services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDayCompletionStatus } from '../lib/consistency';

export function HabitHeatmap({ category = 'All' }: { category?: string }) {
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
    return getDayCompletionStatus(date.format('YYYY-MM-DD'), routines, categories, completions, category);
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
           const result = getDayStatus(day);
           const status = result.status;
           const percentage = result.percentage;
           
           let bgClass = 'bg-app-border/30 hover:bg-app-border/50'; // NONE
           
           if (status !== 'NONE') {
             if (percentage === 100) {
               // Deep green for full accomplishment
               bgClass = 'bg-gradient-to-br from-[#00C853] to-[#00E676] border border-[#69F0AE]/70 shadow-[0_0_12px_rgba(0,200,83,0.6),inset_0_1px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(0,200,83,0.8)] z-20';
             } else if (percentage >= 75) {
               // Light green / bright green
               bgClass = 'bg-gradient-to-br from-[#7CB342] to-[#8BC34A] border border-[#AED581]/60 shadow-[0_0_8px_rgba(139,195,74,0.5)] hover:shadow-[0_0_14px_rgba(139,195,74,0.7)] z-10';
             } else if (percentage >= 50) {
               // Yellowish / amber (motivating transition)
               bgClass = 'bg-gradient-to-br from-[#FFB300] to-[#FFC107] border border-[#FFD54F]/60 shadow-[0_0_8px_rgba(255,193,7,0.5)] hover:shadow-[0_0_14px_rgba(255,193,7,0.7)] z-10';
             } else if (percentage > 0) {
               // Orange / deep orange (warning but still progress)
               bgClass = 'bg-gradient-to-br from-[#FF6F00] to-[#FF9800] border border-[#FFB74D]/60 shadow-[0_0_6px_rgba(255,152,0,0.45)] hover:shadow-[0_0_12px_rgba(255,152,0,0.65)] z-10';
             } else {
               // Red for 0% (danger / no progress)
               bgClass = 'bg-gradient-to-br from-[#C62828] to-[#D32F2F] border border-[#EF9A9A]/50 shadow-[0_0_5px_rgba(211,47,47,0.4)] hover:shadow-[0_0_10px_rgba(211,47,47,0.6)] z-10';
             }
           }
           
           const isToday = day.isSame(dayjs(), 'day');

           return (
             <div 
               key={day.format('YYYY-MM-DD')} 
               className={`aspect-square rounded-md flex flex-col items-center justify-center relative hover:scale-[1.15] transition-all duration-300 cursor-pointer ${bgClass} ${isToday && status === 'NONE' ? 'ring-1 ring-app-accent/50' : ''}`}
               title={`${day.format('MMM D, YYYY')}: ${status === 'NONE' ? 'No tasks' : percentage + '% Complete'}`}
             >
                <span className={`text-[10px] font-mono flex items-center justify-center w-full h-full ${status === 'NONE' ? 'text-app-text-s' : 'text-white font-medium drop-shadow-md'}`}>
                  {day.format('D')}
                </span>
                {isToday && <div className={`absolute bottom-0.5 w-[3px] h-[3px] rounded-full ${status === 'NONE' ? 'bg-app-accent' : 'bg-white drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]'}`}/>}
             </div>
           );
         })}
      </div>
    </div>
  );
}