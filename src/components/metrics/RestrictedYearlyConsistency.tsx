import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { fetchRestrictedTasks, fetchRestrictedCompletions } from '../../services/api';
import { getRestrictedDayCompletionStatus } from '../../lib/consistency';
import { useMemo, useRef, useEffect } from 'react';

export function RestrictedYearlyConsistency() {
  const { data: tasks = [] } = useQuery({ queryKey: ['restrictedTasks'], queryFn: fetchRestrictedTasks });
  const { data: completions = [] } = useQuery({ queryKey: ['restrictedCompletions'], queryFn: fetchRestrictedCompletions });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { daysGrid, monthLabels } = useMemo(() => {
    // Generate exactly 365 days up to today
    const days: { date: dayjs.Dayjs, result: any }[] = [];
    const today = dayjs();
    for (let i = 364; i >= 0; i--) {
        const d = today.subtract(i, 'day');
        const dateStr = d.format('YYYY-MM-DD');
        const result = getRestrictedDayCompletionStatus(dateStr, tasks, completions);
        days.push({ date: d, result });
    }

    // A standard GitHub-like heatmap is column based (each column is a week).
    const firstDay = days[0].date;
    const startOffset = firstDay.day(); // 0 is Sunday, 6 is Saturday

    const grid: ({ date: dayjs.Dayjs | null, result: any | null })[] = [];
    for (let i = 0; i < startOffset; i++) {
        grid.push({ date: null, result: null });
    }
    grid.push(...days);

    const labels: { label: string, colIndex: number }[] = [];
    let currentMonth = -1;
    let colIndex = 0;

    for (let i = 0; i < grid.length; i += 7) {
        const columnDays = grid.slice(i, i + 7);
        const dayInCol = columnDays.find(d => d.date);
        if (dayInCol && dayInCol.date) {
            const m = dayInCol.date.month();
            if (m !== currentMonth) {
                labels.push({ label: dayInCol.date.format('MMM'), colIndex });
                currentMonth = m;
            }
        }
        colIndex++;
    }

    return { daysGrid: grid, monthLabels: labels };
  }, [tasks, completions]);

  const numWeeks = Math.ceil(daysGrid.length / 7);
  const weeks = Array.from({ length: numWeeks }, (_, i) => daysGrid.slice(i * 7, i * 7 + 7));

  useEffect(() => {
    if (scrollContainerRef.current) {
       scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [daysGrid]);

  return (
    <div className="bg-app-surface border border-app-border p-4 md:p-6 rounded-2xl w-full">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div>
          <h3 className="text-[11px] uppercase tracking-wider text-app-text-s font-mono mb-1">Restricted Tasks (Yearly)</h3>
          <p className="text-white text-sm">Last 365 Days</p>
        </div>
      </div>
      
      <div 
         ref={scrollContainerRef}
         className="w-full overflow-x-auto pb-4 hide-scrollbar"
       >
         <div className="min-w-max">
            {/* Months Header */}
            <div className="flex text-[10px] text-app-text-s font-mono mb-2 h-4 relative">
                <div className="w-[30px] shrink-0"></div>
                <div className="flex-1 relative">
                  {monthLabels.map((lbl, idx) => (
                      <span 
                         key={`${lbl.label}-${idx}`} 
                         className="absolute top-0 z-10" 
                         style={{ left: `${lbl.colIndex * 15}px`, transform: 'translateX(2px)' }}
                      >
                          {lbl.label}
                      </span>
                  ))}
               </div>
            </div>

            <div className="flex gap-[3px]">
               {/* Days left labels */}
               <div className="relative text-[9px] text-app-text-s/70 font-mono pr-2 shrink-0 w-[30px]" style={{ height: '102px' }}>
                  <span className="absolute right-2" style={{ top: '15px', lineHeight: '12px' }}>Mon</span>
                  <span className="absolute right-2" style={{ top: '45px', lineHeight: '12px' }}>Wed</span>
                  <span className="absolute right-2" style={{ top: '75px', lineHeight: '12px' }}>Fri</span>
               </div>

               {/* Grid */}
               <div className="flex gap-[3px]">
                  {weeks.map((week, wIndex) => (
                     <div key={`week-${wIndex}`} className="flex flex-col gap-[3px]">
                        {week.map((dayItem, dIndex) => {
                           if (!dayItem.date) {
                              return <div key={`empty-${wIndex}-${dIndex}`} className="w-[12px] h-[12px]" />;
                           }

                           const date = dayItem.date;
                           const result = dayItem.result;
                           const status = result.status;
                           const isToday = date.isSame(dayjs(), 'day');

                           let bgClass = 'bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] hover:scale-110 hover:z-20 transition-all'; // NONE
                           
                           if (status !== 'NONE') {
                               if (status === 'ALL_AVOIDED') {
                                   bgClass = 'bg-[#16A34A] border-none shadow-[0_0_8px_rgba(22,163,74,0.3)] hover:shadow-[0_0_12px_rgba(22,163,74,0.5)] z-10 hover:scale-110 hover:z-20 transition-all';
                               } else if (status === 'FAILED_SOME') {
                                   bgClass = 'bg-[#EF4444] border-none shadow-[0_0_6px_rgba(239,68,68,0.2)] hover:scale-110 hover:z-20 transition-all z-10';
                               } else if (status === 'SOME_AVOIDED') {
                                   bgClass = 'bg-[#FBBF24] border-none hover:scale-110 hover:z-20 transition-all z-10';
                               } else if (status === 'PENDING') {
                                   bgClass = 'bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] border-dashed hover:scale-110 hover:z-20 transition-all';
                               }
                           }

                           return (
                              <div
                                 key={date.format('YYYY-MM-DD')}
                                 title={`${date.format('MMM D, YYYY')}: ${status === 'NONE' ? 'No tasks' : (status === 'PENDING' ? 'Pending' : (status === 'ALL_AVOIDED' ? 'Successfully Avoided' : 'Failed'))}`}
                                 className={`w-[12px] h-[12px] rounded-[3px] transition-all duration-300 cursor-pointer relative ${bgClass} ${isToday ? 'ring-1 ring-white/50 ring-offset-1 ring-offset-app-surface z-20' : ''}`}
                              />
                           );
                        })}
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
