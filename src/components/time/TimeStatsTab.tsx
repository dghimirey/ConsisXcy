import React from 'react';
import { usePomodoroStore } from '../../store/usePomodoroStore';
import { useFocusSessionStore } from '../../store/useFocusSessionStore';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, CheckCircle2, TrendingUp, Cherry } from 'lucide-react';

export function TimeStatsTab() {
  const { cyclesCompleted } = usePomodoroStore();
  const { sessions } = useFocusSessionStore();

  const completedSessions = sessions.filter(s => s.completed);
  
  // Calculate Time
  const now = new Date();
  const today = now.toLocaleDateString();
  
  const getStartOfWeek = (d: Date) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(date.setDate(diff)).toISOString().split('T')[0];
  };

  const currentWeekStart = getStartOfWeek(now);
  const currentMonthDate = now.toISOString().substring(0, 7); // YYYY-MM

  let timeToday = 0;
  let timeWeek = 0;
  let timeMonth = 0;

  completedSessions.forEach(s => {
      const sDateObj = new Date(s.date);
      const sDateStr = sDateObj.toLocaleDateString();
      const sISOStr = sDateObj.toISOString().split('T')[0];
      const sMonthStr = sDateObj.toISOString().substring(0, 7);

      if (sDateStr === today) timeToday += s.duration;
      
      const sWeekStart = getStartOfWeek(sDateObj);
      if (sWeekStart === currentWeekStart) timeWeek += s.duration;
      
      if (sMonthStr === currentMonthDate) timeMonth += s.duration;
  });

  const avgDuration = completedSessions.length > 0 
      ? Math.round((completedSessions.reduce((acc, s) => acc + s.duration, 0) / completedSessions.length) / 60000) 
      : 0;

  // Chart data: Focus time per day for the last 7 days
  const last7Days = Array.from({length: 7}).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString();
  });

  const chartData = last7Days.map(dateStr => {
      const dayTotal = completedSessions
          .filter(s => new Date(s.date).toLocaleDateString() === dateStr)
          .reduce((acc, s) => acc + s.duration, 0);
      
      const shortDate = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
      return {
          name: shortDate,
          minutes: Math.round(dayTotal / 60000)
      };
  });

  // Subject distribution
  const subjectTotals = completedSessions.reduce((acc, s) => {
      const sub = s.subject || 'Uncategorized';
      if (!acc[sub]) acc[sub] = 0;
      acc[sub] += s.duration;
      return acc;
  }, {} as Record<string, number>);

  const sortedSubjects = Object.entries(subjectTotals)
      .sort((a,b) => b[1] - a[1])
      .map(([name, ms]) => ({ name, minutes: Math.round(ms / 60000) }));

  return (
    <div className="w-full flex flex-col gap-6">
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-app-glass border border-app-border rounded-[20px] p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-app-text-s">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs uppercase font-mono tracking-wider">Today</span>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">{Math.round(timeToday / 60000)} <span className="text-sm font-normal text-app-text-s">min</span></div>
          </div>
          <div className="bg-app-glass border border-app-border rounded-[20px] p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-app-text-s">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs uppercase font-mono tracking-wider">This Week</span>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">{Math.round(timeWeek / 60000)} <span className="text-sm font-normal text-app-text-s">min</span></div>
          </div>
          <div className="bg-app-glass border border-app-border rounded-[20px] p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-app-text-s">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs uppercase font-mono tracking-wider">Total</span>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">{completedSessions.length} <span className="text-sm font-normal text-app-text-s">sess</span></div>
          </div>
          <div className="bg-app-glass border border-app-border rounded-[20px] p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-app-text-s">
                  <Cherry className="w-4 h-4" />
                  <span className="text-xs uppercase font-mono tracking-wider">Pomodoros</span>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">{cyclesCompleted} <span className="text-sm font-normal text-app-text-s">cycles</span></div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-app-glass border border-app-border rounded-[24px] p-6">
             <h3 className="text-sm font-mono text-app-text-s uppercase tracking-wider mb-6">Focus Activity (Last 7 Days)</h3>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                           cursor={{fill: 'rgba(255,255,255,0.05)'}}
                           contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                           itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="minutes" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-app-glass border border-app-border rounded-[24px] p-6 flex flex-col">
             <h3 className="text-sm font-mono text-app-text-s uppercase tracking-wider mb-6">Top Subjects</h3>
             <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
                 {sortedSubjects.length === 0 && (
                     <div className="text-app-text-s text-sm my-auto text-center font-mono">No data yet.</div>
                 )}
                 {sortedSubjects.map(sub => (
                     <div key={sub.name} className="flex flex-col gap-1.5">
                         <div className="flex items-center justify-between text-sm">
                             <span className="text-zinc-200 truncate">{sub.name}</span>
                             <span className="text-app-text-p font-mono">{sub.minutes}m</span>
                         </div>
                         <div className="w-full h-1.5 bg-app-surface border border-app-border rounded-full overflow-hidden">
                             <div className="h-full bg-app-accent" style={{ width: `${Math.min(100, (sub.minutes / sortedSubjects[0].minutes) * 100)}%` }}></div>
                         </div>
                     </div>
                 ))}
             </div>
          </div>
      </div>

    </div>
  );
}
