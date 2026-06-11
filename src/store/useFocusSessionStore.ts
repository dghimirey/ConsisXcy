import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FocusSession {
  id: string;
  title: string;
  subject?: string;
  duration: number; // in ms
  completed: boolean;
  date: string; // ISO string
}

interface FocusSessionState {
  sessions: FocusSession[];
  
  // Active state
  activeSessionId: string | null;
  isRunning: boolean;
  startTime: number | null;
  remainingTimeAtPause: number | null;

  addSession: (title: string, duration: number, subject?: string) => void;
  startSession: (id: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: (completed: boolean) => void;
  deleteSession: (id: string) => void;
  getRemaining: () => number;
  getActiveSession: () => FocusSession | null;
}

export const useFocusSessionStore = create<FocusSessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      isRunning: false,
      startTime: null,
      remainingTimeAtPause: null,

      addSession: (title, duration, subject) => set((state) => {
        const newSession: FocusSession = {
          id: crypto.randomUUID(),
          title,
          subject,
          duration,
          completed: false,
          date: new Date().toISOString()
        };
        return { sessions: [newSession, ...state.sessions] };
      }),

      startSession: (id) => set((state) => {
        const session = state.sessions.find(s => s.id === id);
        if (!session) return state;

        return {
          activeSessionId: id,
          isRunning: true,
          startTime: Date.now(),
          remainingTimeAtPause: session.duration
        };
      }),

      pauseSession: () => set((state) => {
        if (!state.isRunning) return state;
        const now = Date.now();
        const elapsedSinceStart = state.startTime ? now - state.startTime : 0;
        const previousRemaining = state.remainingTimeAtPause !== null ? state.remainingTimeAtPause : 0;
        const newRemaining = Math.max(0, previousRemaining - elapsedSinceStart);
        return {
          isRunning: false,
          remainingTimeAtPause: newRemaining,
          startTime: null
        };
      }),

      resumeSession: () => set((state) => {
        if (state.isRunning || !state.activeSessionId) return state;
        return { isRunning: true, startTime: Date.now() };
      }),

      stopSession: (completed) => set((state) => {
        if (!state.activeSessionId) return state;
        
        const updatedSessions = state.sessions.map(s => {
          if (s.id === state.activeSessionId) {
            return { ...s, completed };
          }
          return s;
        });

        return {
          sessions: updatedSessions,
          activeSessionId: null,
          isRunning: false,
          startTime: null,
          remainingTimeAtPause: null
        };
      }),

      deleteSession: (id) => set((state) => {
        const remaining = state.sessions.filter(s => s.id !== id);
        if (state.activeSessionId === id) {
           return { sessions: remaining, activeSessionId: null, isRunning: false, startTime: null, remainingTimeAtPause: null };
        }
        return { sessions: remaining };
      }),

      getRemaining: () => {
        const state = get();
        if (!state.activeSessionId || state.remainingTimeAtPause === null) return 0;
        if (!state.isRunning) return state.remainingTimeAtPause;

        const now = Date.now();
        const elapsedSinceStart = state.startTime ? now - state.startTime : 0;
        return Math.max(0, state.remainingTimeAtPause - elapsedSinceStart);
      },

      getActiveSession: () => {
        const state = get();
        if (!state.activeSessionId) return null;
        return state.sessions.find(s => s.id === state.activeSessionId) || null;
      }
    }),
    {
      name: 'consisxcy-focus-sessions',
    }
  )
);
