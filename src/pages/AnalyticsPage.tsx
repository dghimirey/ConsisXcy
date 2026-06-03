import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Flame } from 'lucide-react';
import { fetchCompletions, fetchStreaks, fetchRoutines } from '../services/api';

export default function AnalyticsPage() {
  const { data: completions = [] } = useQuery({ queryKey: ['completions'], queryFn: fetchCompletions });
  const { data: streaks = [] } = useQuery({ queryKey: ['streaks'], queryFn: fetchStreaks });
  const { data: routines = [] } = useQuery({ queryKey: ['routines'], queryFn: fetchRoutines });

  // Compute heatmap data (last 365 days)
  const today = new Date();
  const startDate = subDays(today, 364);
  const days = eachDayOfInterval({ start: startDate, end: today });

  const getDayScore = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayCompletions = completions.filter(c => new Date(c.date).toISOString().split('T')[0] === dateStr);
    if (!dayCompletions.length) return 0;
    
    const score = dayCompletions.reduce((acc, c) => acc + (c.status === 'COMPLETED' ? 1 : c.status === 'PARTIAL' ? 0.5 : 0), 0);
    return score / (routines.length || 1); // rough normalized score
  };

  const longestStreak = Math.max(...streaks.map(s => s.longestStreak), 0);
  const totalCompleted = streaks.reduce((acc, s) => acc + s.totalCompletedDays, 0);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8 md:mb-10">
        <h1 className="text-3xl font-display font-bold tracking-tight text-white mb-1">Analytics</h1>
        <p className="text-app-text-s">Track your consistency and growth</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-12">
        <div className="bg-app-glass border border-app-border p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-app-accent/10 flex items-center justify-center">
                <Flame className="w-6 h-6 text-app-accent" />
            </div>
            <div>
                <p className="text-app-text-s text-[11px] uppercase tracking-wider font-mono">Longest Streak</p>
                <p className="text-3xl font-display font-bold text-white leading-none mt-1">{longestStreak} <span className="text-sm font-mono text-app-text-s font-normal">days</span></p>
            </div>
        </div>
        <div className="bg-app-glass border border-app-border p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-app-accent/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-app-accent" />
            </div>
            <div>
                <p className="text-app-text-s text-[11px] uppercase tracking-wider font-mono">Total Completed</p>
                <p className="text-3xl font-display font-bold text-white leading-none mt-1">{totalCompleted} <span className="text-sm font-mono text-app-text-s font-normal">routines</span></p>
            </div>
        </div>
      </div>

      {/* GitHub Style Heatmap */}
      <div className="bg-app-surface border border-app-border p-6 rounded-2xl mb-8 overflow-x-auto">
        <h3 className="text-[11px] uppercase tracking-wider text-app-text-s mb-6 font-mono">Consistency Map</h3>
        <div className="flex gap-[3px] min-w-max">
            {/* Split days into weeks for typical heatmap render */}
            {Array.from({ length: 52 }).map((_, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[3px]">
                    {days.slice(weekIdx * 7, (weekIdx + 1) * 7).map(day => {
                        const score = getDayScore(day);
                        let colorClass = 'bg-app-border';
                        if (score > 0.8) colorClass = 'bg-app-accent';
                        else if (score > 0.5) colorClass = 'bg-[#99cc00] opacity-80'; // approximations
                        else if (score > 0.2) colorClass = 'bg-[#99cc00] opacity-50';
                        else if (score > 0) colorClass = 'bg-[#99cc00] opacity-20'; // Partial feel
                        
                        return (
                            <div 
                                key={day.toISOString()} 
                                className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-[1px] ${colorClass}`} 
                                title={`${format(day, 'MMM do, yyyy')}: ${(score*100).toFixed(0)}%`}
                            />
                        )
                    })}
                </div>
            ))}
        </div>
      </div>

      <div className="h-64 bg-app-surface border border-app-border p-6 rounded-2xl">
        <h3 className="text-[11px] uppercase tracking-wider text-app-text-s mb-4 font-mono">Weekly Progress</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={streaks.map(s => ({ name: routines.find(r => r.id === s.routineId)?.name?.substring(0, 5) || 'Unknown', completions: s.totalCompletedDays }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.03)'}} 
                contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                itemStyle={{ color: '#c0ff00' }}
            />
            <Bar dataKey="completions" fill="#c0ff00" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
