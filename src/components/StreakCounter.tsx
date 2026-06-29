import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, CheckCircle2, AlertTriangle, Trophy } from 'lucide-react';
import { fireConfetti } from '../lib/celebrations';
import dayjs from 'dayjs';

function AnimatedFlame({ streak, active }: { streak: number, active: boolean }) {
  // Day 1-3 (Small), 4-7 (Medium), 8-14 (Strong), 15-30 (Large), 31-100+ (Legendary)
  const level = streak >= 31 ? 5 : streak >= 15 ? 4 : streak >= 8 ? 3 : streak >= 4 ? 2 : 1;

  const particleData = useMemo(() => {
    return Array.from({ length: 25 }).map(() => ({
       xTarget: (Math.random() - 0.5) * 60,
       yTarget: -40 - Math.random() * 80,
       delay: Math.random() * 3,
       durationMod: Math.random() * 1.5,
       scaleStart: Math.random() * 0.8 + 0.4
    }));
  }, []);

  if (!active) {
    return (
      <div className="relative flex items-center justify-center grayscale opacity-30 text-app-text-s/50">
        <Flame className="w-12 h-12" />
      </div>
    );
  }

  const configs = {
    1: { // Small flame
      color: '#ff6a00',
      fill: 'transparent',
      fillOpacity: 0.2,
      glow: 'rgba(255,106,0,0.3)',
      particles: 5,
      scale: [0.7, 0.75, 0.7],
      rotate: [-2, 2, -1],
      duration: 3,
      core: false,
      coreColor: '',
      size: 'w-16 h-16'
    },
    2: { // Medium
      color: '#ff7b00',
      fill: '#ff7b00',
      fillOpacity: 0.4,
      glow: 'rgba(255,123,0,0.5)',
      particles: 10,
      scale: [1, 1.05, 1],
      rotate: [-3, 3, -2],
      duration: 2.5,
      core: true,
      coreColor: '#ffb703',
      size: 'w-20 h-20'
    },
    3: { // Strong
      color: '#ff5400',
      fill: '#ff5400',
      fillOpacity: 0.7,
      glow: 'rgba(255,84,0,0.7)',
      particles: 15,
      scale: [1.3, 1.4, 1.3],
      rotate: [-5, 4, -4],
      duration: 2,
      core: true,
      coreColor: '#ffb703',
      size: 'w-24 h-24'
    },
    4: { // Large
      color: '#f94144',
      fill: '#f94144',
      fillOpacity: 0.9,
      glow: 'rgba(249,65,68,0.9)',
      particles: 20,
      scale: [1.6, 1.7, 1.6],
      rotate: [-6, 5, -5],
      duration: 1.5,
      core: true,
      coreColor: '#f9c74f',
      size: 'w-28 h-28'
    },
    5: { // Legendary
      color: '#ff0000',
      fill: '#ff0000',
      fillOpacity: 1,
      glow: 'rgba(255,0,0,1)',
      particles: 25,
      scale: [2.0, 2.1, 2.0],
      rotate: [-8, 7, -6],
      duration: 1.2,
      core: true,
      coreColor: '#f9c74f',
      size: 'w-32 h-32'
    }
  };

  const config = configs[level as keyof typeof configs];

  return (
    <div className={`relative flex items-center justify-center ${config.size}`}>
      {/* Dynamic Pulse Glow */}
      <motion.div
        animate={{ 
           scale: config.scale,
           opacity: [0.6, 0.9, 0.6],
        }}
        transition={{ duration: config.duration, ease: "easeInOut", repeat: Infinity }}
        className="absolute inset-0 rounded-full blur-[20px] z-0"
        style={{ backgroundColor: config.color }}
      />

      {/* Embers / Sparks */}
      {config.particles > 0 && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-visible">
          {particleData.slice(0, config.particles).map((p, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-[60%] w-[3px] h-[3px] rounded-full -ml-[1.5px]"
              style={{ backgroundColor: config.coreColor, boxShadow: `0 0 10px 2px ${config.color}` }}
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
                 duration: (config.duration * 1.5) + p.durationMod,
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
            y: [0, -4, 0, -2, 0] 
         }}
         transition={{ duration: config.duration, ease: "easeInOut", repeat: Infinity }}
         className="absolute z-20 flex items-center justify-center origin-bottom w-full h-full"
         style={{ color: config.color, filter: `drop-shadow(0 0 ${10 * level}px ${config.color})` }}
      >
         <Flame className="w-full h-full transition-all" style={{ fill: config.fill, fillOpacity: config.fillOpacity }} />
      </motion.div>

      {/* Inner Hot Core */}
      {config.core && (
        <motion.div
           animate={{
              scale: [0.6, 0.8, 0.65, 0.85, 0.6],
              rotate: config.rotate.map(r => r * -1.5), 
              y: [4, 0, 2, -2, 4]
           }}
           transition={{ duration: config.duration * 0.7, ease: "easeInOut", repeat: Infinity }}
           className="absolute z-30 flex items-center justify-center origin-bottom w-1/2 h-1/2 mt-[20%]"
           style={{ color: config.coreColor }}
        >
           <Flame className="w-full h-full" style={{ fill: config.coreColor }} />
        </motion.div>
      )}
    </div>
  );
}

export function StreakCounter({ currentStreak, longestStreak, isAtRisk, todayCompleted, todayPercentage, last7Days = [] }: { currentStreak: number, longestStreak: number, isAtRisk: boolean, todayCompleted: boolean, todayPercentage: number, last7Days?: boolean[] }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [hoursLeft, setHoursLeft] = useState(24);
  const [prevStreak, setPrevStreak] = useState(currentStreak);

  useEffect(() => {
    if (currentStreak > prevStreak) {
       // Streak increased!
       fireConfetti({
         particleCount: 50,
         spread: 60,
         origin: { y: 0.6 },
         colors: ['#ff6a00', '#ff8a00', '#ffd166'],
         zIndex: 2147483647
       });
    }
    setPrevStreak(currentStreak);
  }, [currentStreak, prevStreak]);

  const level = currentStreak >= 31 ? 5 : currentStreak >= 15 ? 4 : currentStreak >= 8 ? 3 : currentStreak >= 4 ? 2 : 1;

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

  // Motivational message
  let message = "Keep going! 🔥";
  if (currentStreak === 0) message = "Time to build momentum.";
  else if (currentStreak < 4) message = "You're building momentum.";
  else if (currentStreak < 8) message = "Every day counts. Keep it up!";
  else if (currentStreak < 15) message = "Future you will thank you.";
  else message = "Incredible dedication. Unstoppable.";

  // Fill last7Days to ensure we have exactly 7, if missed
  const padded7Days = [...last7Days];
  while (padded7Days.length < 7) {
     padded7Days.unshift(false);
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="mb-10 w-full"
    >
      <div 
        className="relative overflow-hidden rounded-[32px] p-[1px]"
        style={{
          background: 'linear-gradient(90deg, rgba(255,106,0,0.25), rgba(255,61,0,0.25), rgba(255,106,0,0.25), rgba(106,92,255,0.25))'
        }}
      >
        <div className="relative bg-[#050816] rounded-[24px] md:rounded-[31px] flex flex-row shadow-2xl overflow-hidden h-full z-10 w-full">
          
          {/* Subtle Background Glows */}
          <div className="absolute top-[-50%] left-[-10%] w-[80%] h-[150%] bg-[#ff7800] opacity-[0.15] blur-[120px] pointer-events-none mix-blend-screen" />
          <div className="absolute bottom-[-50%] right-[-10%] w-[60%] h-[150%] bg-[#8c52ff] opacity-[0.12] blur-[120px] pointer-events-none mix-blend-screen" />

          {/* Noise */}
          <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-10 pointer-events-none mix-blend-overlay" />

          {/* LEFT SIDE (~65%) */}
          <div className="relative z-10 p-3 sm:p-5 md:p-6 lg:p-8 w-[55%] sm:w-[60%] lg:w-[65%] flex flex-col justify-center border-r border-white/5">
             
             {/* Badge */}
             <div 
               className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full self-start mb-2 sm:mb-4 md:mb-6 backdrop-blur-md"
               style={{ 
                  background: 'rgba(255, 120, 0, 0.15)',
                  boxShadow: '0 0 20px rgba(255, 120, 0, 0.2)'
               }}
             >
                <Flame className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#FFD166]" />
                <span className="text-[8px] sm:text-[10px] md:text-xs font-bold tracking-widest text-[#FFD166]">CURRENT STREAK</span>
             </div>

             <div className="flex items-center gap-2 sm:gap-6 md:gap-8 mb-3 sm:mb-5 md:mb-6">
                {/* Fire Container */}
                <div className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 flex items-center justify-center shrink-0">
                  <AnimatedFlame streak={currentStreak} active={todayCompleted || currentStreak > 0} />
                </div>
                
                {/* Number & Text */}
                <div className="flex flex-col">
                   <div className="flex items-baseline gap-1 sm:gap-2 mb-0 sm:mb-1">
                     <AnimatePresence mode="popLayout">
                       <motion.span 
                          key={`streak-${currentStreak}`}
                          initial={{ scale: 0.5, opacity: 0, y: 30 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, type: 'spring', bounce: 0.5 }}
                          className="text-[32px] sm:text-[64px] md:text-[80px] lg:text-[96px] font-black leading-none tracking-tighter"
                          style={{ color: '#FFFFFF', textShadow: '0 0 20px rgba(255, 140, 0, 0.5)' }}
                       >
                          {currentStreak}
                       </motion.span>
                     </AnimatePresence>
                     <span 
                        className="text-[10px] sm:text-lg md:text-2xl font-black uppercase tracking-wider"
                        style={{ 
                          background: 'linear-gradient(180deg, #FFD166, #FF8A00)', 
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                     >
                        Days
                     </span>
                   </div>
                   <p className="text-[9px] sm:text-sm md:text-base font-medium text-[#E5E7EB] line-clamp-2">
                      {message}
                   </p>
                </div>
             </div>

             {/* Weekly Indicator */}
             <div className="flex items-center gap-1.5 sm:gap-2 mt-auto">
                <span className="mr-1 sm:mr-3 text-[8px] sm:text-[10px] md:text-sm font-bold text-white/50 uppercase tracking-widest hidden sm:inline-block">History</span>
                <div className="flex items-center gap-1 sm:gap-2">
                   {padded7Days.map((isCompleted, i) => {
                      const isToday = i === padded7Days.length - 1;
                      return (
                        <div 
                           key={i}
                           className={`w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 md:w-3.5 md:h-3.5 rounded-full transition-all duration-500`}
                           style={{
                              backgroundColor: isCompleted ? '#FF8A00' : '#2B2F3A',
                              boxShadow: isCompleted ? '0 0 15px #FF8A00' : 'none',
                              opacity: (!isCompleted && isToday && !todayCompleted) ? 0.5 : 1
                           }}
                        />
                      );
                   })}
                </div>
             </div>

          </div>

          {/* RIGHT SIDE (~35%) */}
          <div className="relative z-10 p-2.5 sm:p-5 md:p-6 lg:p-8 w-[45%] sm:w-[40%] lg:w-[35%] flex flex-col justify-center gap-2 sm:gap-4 bg-white/[0.02]">
             
             {/* Goal Completed Card */}
             <div 
               className="rounded-[12px] sm:rounded-[20px] p-2 sm:p-4 flex flex-col justify-center border border-white/5 relative overflow-hidden shrink-0"
               style={{
                  background: 'linear-gradient(135deg, rgba(0,255,120,0.18), rgba(0,120,60,0.05))'
               }}
             >
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 relative z-10">
                   <div className="p-1 sm:p-2 lg:p-2.5 bg-emerald-500/20 rounded-lg lg:rounded-xl shrink-0 hidden sm:flex">
                      <Trophy className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-emerald-400" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-1 lg:gap-2 mb-0.5">
                       <h4 className="text-white font-bold text-[9px] sm:text-sm lg:text-base whitespace-nowrap overflow-hidden text-ellipsis">Goal Status</h4>
                       {todayCompleted ? (
                         <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="rounded-full bg-emerald-500/20 shrink-0 self-start sm:self-auto mt-0.5 sm:mt-0"
                            style={{ boxShadow: '0 0 20px #22C55E' }}
                         >
                           <CheckCircle2 className="w-2.5 h-2.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-[#22C55E] fill-current" />
                         </motion.div>
                       ) : showAtRisk ? (
                         <AlertTriangle className="w-2.5 h-2.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-rose-500 shrink-0 animate-pulse self-start sm:self-auto mt-0.5 sm:mt-0" />
                       ) : null}
                     </div>
                     <p className="text-emerald-200/70 text-[8px] sm:text-[11px] lg:text-sm truncate">
                        {todayCompleted ? 'All tasks finished' : showAtRisk ? `At Risk - ${timeLeft}` : 'Tasks pending...'}
                     </p>
                   </div>
                </div>
             </div>

             {/* Longest Record Card */}
             <div 
               className="rounded-[12px] sm:rounded-[20px] p-2 sm:p-4 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center border border-white/5 relative overflow-hidden shrink-0"
               style={{
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(91,33,182,0.05))'
               }}
             >
                {/* Background Graphic */}
                <Trophy className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-12 h-12 sm:w-24 sm:h-24 lg:w-32 lg:h-32 text-purple-500/10 pointer-events-none -rotate-12" />

                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 relative z-10 min-w-0 mb-0.5 sm:mb-0">
                   <div className="p-1 sm:p-2 lg:p-2.5 bg-purple-500/20 rounded-lg lg:rounded-xl shrink-0 hidden sm:flex">
                      <Trophy className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-purple-400" />
                   </div>
                   <h4 className="text-white font-bold text-[9px] sm:text-sm lg:text-base whitespace-nowrap overflow-hidden text-ellipsis line-clamp-1 sm:line-clamp-none">
                     <span className="hidden sm:inline">Longest<br/>Record</span>
                     <span className="sm:hidden">Longest</span>
                   </h4>
                </div>
                <div className="flex items-baseline gap-0.5 sm:gap-1 relative z-10 shrink-0 sm:ml-2">
                  <span 
                     className="text-sm sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-none"
                     style={{ textShadow: '0 0 20px rgba(168,85,247,0.5)' }}
                  >
                     {longestStreak}
                  </span>
                  <span className="text-purple-200/70 text-[7px] sm:text-[10px] lg:text-xs font-medium uppercase leading-none">Days</span>
                </div>
             </div>
             
          </div>

        </div>
      </div>
    </motion.div>
  );
}
