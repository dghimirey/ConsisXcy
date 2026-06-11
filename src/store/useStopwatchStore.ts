import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StopwatchState {
  isRunning: boolean;
  startTime: number | null;
  accumulatedTime: number;
  laps: number[];
  start: () => void;
  pause: () => void;
  reset: () => void;
  addLap: (lapTime: number) => void;
  getElapsed: () => number;
}

export const useStopwatchStore = create<StopwatchState>()(
  persist(
    (set, get) => ({
      isRunning: false,
      startTime: null,
      accumulatedTime: 0,
      laps: [],
      start: () => set((state) => {
        if (state.isRunning) return state;
        return { isRunning: true, startTime: Date.now() };
      }),
      pause: () => set((state) => {
        if (!state.isRunning) return state;
        const now = Date.now();
        const elapsedSinceStart = state.startTime ? now - state.startTime : 0;
        return {
          isRunning: false,
          accumulatedTime: state.accumulatedTime + elapsedSinceStart,
          startTime: null
        };
      }),
      reset: () => set({ isRunning: false, startTime: null, accumulatedTime: 0, laps: [] }),
      addLap: (lapTime) => set((state) => ({ laps: [...state.laps, lapTime] })),
      getElapsed: () => {
        const state = get();
        if (!state.isRunning) return state.accumulatedTime;
        return state.accumulatedTime + (state.startTime ? Date.now() - state.startTime : 0);
      }
    }),
    {
      name: 'consisxcy-stopwatch',
    }
  )
);
