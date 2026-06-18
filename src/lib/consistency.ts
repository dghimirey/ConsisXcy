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
    if (!r.categoryId || !scheduledCategoryIds.includes(r.categoryId)) return false;
    
    // Check if created before or on the date
    const createdDateStr = new Date(r.createdAt).toISOString().split('T')[0];
    if (createdDateStr > dateStr) return false;

    if (r.isActive) return true;

    if (dateStr >= todayStr) return false;

    // For paused routines, they are expected only up to their most recent action (completion or miss)
    const pastRecords = completions
      .filter(c => c.routineId === r.id)
      .map(c => typeof c.date === 'string' ? c.date.substring(0, 10) : new Date(c.date).toISOString().substring(0, 10));
    
    if (pastRecords.length === 0) return false; // Never interacted with, so not expected in the past
    
    const lastRecordDate = pastRecords.reduce((a, b) => a > b ? a : b);
    return dateStr <= lastRecordDate;
  });

  let totalTasks = expectedRoutines.length;

  if (totalTasks === 0) return { status: 'NONE', percentage: 0, totalTasks: 0, completedTasks: 0 };

  // Find completions for the date
  const filteredCompletions = completions.filter((c: any) => {
    const cDateStr = typeof c.date === 'string' ? c.date.substring(0, 10) : new Date(c.date).toISOString().substring(0, 10);
    return cDateStr === dateStr;
  });

  let completedTasks = 0;
  let explicitlyMissed = 0;
  let freezedTasks = 0;

  expectedRoutines.forEach(routine => {
    const status = filteredCompletions.find(c => c.routineId === routine.id)?.status;
    if (status === 'COMPLETED') {
      completedTasks++;
    } else if (status === 'FREEZED') {
      freezedTasks++;
    } else if (status === 'MISSED') {
      explicitlyMissed++;
    } else if (!isDayEnded && routine.deadline) {
       const now = dayjs();
       const deadlineTime = dayjs(`${dateStr}T${routine.deadline}`);
       if (now.isAfter(deadlineTime)) {
          explicitlyMissed++;
       }
    }
  });

  const percentage = Math.round((completedTasks / totalTasks) * 100);

  if (completedTasks === totalTasks && totalTasks > 0) {
    return { status: 'ALL', percentage, totalTasks, completedTasks };
  } else if (completedTasks + freezedTasks === totalTasks && totalTasks > 0) {
    return { status: 'FREEZED', percentage, totalTasks, completedTasks };
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
  
  // If active, we evaluate up to today.
  let limitDate = dayjs().startOf('day').add(1, 'day'); // Include today
  if (!routine.isActive) {
     const lastRecordTime = Math.max(...startDates);
     limitDate = dayjs(lastRecordTime).startOf('day').add(1, 'day');
  }

  let currentStreak = 0;
  
  while (currDate.isBefore(limitDate)) {
    const dayIndex = currDate.day();
    const dateStr = currDate.format('YYYY-MM-DD');
    const isToday = dateStr === dayjs().format('YYYY-MM-DD');
    
    // Only care if scheduled
    if (category.schedule.includes(dayIndex)) {
       let status = routineCompletions.find(c => {
         const cDateStr = typeof c.date === 'string' ? c.date.substring(0, 10) : new Date(c.date).toISOString().substring(0, 10);
         return cDateStr === dateStr;
       })?.status;

       if (!status && isToday && routine.deadline) {
          const now = dayjs();
          const deadlineTime = dayjs(`${dateStr}T${routine.deadline}`);
          if (now.isAfter(deadlineTime)) {
             status = 'MISSED';
          }
       }

       if (status === 'COMPLETED') {
         currentStreak++;
       } else if (status === 'FREEZED') {
         // Freeze protects the streak from breaking but doesn't increment
       } else if (status === 'MISSED' || (!routine.isActive && !isToday && currDate.isBefore(limitDate.subtract(1, 'day'))) || (routine.isActive && !isToday && currDate.isBefore(limitDate))) {
         // Missed a scheduled day in the past, or missed today (if explicitly marked/expired)
         if (status === 'MISSED' || (!isToday && !status)) {
           currentStreak = 0;
         }
       }
    }
    
    currDate = currDate.add(1, 'day');
  }

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

  // Calculate last 7 days history
  const last7Days: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    const dStr = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    const result = getDayCompletionStatus(dStr, routines, categories, completions);
    last7Days.push(result.status === 'ALL');
  }

  // Check if yesterday was explicitly missed
  const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const yesterdayResult = getDayCompletionStatus(yesterdayStr, routines, categories, completions);
  const wasYesterdayMissed = yesterdayResult.status === 'MISSED' || yesterdayResult.status === 'SOME';

  return { 
    current: currentStreak + (todayCompleted ? 1 : 0), 
    longest: Math.max(longestStreak, currentStreak + (todayCompleted ? 1 : 0)), 
    isAtRisk, 
    todayCompleted,
    todayPercentage: todayResult.percentage,
    last7Days,
    wasYesterdayMissed
  };
}

