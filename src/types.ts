export interface Routine {
  id: string;
  categoryId: string | null;
  name: string;
  category: string;
  description: string | null;
  targetValue: number;
  targetUnit: string;
  sets?: number;
  icon?: string | null;
  isActive: boolean;
  autoImprovement: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RestrictedTask {
  id: string;
  name: string;
  icon?: string | null;
  isActive: boolean;
  schedule?: number[];
  createdAt: string;
}

export interface RestrictedCompletion {
  id: string;
  taskId: string;
  date: string;
  status: 'AVOIDED' | 'FAILED';
  createdAt: string;
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
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Section {
  id: string;
  name: string;
  createdAt: string;
}

export interface Category {
  id: string;
  sectionId: string;
  name: string;
  schedule: number[];
  createdAt: string;
}
