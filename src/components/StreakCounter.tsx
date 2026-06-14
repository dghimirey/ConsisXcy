import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
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
      
      return `${h}h ${m}m`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);

    return () => clearInterval(interval);
  }, [todayCompleted]);

  // Motivational message based on streak
  let message = "Keep going.";
  if (currentStreak === 0) message = "Time to build a new habit.";
  else if (currentStreak < 3) message = "You're building momentum.";
  else if (currentStreak < 7) message = "Great consistency this week.";
  else if (currentStreak < 30) message = "You're on a roll. Don't break the chain.";
  else message = "Incredible dedication. You're unstoppable.";

  return (
    <div className="mb-8 md:mb-12">
      <div className="bg-app-surface border border-app-border rounded-[20px] p-6 sm:p-8 md:p-10 relative overflow-hidden group">
        
        {/* Subtle Background Glow */}
        <div className={`absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.03] pointer-events-none transition-colors duration-1000 -translate-y-1/2 translate-x-1/3 ${todayCompleted ? 'bg-app-accent' : isAtRisk ? 'bg-yellow-500' : 'bg-white'}`} />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center gap-2 text-app-text-s">
              <motion.div 
                animate={todayCompleted ? { opacity: [0.7, 1, 0.7], filter: ['drop-shadow(0px 0px 4px rgba(159,232,112,0.3))', 'drop-shadow(0px 0px 12px rgba(159,232,112,0.8))', 'drop-shadow(0px 0px 4px rgba(159,232,112,0.3))'] } : {}} 
                transition={{ duration: 3, ease: "easeInOut", repeat: todayCompleted ? Infinity : 0 }}
              >
                <Flame className={`w-4 h-4 sm:w-5 sm:h-5 ${todayCompleted ? 'text-app-accent' : 'text-app-text-s'}`} />
              </motion.div>
              <h3 className="text-xs sm:text-sm font-mono tracking-wide uppercase">Current Streak</h3>
            </div>

            {/* Main Stats */}
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <motion.span 
                  key={`streak-${currentStreak}`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-5xl sm:text-6xl md:text-7xl font-display font-medium text-white tracking-tight"
                >
                  {currentStreak}
                </motion.span>
                <span className="text-lg sm:text-xl font-mono text-app-text-s">Days</span>
              </div>
              <p className="text-sm sm:text-base text-app-text-s tracking-wide">
                {message}
              </p>
            </div>
          </div>

          {/* Status Panel */}
          <div className="flex flex-col gap-3 min-w-[200px]">
            <AnimatePresence mode="popLayout">
              {todayCompleted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2 text-app-accent">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base font-medium">Goal Completed</span>
                  </div>
                  <span className="text-xs sm:text-sm font-mono text-app-text-s">All assigned tasks finished</span>
                </motion.div>
              ) : isAtRisk ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2 text-yellow-500">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base font-medium">At Risk</span>
                  </div>
                  <span className="text-xs sm:text-sm font-mono text-app-text-s">{timeLeft} left to complete</span>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2 text-app-text-s">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base font-medium">Goal Pending</span>
                  </div>
                  {todayPercentage === 0 ? (
                    <span className="text-xs sm:text-sm font-mono text-app-text-s">Rest day or no tasks yet</span>
                  ) : (
                    <span className="text-xs sm:text-sm font-mono text-app-text-s">{timeLeft} remaining</span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Longest Streak subtle indicator */}
            <div className="pt-3 border-t border-app-border/50">
              <span className="text-xs font-mono text-app-text-s/70">
                Longest Streak: {longestStreak} Days
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
