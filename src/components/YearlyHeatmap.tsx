import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { fetchCompletions, fetchRoutines } from '../services/api';

export function YearlyHeatmap({ category = 'All' }: { category?: string }) {
  const { data: completions = [] } = useQuery({ queryKey: ['completions'], queryFn: fetchCompletions });
  const { data: routines = [] } = useQuery({ queryKey: ['routines'], queryFn: fetchRoutines });

  const startDate = dayjs().startOf('day');
  const endDate = startDate.add(364, 'day');
  
  const days = Array.from({ length: 365 }, (_, i) => startDate.add(i, 'day'));
  
  const getDayStatus = (date: dayjs.Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');

    let filteredCompletions = completions;

    if (category !== 'All') {
      const routineIdsInCategory = routines.filter(r => r.category === category).map(r => r.id);
      filteredCompletions = completions.filter(c => routineIdsInCategory.includes(c.routineId));
    }

    const dayCompletions = filteredCompletions.filter((c: any) => {
      const cDateStr = typeof c.date === 'string' ? c.date.substring(0, 10) : new Date(c.date).toISOString().substring(0, 10);
      return cDateStr === dateStr;
    });
    
    if (!dayCompletions.length) return 'NONE';
    
    const hasCompleted = dayCompletions.some((c: any) => c.status === 'COMPLETED');
    const hasMissed = dayCompletions.some((c: any) => c.status === 'MISSED');
    
    if (hasCompleted) return 'ACHIEVED';
    if (hasMissed) return 'MISSED';
    return 'NONE';
  };

  return (
    <div className="bg-app-surface border border-app-border p-4 md:p-6 rounded-2xl w-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[11px] uppercase tracking-wider text-app-text-s font-mono">Yearly Consistency</h3>
        <span className="text-[11px] uppercase tracking-wider text-app-text-s font-mono text-right">
            {startDate.format('MMM YYYY')} - {endDate.format('MMM YYYY')}
        </span>
      </div>
      
      <div className="w-full overflow-x-auto hide-scrollbar">
        <div className="flex gap-[3px] min-w-max pb-2">
          {Array.from({ length: 53 }).map((_, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[3px]">
                {days.slice(weekIdx * 7, (weekIdx + 1) * 7).map(day => {
                    const status = getDayStatus(day);
                    let colorClass = 'bg-app-border';
                    if (status === 'ACHIEVED') colorClass = 'bg-[#c0ff00]';
                    else if (status === 'MISSED') colorClass = 'bg-[#ef4444] opacity-80';
                    
                    return (
                        <div 
                            key={day.format('YYYY-MM-DD')} 
                            className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-[1px] hover:scale-125 transition-transform ${colorClass}`} 
                            title={`${day.format('MMM D, YYYY')}: ${status}`}
                        />
                    )
                })}
            </div>
        ))}
        </div>
      </div>
    </div>
  );
}
