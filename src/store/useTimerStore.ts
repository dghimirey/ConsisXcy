import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  targetDuration: number; // in milliseconds
  remainingTimeAtPause: number | null;
  setDuration: (duration: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  getRemaining: () => number;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      isRunning: false,
      startTime: null,
      targetDuration: 0,
      remainingTimeAtPause: null,
      setDuration: (duration) => set({ targetDuration: duration, remainingTimeAtPause: duration, isRunning: false, startTime: null }),
      start: () => set((state) => {
        if (state.isRunning || state.targetDuration === 0) return state;
         // If remainingTimeAtPause is 0, we shouldn't start (it's finished)
        if (state.remainingTimeAtPause === 0) return state;

        return { isRunning: true, startTime: Date.now() };
      }),
      pause: () => set((state) => {
        if (!state.isRunning) return state;
        const now = Date.now();
        const elapsedSinceStart = state.startTime ? now - state.startTime : 0;
        const previousRemaining = state.remainingTimeAtPause !== null ? state.remainingTimeAtPause : state.targetDuration;
        const newRemaining = Math.max(0, previousRemaining - elapsedSinceStart);
        return {
          isRunning: false,
          remainingTimeAtPause: newRemaining,
          startTime: null
        };
      }),
      reset: () => set((state) => ({ isRunning: false, startTime: null, remainingTimeAtPause: state.targetDuration })),
      getRemaining: () => {
        const state = get();
        if (!state.isRunning) {
          return state.remainingTimeAtPause !== null ? state.remainingTimeAtPause : state.targetDuration;
        }
        const now = Date.now();
        const elapsedSinceStart = state.startTime ? now - state.startTime : 0;
        const previousRemaining = state.remainingTimeAtPause !== null ? state.remainingTimeAtPause : state.targetDuration;
        return Math.max(0, previousRemaining - elapsedSinceStart);
      }
    }),
    {
      name: 'consisxcy-timer',
    }
  )
);
