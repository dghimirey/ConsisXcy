import React, { useEffect, useState, useRef } from 'react';
import { usePomodoroStore, PomodoroPhase } from '../../store/usePomodoroStore';
import { useFocusSessionStore } from '../../store/useFocusSessionStore';
import { Play, Pause, RotateCcw, FastForward, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function formatTime(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

const ALARM_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export function PomodoroTab() {
  const { 
    phase, 
    focusDuration, 
    shortBreakDuration, 
    longBreakDuration, 
    cyclesCompleted, 
    isRunning, 
    start, 
    pause, 
    reset, 
    skipPhase, 
    completePhase, 
    getRemaining,
    autoTransition,
    setAutoTransition,
    setDurations
  } = usePomodoroStore();

  const [remaining, setRemaining] = useState(getRemaining());
  const requestRef = useRef<number>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Settings state
  const [sFocus, setSFocus] = useState(focusDuration / 60000);
  const [sShort, setSShort] = useState(shortBreakDuration / 60000);
  const [sLong, setSLong] = useState(longBreakDuration / 60000);

  useEffect(() => {
    audioRef.current = new Audio(ALARM_SOUND);
    return () => {
       if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
       }
    }
  }, []);

  const update = () => {
    const currentRemaining = getRemaining();
    setRemaining(currentRemaining);
    
    if (isRunning && currentRemaining <= 0) {
      if (audioRef.current) {
          audioRef.current.volume = 1;
          audioRef.current.play().catch(console.error);
      }
      if (phase === 'focus') {
          // Record the pomodoro focus session
          useFocusSessionStore.getState().addSession(
              'Pomodoro Focus',
              focusDuration,
              'Pomodoro'
          );
          // And mark it completed right away
          const latestId = useFocusSessionStore.getState().sessions[0]?.id;
          if (latestId) {
             useFocusSessionStore.getState().startSession(latestId);
             useFocusSessionStore.getState().stopSession(true);
          }
      }
      completePhase();
    }

    if (isRunning && currentRemaining > 0) {
      requestRef.current = requestAnimationFrame(update);
    }
  };

  useEffect(() => {
    if (!isRunning) {
        setRemaining(getRemaining());
    }
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning, getRemaining]);

  const handleStart = () => {
      start();
      if (audioRef.current) {
         audioRef.current.volume = 0;
         audioRef.current.play().then(() => {
             audioRef.current?.pause();
             if (audioRef.current) {
                 audioRef.current.currentTime = 0;
                 audioRef.current.volume = 1;
             }
         }).catch(e => e);
      }
  };

  const handleSaveSettings = () => {
      setDurations(sFocus * 60000, sShort * 60000, sLong * 60000);
      setShowSettings(false);
  };

  const currentDuration = phase === 'focus' ? focusDuration : phase === 'shortBreak' ? shortBreakDuration : longBreakDuration;

  let phaseLabel = "Focus Session";
  let phaseColor = "text-emerald-400";
  let phaseBg = "bg-emerald-500/10 border-emerald-500/20";
  
  if (phase === 'shortBreak') {
      phaseLabel = "Short Break";
      phaseColor = "text-sky-400";
      phaseBg = "bg-sky-500/10 border-sky-500/20";
  } else if (phase === 'longBreak') {
      phaseLabel = "Long Break";
      phaseColor = "text-indigo-400";
      phaseBg = "bg-indigo-500/10 border-indigo-500/20";
  }

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
      <div className={`border rounded-[32px] p-8 md:p-12 w-full flex flex-col items-center shadow-lg relative overflow-hidden transition-colors duration-500 ${phaseBg}`}>
        
        <div className="absolute top-6 right-6 flex items-center gap-4">
            <div className="text-xs font-mono font-medium text-app-text-s flex items-center gap-1">
               <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
               {cyclesCompleted} Cycles
            </div>
            <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg bg-app-surface border border-app-border text-app-text-s hover:text-white hover:border-app-text-s transition-colors"
                aria-label="Settings"
            >
                <Settings2 className="w-5 h-5" />
            </button>
        </div>

        <AnimatePresence>
            {showSettings && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute inset-0 z-20 bg-app-bg/95 backdrop-blur-md flex flex-col items-center justify-center p-8"
                >
                    <h3 className="text-xl font-bold text-white mb-6">Pomodoro Settings</h3>
                    
                    <div className="flex flex-col gap-4 w-full max-w-xs mb-8">
                        <div className="flex justify-between items-center">
                            <label className="text-sm text-app-text-s">Focus (min)</label>
                            <input type="number" min="1" value={sFocus} onChange={e => setSFocus(Number(e.target.value))} className="w-20 bg-app-surface border border-app-border rounded-lg px-3 py-1 text-white text-right outline-none focus:border-app-accent" />
                        </div>
                        <div className="flex justify-between items-center">
                            <label className="text-sm text-app-text-s">Short Break (min)</label>
                            <input type="number" min="1" value={sShort} onChange={e => setSShort(Number(e.target.value))} className="w-20 bg-app-surface border border-app-border rounded-lg px-3 py-1 text-white text-right outline-none focus:border-app-accent" />
                        </div>
                        <div className="flex justify-between items-center">
                            <label className="text-sm text-app-text-s">Long Break (min)</label>
                            <input type="number" min="1" value={sLong} onChange={e => setSLong(Number(e.target.value))} className="w-20 bg-app-surface border border-app-border rounded-lg px-3 py-1 text-white text-right outline-none focus:border-app-accent" />
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer mt-2">
                           <input type="checkbox" checked={autoTransition} onChange={e => setAutoTransition(e.target.checked)} className="accent-app-accent w-4 h-4" />
                           <span className="text-sm text-app-text-s">Auto-transition</span>
                        </label>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setShowSettings(false)} className="px-5 py-2 rounded-xl border border-app-border text-app-text-s hover:text-white transition-colors">Cancel</button>
                        <button onClick={handleSaveSettings} className="px-5 py-2 rounded-xl bg-app-accent text-zinc-900 font-bold hover:opacity-90 transition-opacity">Save</button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className={`px-4 py-1.5 rounded-full border mb-8 font-mono text-sm uppercase tracking-wider font-semibold ${phaseBg} ${phaseColor}`}>
            {phaseLabel}
        </div>

        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-12">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle 
                    cx="50%" cy="50%" r="48%" 
                    stroke="currentColor" 
                    className="text-app-border opacity-50" 
                    strokeWidth="4" 
                    fill="none" 
                />
                <motion.circle 
                    cx="50%" cy="50%" r="48%" 
                    stroke="currentColor" 
                    className={`${phaseColor} transition-all duration-300 ease-linear`}
                    strokeWidth="4" 
                    strokeDasharray="300%"
                    strokeDashoffset={`${300 - (remaining / currentDuration) * 300}%`}
                    fill="none" 
                    strokeLinecap="round"
                />
            </svg>
            <div className="text-6xl md:text-8xl font-mono font-bold text-white tracking-tight tabular-nums">
                {formatTime(remaining)}
            </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
            <button 
                onClick={reset}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text-s hover:text-white hover:bg-app-surface/80 transition-colors"
                aria-label="Reset"
            >
                <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {!isRunning ? (
                <button 
                onClick={handleStart}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-app-surface border border-app-border flex items-center justify-center hover:bg-app-surface/80 transition-all hover:scale-105"
                >
                    <Play className={`w-6 h-6 md:w-8 md:h-8 ml-1 ${phaseColor}`} />
                </button>
            ) : (
                <button 
                onClick={pause}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-app-surface border border-app-border flex items-center justify-center hover:bg-app-surface/80 transition-all hover:scale-105"
                >
                    <Pause className={`w-6 h-6 md:w-8 md:h-8 ${phaseColor}`} />
                </button>
            )}

            <button 
                onClick={() => { skipPhase(); if (!isRunning && autoTransition) start(); }}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text-s hover:text-white hover:bg-app-surface/80 transition-colors"
                aria-label="Skip"
            >
                <FastForward className="w-5 h-5 md:w-6 md:h-6" />
            </button>
        </div>

      </div>
    </div>
  );
}
