import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { fetchCompletions, fetchRoutines, fetchCategories } from '../../services/api';
import { getDayCompletionStatus } from '../../lib/consistency';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function WeeklyMetrics({ section = 'All' }: { section?: string }) {
  const { data: completions = [] } = useQuery({ queryKey: ['completions'], queryFn: fetchCompletions });
  const { data: routines = [] } = useQuery({ queryKey: ['routines'], queryFn: fetchRoutines });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const { chartData, averagePercentage } = useMemo(() => {
    const data = [];
    let totalPercentage = 0;
    let daysWithTasks = 0;
    const today = dayjs();
    for (let i = 6; i >= 0; i--) {
      const date = today.subtract(i, 'day');
      const dateStr = date.format('YYYY-MM-DD');
      const result = getDayCompletionStatus(dateStr, routines, categories, completions, section);
      
      data.push({
        date: date.format('ddd'), // Mon, Tue, Wed
        fullDate: date.format('MMMM D, YYYY'),
        percentage: result.percentage,
        isFuture: date.isAfter(dayjs(), 'day'),
        isEmpty: result.status === 'NONE' && result.percentage === 0
      });

      if (result.status !== 'NONE' || result.percentage > 0) {
        totalPercentage += result.percentage;
        daysWithTasks++;
      }
    }
    
    const avg = daysWithTasks > 0 ? Math.round(totalPercentage / daysWithTasks) : 0;
    
    return { chartData: data, averagePercentage: avg };
  }, [routines, categories, completions, section]);

  return (
    <div className="bg-app-surface border border-app-border p-4 md:p-6 rounded-2xl w-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-[11px] uppercase tracking-wider text-app-text-s font-mono mb-1">Last 7 Days</h3>
          <p className="text-2xl font-display font-bold text-white tracking-tight flex items-baseline gap-1.5 mt-1.5">
            {averagePercentage}% <span className="text-[10px] font-mono text-app-text-s tracking-normal font-normal">avg completion</span>
          </p>
        </div>
      </div>
      
      <div className="h-[120px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#8A8A8A', fontFamily: 'monospace' }} 
            />
            <Tooltip
              cursor={{ fill: '#333', opacity: 0.2 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#111] border border-app-border p-3 rounded-xl shadow-xl flex flex-col gap-1 z-50">
                      <span className="text-[10px] text-app-text-s font-mono uppercase tracking-wider">{data.fullDate}</span>
                      <span className="text-white font-medium text-sm">
                        {data.isEmpty ? 'No tasks scheduled' : `${data.percentage}% Completed`}
                      </span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="percentage" radius={[4, 4, 4, 4]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.percentage === 100 ? '#10B981' : entry.percentage > 0 ? '#10B98180' : '#2A2A2A'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
