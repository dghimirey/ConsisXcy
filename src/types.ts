export interface Routine {
  id: string;
  name: string;
  category: string;
  description: string | null;
  targetValue: number;
  targetUnit: string;
  isActive: boolean;
  autoImprovement: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Completion {
  id: string;
  routineId: string;
  date: string;
  status: 'COMPLETED' | 'PARTIAL' | 'MISSED';
  value: number | null;
  targetValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface Streak {
  id: string;
  routineId: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletedDays: number;
  lastCompletedDate: string | null;
  updatedAt: string;
}

export interface User {
  email: string;
}
