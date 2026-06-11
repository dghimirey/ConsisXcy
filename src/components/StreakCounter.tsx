import { motion } from 'motion/react';
import { Flame, Trophy } from 'lucide-react';
import { getMilestone } from '../lib/consistency';

export function StreakCounter({ currentStreak, longestStreak }: { currentStreak: number, longestStreak: number }) {
  return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-8 md:mb-10">
        <div className="bg-app-glass border border-app-border rounded-[20px] p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-hidden relative group hover:border-app-text-s/30 transition-colors">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 relative z-10">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-app-accent shrink-0" />
            <h3 className="text-[10px] sm:text-xs uppercase tracking-wider text-app-text-s font-mono font-medium truncate">Current Streak</h3>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 lg:gap-6 relative z-10">
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
                      <div className="flex items-center gap-2">
                          <div className="w-16 sm:w-24 border border-app-border h-1.5 sm:h-2 bg-black/30 rounded-full overflow-hidden">
                              <div className={`h-full ${milestone.barColor}`} style={{ width: `${progress}%` }} />
                          </div>
                           <span className="text-[10px] sm:text-xs font-mono opacity-70">{currentStreak}/{milestone.target}</span>
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
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 relative z-10">
             <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
            <h3 className="text-[10px] sm:text-xs uppercase tracking-wider text-app-text-s font-mono font-medium truncate">Longest Streak</h3>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 lg:gap-6 relative z-10">
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
