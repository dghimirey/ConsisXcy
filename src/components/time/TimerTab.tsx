import React, { useEffect, useState, useRef } from 'react';
import { useTimerStore } from '../../store/useTimerStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Play, Pause, RotateCcw, Plus, Minus, BellRing, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import { SoundService } from '../../services/SoundService';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

function formatTime(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000); // ceil so it shows 1 when 0.1s left
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number, size = 2) => num.toString().padStart(size, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function TimerTab() {
  const { isRunning, start, pause, reset, getRemaining, targetDuration, setDuration, remainingTimeAtPause } = useTimerStore();
  const { soundEnabled, toggleSound } = useSettingsStore();
  const [remaining, setRemaining] = useState(getRemaining());
  const requestRef = useRef<number | undefined>(undefined);

  // Input states for setting timer
  const [inputHours, setInputHours] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(5);
  const [inputSeconds, setInputSeconds] = useState(0);
  
  const [isFinished, setIsFinished] = useState(false);

  const update = () => {
    const currentRemaining = getRemaining();
    setRemaining(currentRemaining);
    
    // Countdown tick for last 3 seconds
    if (isRunning && currentRemaining > 0 && currentRemaining <= 3000) {
        // play tick every second mark exactly
        // to approximate, just relying on accurate audio loops or playing explicitly might be tricky via rAF,
        // we can skip the manual tick here for simplicity to avoid overlapping/messy timing, keeping the finish clean.
    }
    
    if (isRunning && currentRemaining <= 0) {
      if (!isFinished) {
         setIsFinished(true);
         pause();
         if (soundEnabled) {
            SoundService.playTimerComplete();
            setTimeout(() => SoundService.playConfetti(), 100);
            confetti({
               particleCount: 80,
               spread: 70,
               origin: { y: 0.6 },
               colors: ['#34D399', '#10B981', '#FFFFFF'],
               zIndex: 1000
            });
            toast('Focus Session Complete! Great Work.', {
               icon: '👏',
               style: { borderRadius: '12px', background: '#27272A', color: '#fff' },
            });
         }
      }
    }

    if (isRunning && currentRemaining > 0) {
      requestRef.current = requestAnimationFrame(update);
    }
  };

  useEffect(() => {
    if (isRunning) {
        setIsFinished(false);
    }
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning, getRemaining]);

  const handleApplyDuration = () => {
     const ms = (inputHours * 3600 + inputMinutes * 60 + inputSeconds) * 1000;
     setDuration(ms);
     setRemaining(ms);
     setIsFinished(false);
  };

  const handleStart = () => {
      start();
      if (soundEnabled) {
         if (remaining === targetDuration) {
             SoundService.playTimerStart();
         } else {
             SoundService.playTimerResume();
         }
      }
  };

  const handlePause = () => {
      pause();
      if (soundEnabled) SoundService.playTimerPause();
  };

  const handleStopAlarm = () => {
      setIsFinished(false);
      reset();
      setDuration(0); // return to edit view
  };

  const canEdit = !isRunning && (remaining === targetDuration);

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
      <div className="bg-app-glass border border-app-border rounded-[32px] p-6 sm:p-8 md:p-12 w-full flex flex-col items-center shadow-lg relative overflow-hidden">
        
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 sm:gap-4 z-10">
            <button 
                onClick={toggleSound}
                className="p-1.5 sm:p-2 rounded-lg bg-app-surface border border-app-border text-app-text-s hover:text-white hover:border-app-text-s transition-colors"
                aria-label="Toggle Sound"
                title={soundEnabled ? "Mute Timer" : "Unmute Timer"}
            >
                {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />}
            </button>
        </div>

        {isFinished ? (
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="flex flex-col items-center gap-6 text-center"
            >
               <div className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-pulse">
                  <BellRing className="w-12 h-12" />
               </div>
               <h2 className="text-3xl font-bold text-white">Focus Complete!</h2>
               <button 
                  onClick={handleStopAlarm}
                  className="px-8 py-4 bg-app-accent text-zinc-900 font-bold rounded-xl hover:opacity-90 transition-opacity mt-4"
               >
                  New Session
               </button>
            </motion.div>
        ) : (
            <>
                {canEdit ? (
                    <div className="flex flex-col items-center gap-8 w-full">
                        {/* Presets */}
                        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                            {[5, 10, 15, 25, 30, 45, 60].map(min => (
                                <button 
                                   key={min} 
                                   onClick={() => { setInputHours(Math.floor(min / 60)); setInputMinutes(min % 60); setInputSeconds(0); }}
                                   className="px-3 py-1.5 rounded-lg bg-app-surface border border-app-border text-app-text-s text-xs font-mono hover:text-white hover:border-app-text-s transition-colors"
                                >
                                    {min}m
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-6 text-xl sm:text-2xl md:text-4xl font-mono text-white">
                            <div className="flex flex-col items-center gap-2">
                                <button onClick={() => setInputHours(p => Math.min(99, p + 1))} className="p-2 hover:bg-app-surface rounded-lg"><Plus className="w-5 h-5"/></button>
                                <span className="w-12 sm:w-16 text-center">{inputHours.toString().padStart(2, '0')}</span>
                                <button onClick={() => setInputHours(p => Math.max(0, p - 1))} className="p-2 hover:bg-app-surface rounded-lg"><Minus className="w-5 h-5"/></button>
                                <span className="text-xs text-app-text-s uppercase tracking-wider font-sans mt-1">hr</span>
                            </div>
                            <span className="text-app-text-s mb-6">:</span>
                            <div className="flex flex-col items-center gap-2">
                                <button onClick={() => setInputMinutes(p => Math.min(59, p + 1))} className="p-2 hover:bg-app-surface rounded-lg"><Plus className="w-5 h-5"/></button>
                                <span className="w-12 sm:w-16 text-center">{inputMinutes.toString().padStart(2, '0')}</span>
                                <button onClick={() => setInputMinutes(p => Math.max(0, p - 1))} className="p-2 hover:bg-app-surface rounded-lg"><Minus className="w-5 h-5"/></button>
                                <span className="text-xs text-app-text-s uppercase tracking-wider font-sans mt-1">min</span>
                            </div>
                            <span className="text-app-text-s mb-6">:</span>
                            <div className="flex flex-col items-center gap-2">
                                <button onClick={() => setInputSeconds(p => Math.min(59, p + 1))} className="p-2 hover:bg-app-surface rounded-lg"><Plus className="w-5 h-5"/></button>
                                <span className="w-12 sm:w-16 text-center">{inputSeconds.toString().padStart(2, '0')}</span>
                                <button onClick={() => setInputSeconds(p => Math.max(0, p - 1))} className="p-2 hover:bg-app-surface rounded-lg"><Minus className="w-5 h-5"/></button>
                                <span className="text-xs text-app-text-s uppercase tracking-wider font-sans mt-1">sec</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => { handleApplyDuration(); handleStart(); }}
                            disabled={inputHours === 0 && inputMinutes === 0 && inputSeconds === 0}
                            className="px-8 py-4 w-full md:w-auto bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded-xl hover:bg-emerald-500/20 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Set Timer & Start
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center w-full">
                        {/* Progress Circle approximation */}
                        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-12">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle 
                                    cx="50%" cy="50%" r="48%" 
                                    stroke="currentColor" 
                                    className="text-app-border" 
                                    strokeWidth="4" 
                                    fill="none" 
                                />
                                <motion.circle 
                                    cx="50%" cy="50%" r="48%" 
                                    stroke="currentColor" 
                                    className="text-app-accent transition-all duration-300 ease-linear" 
                                    strokeWidth="4" 
                                    pathLength="100"
                                    strokeDasharray="100"
                                    strokeDashoffset={100 - (remaining / targetDuration) * 100}
                                    fill="none" 
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="text-5xl md:text-7xl font-mono font-bold text-white tracking-tight tabular-nums">
                                {formatTime(remaining)}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-4 md:gap-6">
                            {!isRunning ? (
                                <button 
                                onClick={handleStart}
                                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/20 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                                aria-label="Start"
                                >
                                <Play className="w-6 h-6 md:w-8 md:h-8 ml-1" />
                                </button>
                            ) : (
                                <button 
                                onClick={handlePause}
                                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center hover:bg-amber-500/20 transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                                aria-label="Pause"
                                >
                                <Pause className="w-6 h-6 md:w-8 md:h-8" />
                                </button>
                            )}

                            <button 
                                onClick={() => {
                                    reset();
                                    setDuration(0); // This unsets it and returns to "setting" view
                                }}
                                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text-s hover:text-white hover:bg-app-surface/80 transition-colors"
                                aria-label="Reset & Edit"
                            >
                                <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
}
