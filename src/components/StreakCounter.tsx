import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Flame, Trophy, Clock, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { getMilestone } from '../lib/consistency';
import dayjs from 'dayjs';

export function StreakCounter({ currentStreak, longestStreak, isAtRisk, todayCompleted, todayPercentage }: { currentStreak: number, longestStreak: number, isAtRisk: boolean, todayCompleted: boolean, todayPercentage: number }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (todayCompleted) return;
    
    const calculateTimeLeft = () => {
      const now = dayjs();
      const endOfDay = now.endOf('day');
      const diffStr = endOfDay.diff(now, 'second');
      if (diffStr <= 0) return '00:00:00';
      
      const h = Math.floor(diffStr / 3600);
      const m = Math.floor((diffStr % 3600) / 60);
      
      return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m left`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // update every minute

    return () => clearInterval(interval);
  }, [todayCompleted]);

  return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-8 md:mb-10">
        <div className="bg-app-glass border border-app-border rounded-[20px] p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-hidden relative group hover:border-app-text-s/30 transition-colors">
          <div className="flex flex-col gap-2 mb-2 relative z-10 w-full">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-app-accent shrink-0" />
              <h3 className="text-[10px] sm:text-xs uppercase tracking-wider text-app-text-s font-mono font-medium truncate">Current Streak</h3>
            </div>
            
            {todayCompleted ? (
               <div className="flex flex-col gap-1 mt-1">
                 <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit">
                   <CheckCircle2 className="w-3.5 h-3.5" />
                   <span className="text-[10px] sm:text-xs font-mono font-medium tracking-wide">Goal Completed</span>
                 </div>
                 <span className="text-[10px] text-app-text-s font-mono pl-1 mt-1">Tomorrow: {currentStreak + 1} Day Streak</span>
               </div>
            ) : isAtRisk ? (
               <div className="flex flex-col gap-1 mt-1">
                 <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 w-fit">
                   <AlertTriangle className="w-3.5 h-3.5" />
                   <span className="text-[10px] sm:text-xs font-mono font-medium tracking-wide">Today's Goal: {todayPercentage}%</span>
                 </div>
                 <span className="text-[10px] text-app-text-s font-mono pl-1 mt-1">{timeLeft}</span>
               </div>
            ) : (
               <div className="flex flex-col gap-1 mt-1">
                 <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-app-surface/50 border border-app-border text-app-text-s w-fit">
                   <AlertCircle className="w-3.5 h-3.5" />
                   <span className="text-[10px] sm:text-xs font-mono font-medium tracking-wide">Today's Goal: {todayPercentage}%</span>
                 </div>
                 {todayPercentage === 0 && <span className="text-[10px] text-app-text-s font-mono pl-1 mt-1 font-medium text-white/50">Rest day / No tasks</span>}
                 {todayPercentage > 0 && <span className="text-[10px] text-app-text-s font-mono pl-1 mt-1">{timeLeft}</span>}
               </div>
            )}
          </div>

          
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 lg:gap-6 relative z-10 mt-2">
            <motion.p 
              key={`current-text-${currentStreak}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white tracking-tight flex items-baseline gap-1.5 sm:gap-2">
              {currentStreak} <span className="text-xs sm:text-sm font-mono text-app-text-s tracking-normal font-normal">days</span>
            </motion.p>
              {currentStreak > 0 && (() => {
               const milestone = getMilestone(currentStreak);
               const progress = Math.min(100, (currentStreak / milestone.target) * 100);
               const daysAway = milestone.target - currentStreak;
               let encouragingMessage = '';
               if (daysAway === 1) encouragingMessage = `Only 1 day away from a ${milestone.target}-day streak!`;
               else if (longestStreak > 0 && currentStreak === longestStreak) encouragingMessage = "New personal best coming soon!";
               else if (currentStreak > 3 && currentStreak % 3 === 0) encouragingMessage = "Don't break the chain!";

               return (
                  <motion.div 
                      key={`current-badge-${currentStreak}`}
                      initial={{ scale: 0.9, x: -10, opacity: 0 }}
                      animate={{ scale: 1, x: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={`mb-1 sm:mb-2 flex flex-col gap-1.5 ${milestone.textColor}`}>
                      <div className="flex items-center gap-1.5 text-xs font-mono tracking-wide">
                          <span>{milestone.icon}</span> 
                          {milestone.name && <span className="font-semibold">{milestone.name} Goal</span>}
                      </div>
                      <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                              <div className="w-16 sm:w-24 border border-app-border h-1.5 sm:h-2 bg-black/30 rounded-full overflow-hidden">
                                  <div className={`h-full ${milestone.barColor}`} style={{ width: `${progress}%` }} />
                              </div>
                               <span className="text-[10px] sm:text-xs font-mono opacity-70">{currentStreak}/{milestone.target}</span>
                          </div>
                          {encouragingMessage && <span className="text-[9px] sm:text-[10px] opacity-60 font-mono italic mt-0.5">{encouragingMessage}</span>}
                      </div>
                  </motion.div>
               );
            })()}
          </div>
          <div className="absolute -bottom-6 -right-6 sm:-bottom-10 sm:-right-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none">
             <Flame className="w-24 h-24 sm:w-48 sm:h-48" />
          </div>
        </div>

        <div className="bg-app-glass border border-app-border rounded-[20px] p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-hidden relative group hover:border-app-text-s/30 transition-colors">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 relative z-10 w-full h-[52px] sm:h-[60px] items-start">
             <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
            <h3 className="text-[10px] sm:text-xs uppercase tracking-wider text-app-text-s font-mono font-medium truncate mt-0.5 sm:mt-1">Longest Streak</h3>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 lg:gap-6 relative z-10 mt-2">
            <motion.p 
              key={`longest-text-${longestStreak}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white tracking-tight flex items-baseline gap-1.5 sm:gap-2">
              {longestStreak} <span className="text-xs sm:text-sm font-mono text-app-text-s tracking-normal font-normal">days</span>
            </motion.p>
            {longestStreak > 0 && (() => {
               const milestone = getMilestone(longestStreak);
               return (
                  <motion.div 
                      key={`longest-badge-${longestStreak}`}
                      initial={{ scale: 0.9, x: -10, opacity: 0 }}
                      animate={{ scale: 1, x: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={`mb-1 sm:mb-2 flex items-center gap-1.5 px-2 py-1 rounded-md border ${milestone.badgeColor} text-xs font-mono tracking-wide w-fit`}>
                      <span>{milestone.icon}</span> 
                      {milestone.name && <span className="font-semibold">{milestone.name} Achieved</span>}
                      {!milestone.name && <span className="font-semibold">Started</span>}
                  </motion.div>
               );
            })()}
          </div>
          <div className="absolute -bottom-6 -right-6 sm:-bottom-10 sm:-right-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none">
             <Trophy className="w-24 h-24 sm:w-48 sm:h-48" />
          </div>
        </div>
      </div>
  );
}
