import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Check, Flame, Trophy } from 'lucide-react';
import { useMemo } from 'react';
import confetti from 'canvas-confetti';
import { fetchRoutines, fetchCompletions, toggleCompletion, fetchStreaks, fetchCategories, fetchSections } from '../services/api';
import { Routine, Completion, Streak, Category, Section } from '../types';
import { HabitHeatmap } from '../components/HabitHeatmap';
import { formatTarget } from '../lib/utils';
import { calculateGlobalStreaks, calculateRoutineStreak } from '../lib/consistency';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const { data: routines = [] } = useQuery({ queryKey: ['routines'], queryFn: fetchRoutines });
  const { data: completions = [] } = useQuery({ queryKey: ['completions'], queryFn: fetchCompletions });
  const { data: streaks = [] } = useQuery({ queryKey: ['streaks'], queryFn: fetchStreaks });
  const { data: categoriesData = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const { data: sectionsData = [] } = useQuery({ queryKey: ['sections'], queryFn: fetchSections });

  // Dashboard behavior: Display only categories scheduled for today
  const currentDayIndex = new Date().getDay(); // 0 is Sunday
  
  const todayCategories = categoriesData.filter((c: Category) => {
    return c.schedule && Array.isArray(c.schedule) && c.schedule.includes(currentDayIndex);
  });
  const todayCategoryIds = todayCategories.map((c: Category) => c.id);

  const activeRoutines = routines.filter((r: Routine) => r.isActive && r.categoryId && todayCategoryIds.includes(r.categoryId));

  let filteredRoutines = [...activeRoutines];

  const routinesBySection = sectionsData.reduce((acc: Record<string, any>, section: Section) => {
    acc[section.id] = {
      section,
      routines: []
    };
    return acc;
  }, {});

  filteredRoutines.forEach(routine => {
    const category = categoriesData.find((c: Category) => c.id === routine.categoryId);
    if (category && category.sectionId) {
      if (routinesBySection[category.sectionId]) {
        routinesBySection[category.sectionId].routines.push({ ...routine, categoryName: category.name });
      }
    }
  });

  const activeSections = Object.values(routinesBySection).filter((s: any) => s.routines.length > 0);


  // Mark Completion Mutation with Optimistic Updates
  const mutation = useMutation({
    mutationFn: toggleCompletion,
    onMutate: async (newCompletion) => {
      await queryClient.cancelQueries({ queryKey: ['completions'] });
      const previousCompletions = queryClient.getQueryData<Completion[]>(['completions']);
      const parsedDate = new Date(newCompletion.date).toISOString();
      if (previousCompletions) {
        queryClient.setQueryData<Completion[]>(['completions'], old => {
          if (!old) return [];
          const existingIndex = old.findIndex(c => c.routineId === newCompletion.routineId && c.date === parsedDate);
          const tempId = `temp-${Date.now()}`;
          const updated = [...old];
          const newStatus = {
            id: tempId,
            routineId: newCompletion.routineId,
            date: parsedDate,
            status: newCompletion.status,
            value: newCompletion.value || null,
            targetValue: newCompletion.targetValue,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          if (existingIndex >= 0) {
            updated[existingIndex] = newStatus;
          } else {
            updated.push(newStatus);
          }
          return updated;
        });
      }
      return { previousCompletions };
    },
    onError: (err, newCompletion, context) => {
      if (context?.previousCompletions) {
        queryClient.setQueryData(['completions'], context.previousCompletions);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['completions'] });
      queryClient.invalidateQueries({ queryKey: ['streaks'] });
    },
  });

  const getDayStatus = (routineId: string) => {
    return completions.find(c => c.routineId === routineId && new Date(c.date).toISOString().split('T')[0] === todayStr)?.status;
  };

  const getStreak = (routineId: string) => {
     return calculateRoutineStreak(routineId, routines, categoriesData, completions);
  };

  const getMilestone = (streak: number) => {
    if (streak >= 100) return { name: '100-Day', icon: '👑', target: 365, textColor: 'text-purple-400', badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20', barColor: 'bg-purple-400' };
    if (streak >= 30) return { name: '30-Day', icon: '💎', target: 100, textColor: 'text-cyan-400', badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', barColor: 'bg-cyan-400' };
    if (streak >= 14) return { name: '14-Day', icon: '🏆', target: 30, textColor: 'text-yellow-400', badgeColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', barColor: 'bg-yellow-400' };
    if (streak >= 7) return { name: '7-Day', icon: '⭐', target: 14, textColor: 'text-amber-400', badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20', barColor: 'bg-amber-400' };
    if (streak >= 3) return { name: '3-Day', icon: '🔥', target: 7, textColor: 'text-orange-400', badgeColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20', barColor: 'bg-orange-400' };
    return { name: null, icon: '🔥', target: 3, textColor: 'text-orange-400', badgeColor: 'text-app-text-s/70 bg-app-surface/50 border-app-border', barColor: 'bg-orange-400' };
  }

  const userGlobalStreaks = useMemo(() => {
    return calculateGlobalStreaks(routines, categoriesData, completions);
  }, [routines, categoriesData, completions]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Global Streaks Section */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-8 md:mb-10">
        <div className="bg-app-glass border border-app-border rounded-[20px] p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-hidden relative group hover:border-app-text-s/30 transition-colors">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 relative z-10">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-app-accent shrink-0" />
            <h3 className="text-[10px] sm:text-xs uppercase tracking-wider text-app-text-s font-mono font-medium truncate">Current Streak</h3>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 lg:gap-6 relative z-10">
            <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white tracking-tight flex items-baseline gap-1.5 sm:gap-2">
              {userGlobalStreaks.current} <span className="text-xs sm:text-sm font-mono text-app-text-s tracking-normal font-normal">days</span>
            </p>
            {userGlobalStreaks.current > 0 && (() => {
               const milestone = getMilestone(userGlobalStreaks.current);
               const progress = Math.min(100, (userGlobalStreaks.current / milestone.target) * 100);
               return (
                  <div className={`mb-1 sm:mb-2 flex flex-col gap-1.5 ${milestone.textColor}`}>
                      <div className="flex items-center gap-1.5 text-xs font-mono tracking-wide">
                          <span>{milestone.icon}</span> 
                          {milestone.name && <span className="font-semibold">{milestone.name} Goal</span>}
                      </div>
                      <div className="flex items-center gap-2">
                          <div className="w-16 sm:w-24 border border-app-border h-1.5 sm:h-2 bg-black/30 rounded-full overflow-hidden">
                              <div className={`h-full ${milestone.barColor}`} style={{ width: `${progress}%` }} />
                          </div>
                           <span className="text-[10px] sm:text-xs font-mono opacity-70">{userGlobalStreaks.current}/{milestone.target}</span>
                      </div>
                  </div>
               );
            })()}
          </div>
          <div className="absolute -bottom-6 -right-6 sm:-bottom-10 sm:-right-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500">
             <Flame className="w-24 h-24 sm:w-48 sm:h-48" />
          </div>
        </div>

        <div className="bg-app-glass border border-app-border rounded-[20px] p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-hidden relative group hover:border-app-text-s/30 transition-colors">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 relative z-10">
             <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
            <h3 className="text-[10px] sm:text-xs uppercase tracking-wider text-app-text-s font-mono font-medium truncate">Longest Streak</h3>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 lg:gap-6 relative z-10">
            <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white tracking-tight flex items-baseline gap-1.5 sm:gap-2">
              {userGlobalStreaks.longest} <span className="text-xs sm:text-sm font-mono text-app-text-s tracking-normal font-normal">days</span>
            </p>
            {userGlobalStreaks.longest > 0 && (() => {
               const milestone = getMilestone(userGlobalStreaks.longest);
               return (
                  <div className={`mb-1 sm:mb-2 flex items-center gap-1.5 px-2 py-1 rounded-md border ${milestone.badgeColor} text-xs font-mono tracking-wide w-fit`}>
                      <span>{milestone.icon}</span> 
                      {milestone.name && <span className="font-semibold">{milestone.name} Achieved</span>}
                      {!milestone.name && <span className="font-semibold">Started</span>}
                  </div>
               );
            })()}
          </div>
          <div className="absolute -bottom-6 -right-6 sm:-bottom-10 sm:-right-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500">
             <Trophy className="w-24 h-24 sm:w-48 sm:h-48" />
          </div>
        </div>
      </div>

      <header className="mb-6 md:mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold mb-1.5 md:mb-2 tracking-tight text-white flex justify-between items-center">
              Today's Plan
            </h1>
            <p className="text-app-text-s font-mono text-xs md:text-sm uppercase tracking-wider">{format(new Date(), 'EEE, MMM d, yyyy')}</p>
          </div>
        </div>
      </header>

      <div className="space-y-6 mb-8 md:mb-12">
        {activeSections.length === 0 ? (
           <div className="text-center py-20 bg-app-glass border border-app-border rounded-[20px]">
              <p className="text-app-text-s">No routines scheduled for today.</p>
           </div>
        ) : (
          activeSections.map((sectionGroup: any) => {
            const { section, routines: secRoutines } = sectionGroup;
            const sectionRoutines = [...secRoutines];
            
            const completedCount = sectionRoutines.filter((r: any) => getDayStatus(r.id) === 'COMPLETED').length;
            const totalCount = sectionRoutines.length;

            return (
              <div key={section.id} className="bg-app-glass border border-app-border rounded-[20px] p-4 sm:p-5 md:p-6 flex flex-col gap-3 md:gap-4">
                <div className="flex justify-between items-center border-b border-app-border/50 pb-3 md:pb-4 mb-2">
                  <h2 className="text-lg md:text-xl font-display font-medium text-white truncate pr-2">{section.name}</h2>
                  <span className="text-[10px] md:text-sm font-mono text-app-text-s tracking-wide whitespace-nowrap">
                    {completedCount}/{totalCount} Completed
                  </span>
                </div>
                
                <div className="flex flex-col gap-1 md:gap-2">
                  <AnimatePresence mode="popLayout">
                    {sectionRoutines.map((routine: any) => {
                      const status = getDayStatus(routine.id);
                      const isCompleted = status === 'COMPLETED';
                      const currentStreak = getStreak(routine.id);
                      
                      return (
                          <motion.div 
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                              key={routine.id} 
                              className={`group px-3 py-3 md:px-4 md:py-3.5 -mx-3 md:-mx-4 rounded-[12px] flex items-center gap-3 md:gap-4 transition-all duration-300 cursor-pointer ${isCompleted ? 'bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)] scale-[0.99] hover:bg-emerald-500/15' : 'hover:bg-app-surface'}`}
                              onClick={(e) => {
                                 // To prevent double triggering if checkbox is clicked directly
                                 const target = e.target as HTMLElement;
                                 if (target.closest('button')) return;
                                 
                                 const newStatus = isCompleted ? 'MISSED' : 'COMPLETED';
                                 mutation.mutate({ routineId: routine.id, date: todayStr, status: newStatus, targetValue: routine.targetValue, value: newStatus === 'COMPLETED' ? routine.targetValue : 0 });
                                 if (newStatus === 'COMPLETED') {
                                     // Check if this completes the section
                                     const completesSection = sectionRoutines.every((r: any) => 
                                         r.id === routine.id || getDayStatus(r.id) === 'COMPLETED'
                                     );
                                     if (completesSection) {
                                         confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#c0ff00', '#ffffff', '#a8e6cf', '#ffdd00'], zIndex: 1000 });
                                     }
                                 }
                              }}
                          >
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newStatus = isCompleted ? 'MISSED' : 'COMPLETED';
                                    mutation.mutate({ routineId: routine.id, date: todayStr, status: newStatus, targetValue: routine.targetValue, value: newStatus === 'COMPLETED' ? routine.targetValue : 0 });
                                    
                                    if (newStatus === 'COMPLETED') {
                                        const completesSection = sectionRoutines.every((r: any) => 
                                            r.id === routine.id || getDayStatus(r.id) === 'COMPLETED'
                                        );
                                        if (completesSection) {
                                            confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#c0ff00', '#ffffff', '#a8e6cf', '#ffdd00'], zIndex: 1000 });
                                        }
                                    }
                                }}
                                className={`w-5 h-5 md:w-6 md:h-6 shrink-0 rounded-[6px] flex items-center justify-center transition-all duration-300 border shadow-sm ${isCompleted ? 'bg-emerald-500 border-emerald-400 text-constant-white shadow-[0_0_8px_rgba(16,185,129,0.4)] scale-110' : 'bg-transparent border-app-border text-transparent group-hover:border-app-text-s/70 hover:scale-105'}`}
                            >
                                <Check className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform duration-300 ${isCompleted ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'}`} strokeWidth={3} />
                            </button>
                            
                            <div className="flex flex-col gap-0.5 flex-1 select-none overflow-hidden">
                                <h3 className={`text-sm md:text-base font-medium transition-colors duration-300 truncate ${isCompleted ? 'text-white' : 'text-white group-hover:text-emerald-400'}`}>
                                    {routine.name}
                                </h3>
                                <div className="flex max-w-full overflow-x-auto hide-scrollbar">
                                    <div className="flex items-center gap-1.5 md:gap-2 mt-0.5 whitespace-nowrap min-w-max pb-0.5">
                                        <span className="text-[9px] md:text-[10px] font-mono px-1.5 md:px-2 py-0.5 rounded-md bg-app-surface/60 border border-app-border text-app-text-s tracking-wide uppercase">
                                          {routine.categoryName}
                                        </span>
                                        {currentStreak > 0 && (() => {
                                            const milestone = getMilestone(currentStreak);
                                            const progress = Math.min(100, (currentStreak / milestone.target) * 100);
                                            return (
                                                <div className={`flex items-center gap-1.5 px-1.5 py-0.5 md:py-1 rounded-md border ${milestone.badgeColor} transition-colors text-[9px] md:text-[10px] font-mono tracking-wide`}>
                                                    <div className="flex items-center gap-0.5 md:gap-1">
                                                        <span>{milestone.icon}</span>
                                                        <span className={milestone.textColor}>{currentStreak} <span className="hidden sm:inline">streak</span></span>
                                                    </div>
                                                    {milestone.name && (
                                                        <span className={`font-semibold ml-0.5 ${milestone.textColor}`}>{milestone.name}</span>
                                                    )}
                                                    <div className="flex items-center gap-1 sm:gap-1.5 ml-1 md:ml-1.5">
                                                        <div className="w-8 sm:w-10 h-1 sm:h-1.5 bg-black/20 rounded-full overflow-hidden">
                                                            <div className={`h-full ${milestone.barColor}`} style={{ width: `${progress}%` }} />
                                                        </div>
                                                        <span className="text-[8px] opacity-70 leading-none mt-[1px]">{currentStreak}/{milestone.target}</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                          </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="flex justify-center w-full">
          <HabitHeatmap />
      </div>
    </div>
  );
}
