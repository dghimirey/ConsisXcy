import dayjs from 'dayjs';
import { Routine, Category, Completion } from '../types';

export function getDayCompletionStatus(
  dateStr: string, 
  routines: Routine[], 
  categories: Category[], 
  completions: Completion[],
  sectionIdFilter: string = 'All'
) {
  const date = dayjs(dateStr);
  const dayIndex = date.day(); // 0 is Sunday, 6 is Saturday
  const todayStr = dayjs().format('YYYY-MM-DD');
  const isDayEnded = dateStr < todayStr;

  // Find categories scheduled for this day
  const scheduledCategories = categories.filter(c => {
    return c.schedule && Array.isArray(c.schedule) && c.schedule.includes(dayIndex);
  });
  const scheduledCategoryIds = scheduledCategories.map(c => c.id);

  // Find routines expected for this day
  const expectedRoutines = routines.filter(r => {
    const routineCategory = categories.find(c => c.id === r.categoryId);
    if (sectionIdFilter !== 'All' && (!routineCategory || routineCategory.sectionId !== sectionIdFilter)) return false;
    if (!r.isActive) return false;
    if (!r.categoryId || !scheduledCategoryIds.includes(r.categoryId)) return false;
    
    // Check if created before or on the date
    const createdDateStr = new Date(r.createdAt).toISOString().split('T')[0];
    return createdDateStr <= dateStr;
  });

  const totalTasks = expectedRoutines.length;

  if (totalTasks === 0) return { status: 'NONE', percentage: 0, totalTasks: 0, completedTasks: 0 };

  // Find completions for the date
  const filteredCompletions = completions.filter((c: any) => {
    const cDateStr = typeof c.date === 'string' ? c.date.substring(0, 10) : new Date(c.date).toISOString().substring(0, 10);
    return cDateStr === dateStr;
  });

  let completedTasks = 0;
  let explicitlyMissed = 0;

  expectedRoutines.forEach(routine => {
    const status = filteredCompletions.find(c => c.routineId === routine.id)?.status;
    if (status === 'COMPLETED') {
      completedTasks++;
    } else if (status === 'MISSED') {
      explicitlyMissed++;
    }
  });

  const percentage = Math.round((completedTasks / totalTasks) * 100);

  if (completedTasks === totalTasks && totalTasks > 0) {
    return { status: 'ALL', percentage, totalTasks, completedTasks };
  } else if (isDayEnded) {
    // If day is over and not ALL, it's MISSED
    return { status: 'MISSED', percentage, totalTasks, completedTasks };
  } else if (completedTasks > 0) {
    // Day isn't over, but some progress made
    return { status: 'SOME', percentage, totalTasks, completedTasks };
  } else {
    // Day isn't over, 0 progress
    if (explicitlyMissed === totalTasks && totalTasks > 0) {
      return { status: 'MISSED', percentage: 0, totalTasks, completedTasks };
    }
    return { status: 'PENDING', percentage: 0, totalTasks, completedTasks };
  }
}

export function calculateRoutineStreak(
  routineId: string,
  routines: Routine[],
  categories: Category[],
  completions: Completion[]
) {
  const routine = routines.find(r => r.id === routineId);
  if (!routine || !routine.categoryId) return 0;
  const category = categories.find(c => c.id === routine.categoryId);
  if (!category || !category.schedule || !Array.isArray(category.schedule)) return 0;

  const routineCompletions = completions.filter(c => c.routineId === routineId);
  if (routineCompletions.length === 0) return 0;

  const createdDateStr = new Date(routine.createdAt).toISOString().split('T')[0];
  const startDates = routineCompletions.map(c => new Date(c.date).getTime());
  const earliestTime = Math.min(...startDates, new Date(createdDateStr).getTime());
  
  let currDate = dayjs(earliestTime).startOf('day');
  const today = dayjs().startOf('day');

  let currentStreak = 0;
  
  while (currDate.isBefore(today)) {
    const dayIndex = currDate.day();
    const dateStr = currDate.format('YYYY-MM-DD');
    
    // Only care if scheduled
    if (category.schedule.includes(dayIndex)) {
       const status = routineCompletions.find(c => {
         const cDateStr = typeof c.date === 'string' ? c.date.substring(0, 10) : new Date(c.date).toISOString().substring(0, 10);
         return cDateStr === dateStr;
       })?.status;

       if (status === 'COMPLETED') {
         currentStreak++;
       } else if (status === 'MISSED' || currDate.isBefore(today)) {
         currentStreak = 0; // Missed a scheduled day
       }
    }
    
    currDate = currDate.add(1, 'day');
  }

  // Check today is not needed since streak is up to yesterday
  // We do not break or increase the streak for today based on new rules
  return currentStreak;
}

