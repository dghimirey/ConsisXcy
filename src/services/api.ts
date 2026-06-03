import { Routine, Completion, Streak, User } from '../types';

export const fetchRoutines = async (): Promise<Routine[]> => {
  const res = await fetch('/api/routines');
  if (!res.ok) throw new Error('Failed to fetch routines');
  return res.json();
};

export const createRoutine = async (data: Partial<Routine>): Promise<Routine> => {
  const res = await fetch('/api/routines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create routine');
  return res.json();
};

export const updateRoutine = async (id: string, data: Partial<Routine>): Promise<Routine> => {
  const res = await fetch(`/api/routines/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update routine');
  return res.json();
};

export const deleteRoutine = async (id: string): Promise<void> => {
  const res = await fetch(`/api/routines/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete routine');
};

export const fetchCompletions = async (): Promise<Completion[]> => {
  const res = await fetch('/api/completions');
  if (!res.ok) throw new Error('Failed to fetch completions');
  return res.json();
};

export const toggleCompletion = async (data: { routineId: string; date: string; status: 'COMPLETED' | 'PARTIAL' | 'MISSED'; value?: number; targetValue: number }): Promise<Completion> => {
  const res = await fetch('/api/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to toggle completion');
  return res.json();
};

export const fetchStreaks = async (): Promise<Streak[]> => {
  const res = await fetch('/api/streaks');
  if (!res.ok) throw new Error('Failed to fetch streaks');
  return res.json();
};

export const checkAuth = async (): Promise<{ user?: User }> => {
  const res = await fetch('/api/auth/me');
  if (res.status === 401) throw new Error('Unauthorized');
  return res.json();
};
