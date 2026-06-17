import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Routine } from '../../types';
import { X, Play, Pause, Square, Check, Minus, Plus, Focus } from 'lucide-react';
import { getIcon } from '../../lib/icons';

interface FocusSessionOverlayProps {
  routine: Routine | null;
  onClose: () => void;
  onComplete: (routineId: string) => void;
}

export function FocusSessionOverlay({ routine, onClose, onComplete }: FocusSessionOverlayProps) {
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      // Re-sync time when not active but duration changes
      // to allow the user to adjust the starting time before pressing play
      setTimeLeft(durationMinutes * 60);
    }
  }, [durationMinutes, isActive]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      // Automatically complete when timer hits zero? Let's just stop it and let them hit complete manually.
    }
    
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, timeLeft]);

  // Clean up when routine changes/unmounts
  useEffect(() => {
    if (routine) {
      setIsActive(false);
      setTimeLeft(durationMinutes * 60);
    }
  }, [routine]);

  if (!routine) return null;

  const handleToggle = () => setIsActive(!isActive);
  const handleStop = () => {
    setIsActive(false);
    setTimeLeft(durationMinutes * 60);
  };
  
  const handleComplete = () => {
    onComplete(routine.id);
    onClose();
  };

  const adjustDuration = (delta: number) => {
    if (isActive) return; // don't adjust while running
    setDurationMinutes(prev => {
      const newVal = prev + delta;
      if (newVal < 1) return 1;
      if (newVal > 120) return 120;
      return newVal;
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = 1 - (timeLeft / (durationMinutes * 60));
  const IconComponent = getIcon(routine.icon);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/95 backdrop-blur-3xl"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-950/20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vmin] h-[80vmin] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors z-20"
          title="Close Focus Session"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center w-full max-w-md px-6 z-10 relative">
          
          <motion.div 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.1 }}
             className="text-center mb-12"
          >
            <div className="flex justify-center mb-4 text-emerald-400">
               {IconComponent && <IconComponent className="w-10 h-10" />}
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-medium text-white mb-2">{routine.name}</h2>
            <p className="text-app-text-s/70 font-mono text-sm uppercase tracking-widest">Focus Session</p>
          </motion.div>

          {/* Circle Timer */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 mb-12 flex items-center justify-center">
            
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
              <circle 
                cx="50" cy="50" r="48" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                className="text-white/5" 
              />
              <circle 
                cx="50" cy="50" r="48" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
                strokeDasharray="301.59" // 2 * pi * 48
                strokeDashoffset={301.59 * (1 - progress)}
                className="text-emerald-500 transition-all duration-1000 ease-linear" 
              />
            </svg>
            
            <div className="absolute inset-0 z-0 bg-emerald-500/5 rounded-full animate-pulse" style={{ animationDuration: '4s', opacity: isActive ? 1 : 0 }} />

            <div className="flex flex-col items-center justify-center z-10 relative mt-4">
               {isActive ? (
                  <div className="text-6xl md:text-7xl font-display text-white tracking-widest leading-none drop-shadow-2xl">
                     {formatTime(timeLeft)}
                  </div>
               ) : (
                  <div className="flex items-center gap-6">
                    <button onClick={() => adjustDuration(-5)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="text-6xl md:text-7xl font-display text-white tracking-widest leading-none">
                       {formatTime(timeLeft)}
                    </div>
                    <button onClick={() => adjustDuration(5)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
               )}
            </div>

          </div>

          <motion.div 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="flex items-center gap-4"
          >
             {isActive ? (
               <button 
                  onClick={handleToggle}
                  className="w-16 h-16 flex items-center justify-center rounded-full bg-app-surface ring-1 ring-app-border text-white hover:bg-white/5 transition-all"
               >
                 <Pause className="w-6 h-6 fill-current" />
               </button>
             ) : (
               <button 
                 onClick={handleToggle}
                 className="px-8 py-4 rounded-full bg-emerald-500 text-[#050505] font-medium tracking-wide uppercase flex items-center gap-3 hover:bg-emerald-400 hover:scale-105 transition-all shadow-[0_0_24px_rgba(16,185,129,0.3)]"
               >
                 <Play className="w-5 h-5 fill-current" />
                 Start Focus
               </button>
             )}

             {(!isActive && timeLeft < durationMinutes * 60) && (
               <button 
                 onClick={handleStop}
                 className="w-16 h-16 flex items-center justify-center rounded-full bg-app-surface ring-1 ring-app-border text-app-text-s/70 hover:text-white hover:bg-rose-500/10 hover:ring-rose-500/30 transition-all"
               >
                 <Square className="w-5 h-5 fill-current" />
               </button>
             )}

             {(!isActive && timeLeft < durationMinutes * 60) && (
               <button 
                 onClick={handleComplete}
                 className="w-16 h-16 flex items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:scale-105 transition-all"
                 title="Mark Routine as Completed"
               >
                 <Check className="w-6 h-6" strokeWidth={3} />
               </button>
             )}
          </motion.div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
