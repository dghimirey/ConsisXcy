import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { fetchCompletions, fetchRoutines, fetchCategories } from '../../services/api';
import { getDayCompletionStatus } from '../../lib/consistency';
import { useMemo, useRef, useEffect } from 'react';

export function YearlyConsistency({ section = 'All' }: { section?: string }) {
  const { data: completions = [] } = useQuery({ queryKey: ['completions'], queryFn: fetchCompletions });
  const { data: routines = [] } = useQuery({ queryKey: ['routines'], queryFn: fetchRoutines });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { daysGrid, monthLabels } = useMemo(() => {
    // Generate exactly 365 days up to today
    const days: { date: dayjs.Dayjs, result: any }[] = [];
    const today = dayjs();
    for (let i = 364; i >= 0; i--) {
        const d = today.subtract(i, 'day');
        const dateStr = d.format('YYYY-MM-DD');
        const result = getDayCompletionStatus(dateStr, routines, categories, completions, section);
        days.push({ date: d, result });
    }

    // A standard GitHub-like heatmap is column based (each column is a week).
    // The first day in the grid might not be a Sunday. We need to pad the first column.
    const firstDay = days[0].date;
    const startOffset = firstDay.day(); // 0 is Sunday, 6 is Saturday

    // Pad prefix so the grid starts on a Sunday in the first column
    const grid: ({ date: dayjs.Dayjs | null, result: any | null })[] = [];
    for (let i = 0; i < startOffset; i++) {
        grid.push({ date: null, result: null });
    }
    grid.push(...days);

    // Calculate month labels positions (which column they start)
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
  }, [routines, categories, completions, section]);

  // Weeks are columns
  const numWeeks = Math.ceil(daysGrid.length / 7);
  const weeks = Array.from({ length: numWeeks }, (_, i) => daysGrid.slice(i * 7, i * 7 + 7));

  // Auto-scroll to the end of the heatmap (today)
  useEffect(() => {
    if (scrollContainerRef.current) {
       scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [daysGrid]);

  return (
    <div className="bg-app-surface border border-app-border p-4 md:p-6 rounded-2xl w-full">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div>
          <h3 className="text-[11px] uppercase tracking-wider text-app-text-s font-mono mb-1">Yearly Consistency</h3>
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
                {/* Leave space for left day-labels */}
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
                           const percentage = result.percentage;
                           const isToday = date.isSame(dayjs(), 'day');

                           let bgClass = 'bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] hover:scale-110 hover:z-20 transition-all'; // NONE
                           
                           if (status !== 'NONE') {
                               if (percentage === 100) {
                                   bgClass = 'bg-[#16A34A] border-none shadow-[0_0_8px_rgba(22,163,74,0.3)] hover:shadow-[0_0_12px_rgba(22,163,74,0.5)] z-10 hover:scale-110 hover:z-20 transition-all';
                               } else if (percentage >= 76) {
                                   bgClass = 'bg-[#4ADE80] border-none hover:scale-110 hover:z-20 transition-all z-10';
                               } else if (percentage >= 51) {
                                   bgClass = 'bg-[#FB923C] border-none hover:scale-110 hover:z-20 transition-all z-10';
                               } else if (percentage >= 26) {
                                   bgClass = 'bg-[#F59E0B] border-none hover:scale-110 hover:z-20 transition-all z-10';
                               } else if (percentage > 0) {
                                   bgClass = 'bg-[#FBBF24] border-none hover:scale-110 hover:z-20 transition-all z-10';
                               } else if (isToday || date.isAfter(dayjs(), 'day')) {
                                   bgClass = 'bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] hover:scale-110 hover:z-20 transition-all';
                               } else {
                                   bgClass = 'bg-[#EF4444] border-none shadow-[0_0_6px_rgba(239,68,68,0.2)] hover:scale-110 hover:z-20 transition-all z-10';
                               }
                           }

                           return (
                              <div
                                 key={date.format('YYYY-MM-DD')}
                                 title={`${date.format('MMM D, YYYY')}: ${status === 'NONE' ? 'No tasks' : percentage + '% Complete'}`}
                                 className={`w-[12px] h-[12px] rounded-[3px] transition-all duration-300 cursor-pointer relative ${bgClass} ${isToday ? 'z-30' : ''}`}
                              >
                                {isToday && (
                                  <div className="absolute inset-0 overflow-hidden rounded-[3px] pointer-events-none z-0">
                                    <div className="absolute top-0 bottom-0 left-0 w-[150%] bg-gradient-to-r from-transparent via-white/60 to-transparent animate-sweep" />
                                    <div className="absolute inset-0 ring-1 ring-inset ring-white/50 rounded-[3px]" />
                                  </div>
                                )}
                              </div>
                           );
                        })}
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-app-text-s font-mono opacity-80">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-[2px] bg-[#1a1a1a] border border-[#2a2a2a] shrink-0" title="No tasks" />
          <div className="w-3 h-3 rounded-[2px] bg-[#EF4444] shrink-0" title="0% (Missed)" />
          <div className="w-3 h-3 rounded-[2px] bg-[#FBBF24] shrink-0" title="1-25%" />
          <div className="w-3 h-3 rounded-[2px] bg-[#F59E0B] shrink-0" title="26-50%" />
          <div className="w-3 h-3 rounded-[2px] bg-[#FB923C] shrink-0" title="51-75%" />
          <div className="w-3 h-3 rounded-[2px] bg-[#4ADE80] shrink-0" title="76-99%" />
          <div className="w-3 h-3 rounded-[2px] bg-[#16A34A] shrink-0" title="100%" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