export function getMilestone(streak: number) {
  if (streak >= 365) return { name: '1-Year', icon: '🌟', target: 1000, textColor: 'text-amber-300', badgeColor: 'text-amber-300 bg-amber-400/10 border-amber-400/20', barColor: 'bg-amber-300' };
  if (streak >= 100) return { name: '100-Day', icon: '👑', target: 365, textColor: 'text-purple-400', badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20', barColor: 'bg-purple-400' };
  if (streak >= 50) return { name: '50-Day', icon: '🌠', target: 100, textColor: 'text-indigo-400', badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', barColor: 'bg-indigo-400' };
  if (streak >= 30) return { name: '30-Day', icon: '💎', target: 50, textColor: 'text-cyan-400', badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', barColor: 'bg-cyan-400' };
  if (streak >= 14) return { name: '14-Day', icon: '🏆', target: 30, textColor: 'text-yellow-400', badgeColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', barColor: 'bg-yellow-400' };
  if (streak >= 7) return { name: '7-Day', icon: '⭐', target: 14, textColor: 'text-amber-400', badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20', barColor: 'bg-amber-400' };
  if (streak >= 3) return { name: '3-Day', icon: '🔥', target: 7, textColor: 'text-orange-400', badgeColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20', barColor: 'bg-orange-400' };
  return { name: null, icon: '🔥', target: 3, textColor: 'text-orange-400', badgeColor: 'text-app-text-s/70 bg-app-surface/50 border-app-border', barColor: 'bg-orange-400' };
}

export function calculateGlobalStreaks(
  routines: Routine[], 
  categories: Category[], 
  completions: Completion[]
) {
  if (routines.length === 0 || categories.length === 0) {
    return { current: 0, longest: 0, isAtRisk: false, todayCompleted: false };
  }

  const startDates = routines.map(r => r.createdAt ? new Date(r.createdAt).getTime() : Date.now());
  const earliestTime = Math.min(...startDates, Date.now() - 30 * 24 * 60 * 60 * 1000); 
  let currDate = dayjs(earliestTime).startOf('day');
  const today = dayjs().startOf('day');

  let currentStreak = 0;
  let longestStreak = 0;

  while (currDate.isBefore(today)) {
    const dateStr = currDate.format('YYYY-MM-DD');
    const result = getDayCompletionStatus(dateStr, routines, categories, completions);
    const status = result.status;
    
    if (status === 'ALL') {
      currentStreak++;
      if (currentStreak > longestStreak) longestStreak = currentStreak;
    } else if (status === 'SOME' || status === 'MISSED') {
      // Failed to complete all tasks on a past day
      currentStreak = 0;
    } else if (status === 'NONE') {
      // Rest day (no tasks scheduled). Streak doesn't break, doesn't increment.
      // Or if tasks were scheduled but none done, if it's past it should be MISSED.
    }
    
    currDate = currDate.add(1, 'day');
  }
  
  // Now evaluate today WITHOUT breaking the streak prematurely
  const todayStr = dayjs().format('YYYY-MM-DD');
  const todayResult = getDayCompletionStatus(todayStr, routines, categories, completions);
  const todayStatus = todayResult.status;

  const todayCompleted = (todayStatus === 'ALL');
  
  // They are at risk if today isn't completed and there are tasks to do and they had a streak before today.
  // Actually, even if they explicitly missed, they have till midnight to change it.
  const isAtRisk = !todayCompleted && todayResult.totalTasks > 0;

  return { 
    current: currentStreak + (todayCompleted ? 1 : 0), 
    longest: Math.max(longestStreak, currentStreak + (todayCompleted ? 1 : 0)), 
    isAtRisk, 
    todayCompleted,
    todayPercentage: todayResult.percentage
  };
}
