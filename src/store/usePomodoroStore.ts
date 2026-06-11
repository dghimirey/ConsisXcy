import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak';

interface PomodoroState {
  phase: PomodoroPhase;
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  cyclesCompleted: number;
  isRunning: boolean;
  startTime: number | null;
  remainingTimeAtPause: number | null;
  autoTransition: boolean;

  setDurations: (focus: number, shortBreak: number, longBreak: number) => void;
  setAutoTransition: (val: boolean) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skipPhase: () => void;
  completePhase: () => void;
  getRemaining: () => number;
}

const DEFAULT_FOCUS = 25 * 60 * 1000;
const DEFAULT_SHORT_BREAK = 5 * 60 * 1000;
const DEFAULT_LONG_BREAK = 15 * 60 * 1000;

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      phase: 'focus',
      focusDuration: DEFAULT_FOCUS,
      shortBreakDuration: DEFAULT_SHORT_BREAK,
      longBreakDuration: DEFAULT_LONG_BREAK,
      cyclesCompleted: 0,
      isRunning: false,
      startTime: null,
      remainingTimeAtPause: DEFAULT_FOCUS,
      autoTransition: false,

      setDurations: (focus, shortBreak, longBreak) => set({
        focusDuration: focus,
        shortBreakDuration: shortBreak,
        longBreakDuration: longBreak,
        remainingTimeAtPause: focus,
        phase: 'focus',
        isRunning: false,
        startTime: null,
      }),

      setAutoTransition: (val) => set({ autoTransition: val }),

      start: () => set((state) => {
        if (state.isRunning) return state;
        return { isRunning: true, startTime: Date.now() };
      }),

      pause: () => set((state) => {
        if (!state.isRunning) return state;
        const now = Date.now();
        const elapsedSinceStart = state.startTime ? now - state.startTime : 0;
        const previousRemaining = state.remainingTimeAtPause !== null ? state.remainingTimeAtPause : state.focusDuration;
        const newRemaining = Math.max(0, previousRemaining - elapsedSinceStart);
        return {
          isRunning: false,
          remainingTimeAtPause: newRemaining,
          startTime: null
        };
      }),

      reset: () => set((state) => {
        let duration = state.focusDuration;
        if (state.phase === 'shortBreak') duration = state.shortBreakDuration;
        if (state.phase === 'longBreak') duration = state.longBreakDuration;

        return {
          isRunning: false,
          startTime: null,
          remainingTimeAtPause: duration
        };
      }),

      skipPhase: () => {
        const state = get();
        state.completePhase();
      },

      completePhase: () => set((state) => {
        let nextPhase: PomodoroPhase = 'focus';
        let newCycles = state.cyclesCompleted;

        if (state.phase === 'focus') {
          newCycles += 1;
          if (newCycles % 4 === 0) {
            nextPhase = 'longBreak';
          } else {
            nextPhase = 'shortBreak';
          }
        } else {
          nextPhase = 'focus';
        }

        let nextDuration = state.focusDuration;
        if (nextPhase === 'shortBreak') nextDuration = state.shortBreakDuration;
        if (nextPhase === 'longBreak') nextDuration = state.longBreakDuration;

        return {
          phase: nextPhase,
          cyclesCompleted: newCycles,
          remainingTimeAtPause: nextDuration,
          isRunning: state.autoTransition,
          startTime: state.autoTransition ? Date.now() : null
        };
      }),

      getRemaining: () => {
        const state = get();
        if (!state.isRunning) {
          if (state.remainingTimeAtPause !== null) return state.remainingTimeAtPause;
          if (state.phase === 'focus') return state.focusDuration;
          if (state.phase === 'shortBreak') return state.shortBreakDuration;
          if (state.phase === 'longBreak') return state.longBreakDuration;
          return 0;
        }

        const now = Date.now();
        const elapsedSinceStart = state.startTime ? now - state.startTime : 0;
        const previousRemaining = state.remainingTimeAtPause !== null ? state.remainingTimeAtPause : state.focusDuration;
        return Math.max(0, previousRemaining - elapsedSinceStart);
      }
    }),
    {
      name: 'consisxcy-pomodoro',
    }
  )
);