export function getRestrictedDayCompletionStatus(
  dateStr: string,
  restrictedTasks: import('../types').RestrictedTask[],
  restrictedCompletions: import('../types').RestrictedCompletion[]
) {
  const date = dayjs(dateStr);
  const dayIndex = date.day(); // 0 is Sunday, 6 is Saturday
  const todayStr = dayjs().format('YYYY-MM-DD');
  const isDayEnded = dateStr < todayStr;

  // Find active restricted tasks scheduled for this day
  const expectedTasks = restrictedTasks.filter(t => {
    // Check if created before or on the date
    const createdDateStr = new Date(t.createdAt).toISOString().split('T')[0];
    if (createdDateStr > dateStr) return false;

    if (!t.isActive && dateStr >= todayStr) return false;

    if (!t.schedule || t.schedule.length === 0) return true;
    return t.schedule.includes(dayIndex);
  });

  const totalTasks = expectedTasks.length;
  if (totalTasks === 0) return { status: 'NONE', percentage: 0, totalTasks: 0, avoidedTasks: 0, failedTasks: 0 };

  const filteredCompletions = restrictedCompletions.filter((c: any) => {
    const cDateStr = typeof c.date === 'string' ? c.date.substring(0, 10) : new Date(c.date).toISOString().substring(0, 10);
    return cDateStr === dateStr;
  });

  let avoidedTasks = 0;
  let failedTasks = 0;

  expectedTasks.forEach(task => {
    const status = filteredCompletions.find(c => c.taskId === task.id)?.status;
    if (status === 'AVOIDED') {
      avoidedTasks++;
    } else if (status === 'FAILED') {
      failedTasks++;
    } else if (isDayEnded) {
       // Automatic failure if not avoiding past tasks
       failedTasks++;
    } else if (dateStr === todayStr) {
       // For today, if no record and time is past 12:00AM, but 12:00AM just means next day right?
       // user said: "if nothing done until 12:00AM, it will automatically set to failed"
       // This implies when the day is over (isDayEnded), so wait until next day, it becomes failed. Same logic as isDayEnded above.
    }
  });

  let percentage = 0;
  if (totalTasks > 0) {
     // AVOIDED is good, FAILED is bad. PENDING means we don't count yet, except for calculating full success metric?
     // Actually percentage could just be (avoided / total)*100
     percentage = Math.round((avoidedTasks / totalTasks) * 100);
  }

  if (avoidedTasks === totalTasks && totalTasks > 0) {
    return { status: 'ALL_AVOIDED', percentage: 100, totalTasks, avoidedTasks, failedTasks };
  } else if (failedTasks > 0) {
    return { status: 'FAILED_SOME', percentage, totalTasks, avoidedTasks, failedTasks };
  } else if (avoidedTasks > 0) {
    return { status: 'SOME_AVOIDED', percentage, totalTasks, avoidedTasks, failedTasks };
  } else {
    // Day isn't over, 0 progress
    return { status: 'PENDING', percentage: 0, totalTasks, avoidedTasks, failedTasks };
  }
}
