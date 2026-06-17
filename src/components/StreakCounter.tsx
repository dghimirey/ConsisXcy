import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, CheckCircle2, AlertTriangle } from 'lucide-react';
import dayjs from 'dayjs';

function AnimatedFlame({ streak, active }: { streak: number, active: boolean }) {
  const level = streak >= 50 ? 4 : streak >= 21 ? 3 : streak >= 7 ? 2 : 1;

  const particleData = useMemo(() => {
    return Array.from({ length: 15 }).map(() => ({
       xTarget: (Math.random() - 0.5) * 30,
       yTarget: -20 - Math.random() * 30,
       delay: Math.random() * 2,
       durationMod: Math.random(),
       scaleStart: Math.random() * 0.5 + 0.5
    }));
  }, []);

  if (!active) {
    return (
      <div className="relative w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-app-text-s/50">
        <Flame className="w-4 h-4 sm:w-5 sm:h-5 grayscale opacity-50" />
      </div>
    );
  }

  const configs = {
    1: {
      color: '#9FE870', // app-accent
      fill: 'transparent',
      glow: 'rgba(159,232,112,0.3)',
      particles: 0,
      scale: [1, 1.05, 1],
      rotate: [-1, 1, -1],
      duration: 3,
      core: false,
      coreColor: '',
    },
    2: {
      color: '#fbbf24', // amber-400
      fill: '#fbbf24',
      fillOpacity: 0.2,
      glow: 'rgba(251,191,36,0.4)',
      particles: 4,
      scale: [1, 1.1, 1.05, 1.15, 1],
      rotate: [-2, 2, -1, 3, -2],
      duration: 2.5,
      core: true,
      coreColor: '#fef3c7',
    },
    3: {
      color: '#f97316', // orange-500
      fill: '#f97316',
      fillOpacity: 0.5,
      glow: 'rgba(249,115,22,0.6)',
      particles: 8,
      scale: [1, 1.15, 1.05, 1.2, 1],
      rotate: [-4, 3, -2, 4, -3],
      duration: 1.8,
      core: true,
      coreColor: '#fde047',
    },
    4: {
      color: '#06b6d4', // cyan-500
      fill: '#06b6d4',
      fillOpacity: 0.8,
      glow: 'rgba(6,182,212,0.8)',
      particles: 15,
      scale: [1, 1.2, 1.1, 1.25, 1],
      rotate: [-5, 4, -3, 5, -4],
      duration: 1.2,
      core: true,
      coreColor: '#ffffff',
    }
  };

  const config = configs[level as keyof typeof configs];

  return (
    <div className="relative w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center -translate-y-0.5">
      {/* Background ambient glow */}
      <motion.div
        animate={{ 
           scale: config.scale,
           opacity: [0.6, 0.9, 0.6],
        }}
        transition={{ duration: config.duration, ease: "easeInOut", repeat: Infinity }}
        className="absolute inset-0 rounded-full blur-[8px] sm:blur-[10px] z-0"
        style={{ backgroundColor: config.color, opacity: 0.5 }}
      />
      <motion.div
        animate={{ 
           scale: config.scale.slice().reverse(),
           opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: config.duration * 1.5, ease: "easeInOut", repeat: Infinity }}
        className="absolute inset-[-4px] rounded-full blur-[12px] sm:blur-[14px] z-0"
        style={{ backgroundColor: config.glow, opacity: 0.3 }}
      />

      {/* Embers / Sparks */}
      {config.particles > 0 && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-visible">
          {particleData.slice(0, config.particles).map((p, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-[60%] w-[2px] h-[2px] sm:w-[3px] sm:h-[3px] rounded-full -ml-[1px] sm:-ml-[1.5px]"
              style={{ backgroundColor: config.coreColor, boxShadow: `0 0 6px 1px ${config.color}` }}
              initial={{ 
                 opacity: 0, 
                 x: 0,
                 y: 0,
                 scale: p.scaleStart
              }}
              animate={{ 
                 opacity: [0, 1, 1, 0],
                 x: p.xTarget, 
                 y: p.yTarget,   
                 scale: [0, 1, 0.5, 0]
              }}
              transition={{
                 duration: (config.duration * 0.8) + p.durationMod,
                 repeat: Infinity,
                 delay: p.delay,
                 ease: 'easeOut'
              }}
            />
          ))}
        </div>
      )}

      {/* Main Outer Flame */}
      <motion.div
         animate={{
            scale: config.scale,
            rotate: config.rotate,
            y: [0, -2, 0, -1, 0] 
         }}
         transition={{ duration: config.duration, ease: "easeInOut", repeat: Infinity }}
         className="absolute z-20 flex items-center justify-center origin-bottom"
         style={{ color: config.color, filter: `drop-shadow(0 0 6px ${config.glow})` }}
      >
         <Flame 
            className="w-4 h-4 sm:w-5 sm:h-5 transition-all" 
            style={{ fill: config.fill, fillOpacity: config.fillOpacity }}
         />
      </motion.div>

      {/* Inner Hot Core */}
      {config.core && (
        <motion.div
           animate={{
              scale: [0.6, 0.8, 0.65, 0.85, 0.6],
              rotate: config.rotate.map(r => r * -1.5), 
              y: [2, 0, 1, -1, 2]
           }}
           transition={{ duration: config.duration * 0.7, ease: "easeInOut", repeat: Infinity }}
           className="absolute z-30 flex items-center justify-center origin-bottom"
           style={{ color: config.coreColor }}
        >
           <Flame 
              className="w-2.5 h-2.5 sm:w-3 sm:h-3" 
              style={{ fill: config.coreColor }}
           />
        </motion.div>
      )}
    </div>
  );
}

