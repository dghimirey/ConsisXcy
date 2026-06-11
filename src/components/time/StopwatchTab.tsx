import React, { useEffect, useState, useRef } from 'react';
import { useStopwatchStore } from '../../store/useStopwatchStore';
import { Play, Pause, RotateCcw, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);

  const pad = (num: number, size = 2) => num.toString().padStart(size, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
}

export function StopwatchTab() {
  const { isRunning, start, pause, reset, getElapsed, laps, addLap } = useStopwatchStore();
  const [elapsed, setElapsed] = useState(getElapsed());
  const requestRef = useRef<number>();

  const update = () => {
    setElapsed(getElapsed());
    if (isRunning) {
      requestRef.current = requestAnimationFrame(update);
    }
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning, getElapsed]);

  const handleLap = () => {
    addLap(elapsed);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
      <div className="bg-app-glass border border-app-border rounded-[32px] p-8 md:p-12 w-full flex flex-col items-center shadow-lg relative overflow-hidden">
        
        {/* Time Display */}
        <div className="text-5xl md:text-7xl font-mono font-bold text-white tracking-tight tabular-nums mb-12">
          {formatTime(elapsed)}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 md:gap-6">
          {!isRunning ? (
            <button 
              onClick={start}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/20 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              aria-label="Start"
            >
              <Play className="w-6 h-6 md:w-8 md:h-8 ml-1" />
            </button>
          ) : (
            <button 
              onClick={pause}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center hover:bg-amber-500/20 transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              aria-label="Pause"
            >
              <Pause className="w-6 h-6 md:w-8 md:h-8" />
            </button>
          )}

          <div className="flex flex-col gap-3">
             <button 
                onClick={handleLap}
                disabled={!isRunning}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text-s hover:text-white hover:bg-app-surface/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Lap"
              >
                <Flag className="w-5 h-5 md:w-6 md:h-6" />
             </button>
             <button 
                onClick={reset}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text-s hover:text-white hover:bg-app-surface/80 transition-colors"
                aria-label="Reset"
              >
                <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
             </button>
          </div>
        </div>

        {/* Laps */}
        {laps.length > 0 && (
          <div className="w-full mt-10 border-t border-app-border pt-6 flex flex-col gap-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
                {[...laps].reverse().map((lap, index) => {
                  const lapNumber = laps.length - index;
                  const previousLap = laps.length - index - 1 > 0 ? laps[laps.length - index - 2] : 0;
                  const lapDifference = lap - previousLap;

                  return (
                    <motion.div 
                      key={lapNumber}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between py-2 px-4 rounded-xl bg-app-surface/50 border border-app-border/50 text-app-text-s font-mono"
                    >
                      <span>Lap {lapNumber}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-white">{formatTime(lap)}</span>
                        <span className="text-app-text-p w-24 text-right">+{formatTime(lapDifference)}</span>
                      </div>
                    </motion.div>
                  )
                })}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
}