export function StreakCounter({ currentStreak, longestStreak, isAtRisk, todayCompleted, todayPercentage }: { currentStreak: number, longestStreak: number, isAtRisk: boolean, todayCompleted: boolean, todayPercentage: number }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [hoursLeft, setHoursLeft] = useState(24);

  const level = currentStreak >= 50 ? 4 : currentStreak >= 21 ? 3 : currentStreak >= 7 ? 2 : 1;

  useEffect(() => {
    if (todayCompleted) return;
    
    const calculateTimeLeft = () => {
      const now = dayjs();
      const endOfDay = now.endOf('day');
      const diffStr = endOfDay.diff(now, 'second');
      if (diffStr <= 0) {
        setHoursLeft(0);
        return '00:00:00';
      }
      
      const h = Math.floor(diffStr / 3600);
      const m = Math.floor((diffStr % 3600) / 60);
      
      setHoursLeft(h);
      return `${h}h ${m}m`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);

    return () => clearInterval(interval);
  }, [todayCompleted]);

  const showAtRisk = isAtRisk && hoursLeft < 6;

  // Motivational message based on streak
  let message = "Keep going.";
  if (currentStreak === 0) message = "Time to build a new habit.";
  else if (currentStreak < 3) message = "You're building momentum.";
  else if (currentStreak < 7) message = "Great consistency this week.";
  else if (currentStreak < 30) message = "You're on a roll. Don't break the chain.";
  else message = "Incredible dedication. You're unstoppable.";

  // Determine dynamic background layers
  let bgLayers = null;
  if (showAtRisk) {
    bgLayers = (
      <>
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-rose-500/30 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-orange-500/20 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      </>
    );
  } else if (todayCompleted || currentStreak > 0) {
    if (level === 1) {
      bgLayers = (
        <>
          <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        </>
      );
    } else if (level === 2) {
      bgLayers = (
        <>
          <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-amber-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-orange-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-yellow-400/10 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '3s' }} />
        </>
      );
    } else if (level === 3) {
      bgLayers = (
        <>
          <div className="absolute top-[-15%] right-[-10%] w-[450px] h-[450px] bg-orange-600/25 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute bottom-[-15%] left-[-10%] w-[350px] h-[350px] bg-rose-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '3.5s' }} />
        </>
      );
    } else {
      bgLayers = (
        <>
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/30 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '2.5s' }} />
          <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-indigo-500/15 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
        </>
      );
    }
  } else {
    bgLayers = (
      <>
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px]" />
      </>
    );
  }

  return (
    <div className="mb-8 md:mb-12">
      <div className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] sm:rounded-br-[40px] shadow-2xl group border border-white/10 bg-[#0a0a0a]">
        
        {/* Colorful Background Layers */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-60 mix-blend-screen transition-opacity duration-1000">
          {bgLayers}
        </div>

        {/* Noise overlay for premium feel */}
        <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-10 pointer-events-none mix-blend-overlay"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
        
        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-8 h-full">
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center gap-2 text-app-text-s">
              <AnimatedFlame streak={currentStreak} active={todayCompleted || currentStreak > 0} />
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
          <div className="flex flex-col gap-4 min-w-[200px]">
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
              ) : showAtRisk ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2 text-rose-500">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                    <span className="text-sm sm:text-base font-medium">At Risk</span>
                  </div>
                  <span className="text-xs sm:text-sm font-mono text-rose-400/80">{timeLeft} left to complete</span>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Longest Streak subtle indicator */}
            <div className="pt-4 border-t border-app-border/50">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-mono text-app-text-s/60 uppercase tracking-widest">
                  Longest Record
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-display text-white font-medium">
                    {longestStreak}
                  </span>
                  <span className="text-xs font-mono text-app-text-s">Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
