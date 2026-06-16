import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { fetchRoutines, fetchCompletions, toggleCompletion, fetchStreaks, fetchCategories, fetchSections, fetchRestrictedTasks, fetchRestrictedCompletions, toggleRestrictedCompletion } from '../services/api';
import { Routine, Completion, Category, Section, RestrictedTask, RestrictedCompletion } from '../types';
import { StreakCounter } from '../components/StreakCounter';
import { RestrictedTasksList } from '../components/RestrictedTasksList';
import { getIcon } from '../lib/icons';
import { calculateGlobalStreaks, calculateRoutineStreak, getMilestone, getDayCompletionStatus } from '../lib/consistency';
import { triggerRoutineCompletion, triggerDailyCompletion, triggerMilestone, triggerPerfectWeek, triggerPersonalBest } from '../lib/celebrations';
import { SoundService } from '../services/SoundService';
import dayjs from 'dayjs';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

    const [selectedSection, setSelectedSection] = useState<string>('All');

    const { data: routines = [] } = useQuery({ queryKey: ['routines'], queryFn: fetchRoutines });
    const { data: completions = [] } = useQuery({ queryKey: ['completions'], queryFn: fetchCompletions });
    const { data: streaks = [] } = useQuery({ queryKey: ['streaks'], queryFn: fetchStreaks });
    const { data: categoriesData = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
    const { data: sectionsData = [] } = useQuery({ queryKey: ['sections'], queryFn: fetchSections });

    const { data: restrictedTasks = [] } = useQuery({ queryKey: ['restrictedTasks'], queryFn: fetchRestrictedTasks });
    const { data: restrictedCompletions = [] } = useQuery({ queryKey: ['restrictedCompletions'], queryFn: fetchRestrictedCompletions });

    // Dashboard behavior: Display only categories scheduled for today
    const currentDayIndex = new Date().getDay(); // 0 is Sunday
    
    const todayCategories = categoriesData.filter((c: Category) => {
      return c.schedule && Array.isArray(c.schedule) && c.schedule.includes(currentDayIndex);
    });
    const todayCategoryIds = todayCategories.map((c: Category) => c.id);
    const todaySectionIds = Array.from(new Set(todayCategories.map((c: Category) => c.sectionId)));
    const todaySections = sectionsData.filter((s: Section) => todaySectionIds.includes(s.id));

    const activeRoutines = routines.filter((r: Routine) => {
       const cat = categoriesData.find((c: Category) => c.id === r.categoryId);
       return r.isActive && 
       r.categoryId && 
       todayCategoryIds.includes(r.categoryId) &&
       (selectedSection === 'All' || (cat && cat.sectionId === selectedSection));
    });

    let filteredRoutines = [...activeRoutines];

  // Find routines expected for this day
  const pausedRoutines = routines.filter((r: Routine) => {
     const cat = categoriesData.find((c: Category) => c.id === r.categoryId);
     return !r.isActive && 
     r.categoryId && 
     todayCategoryIds.includes(r.categoryId) &&
     (selectedSection === 'All' || (cat && cat.sectionId === selectedSection));
  });

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

  const handleCompletion = (el: HTMLElement | null, routineId: string, newStatus: string) => {
    if (newStatus !== 'COMPLETED') return;

    if (el) triggerRoutineCompletion(el);

    // Predict if day will be completed
    const currentDayStatus = getDayCompletionStatus(todayStr, routines, categoriesData, completions, 'All');
    
    // Will it be completed now?
    const isAlreadyCompleted = getDayStatus(routineId) === 'COMPLETED';
    if (isAlreadyCompleted) return; // shouldn't happen but defensive

    const pendingRoutines = currentDayStatus.totalTasks - currentDayStatus.completedTasks;
    if (pendingRoutines === 1) { 
        setTimeout(() => triggerDailyCompletion(), 1000);

        // Also check global streak
        const tempCompletions = [...completions, { routineId, date: todayStr, status: 'COMPLETED' } as any];
        const newStreaks = calculateGlobalStreaks(routines, categoriesData, tempCompletions);
        
        if (newStreaks.current > 0) {
            const ms = newStreaks.current;
            if ([3, 7, 14, 30, 50, 100, 365].includes(ms)) {
                setTimeout(() => triggerMilestone(ms), 2000);
            } else if (ms > userGlobalStreaks.longest && userGlobalStreaks.longest > 0) {
                setTimeout(() => triggerPersonalBest(), 2000);
            } else {
                // If it happened to be Sunday, perfect week? This requires logic we can omit for now 
                // unless we want to calculate week completions. Let's omit Perfect Week checking here for simplicity 
                // or just trigger Perfect Day instead. Daily completion ALREADY says "All Routines Finished".
            }
        }
    }
  };

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

  const getDayCompletionValue = (routineId: string) => {
    return completions.find(c => c.routineId === routineId && new Date(c.date).toISOString().split('T')[0] === todayStr)?.value || 0;
  };

  const getStreak = (routineId: string) => {
     return calculateRoutineStreak(routineId, routines, categoriesData, completions);
  };

  const restrictedMutation = useMutation({
    mutationFn: toggleRestrictedCompletion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restrictedCompletions'] });
    }
  });

  const getRestrictedStatus = (taskId: string) => {
    return restrictedCompletions.find(c => c.taskId === taskId && new Date(c.date).toISOString().split('T')[0] === todayStr)?.status;
  };

  const userGlobalStreaks = useMemo(() => {
    return calculateGlobalStreaks(routines, categoriesData, completions);
  }, [routines, categoriesData, completions]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Global Streaks Section */}
      <StreakCounter 
        currentStreak={userGlobalStreaks.current} 
        longestStreak={userGlobalStreaks.longest} 
        isAtRisk={userGlobalStreaks.isAtRisk}
        todayCompleted={userGlobalStreaks.todayCompleted}
        todayPercentage={Math.round(userGlobalStreaks.todayPercentage || 0)}
      />

      <header className="mb-6 md:mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold mb-1.5 md:mb-2 tracking-tight text-white flex justify-between items-center">
              Today's Plan
            </h1>
            <p className="text-app-text-s font-mono text-xs md:text-sm uppercase tracking-wider">{format(new Date(), 'EEE, MMM d, yyyy')}</p>
          </div>
        </div>
        {todaySections.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
             <button
                onClick={() => setSelectedSection('All')}
                className={`px-3 py-1.5 rounded-full text-xs font-mono tracking-wide transition-colors border ${selectedSection === 'All' ? 'bg-white text-black border-white' : 'bg-app-surface border-app-border text-app-text-s hover:text-white hover:border-app-text-s/50'}`}
             >
                All
             </button>
             {todaySections.map((sec: Section) => (
                <button
                   key={sec.id}
                   onClick={() => setSelectedSection(sec.id)}
                   className={`px-3 py-1.5 rounded-full text-xs font-mono tracking-wide transition-colors border ${selectedSection === sec.id ? 'bg-app-accent border-app-accent text-white' : 'bg-app-surface border-app-border text-app-text-s hover:text-white hover:border-app-text-s/50'}`}
                >
                   {sec.name}
                </button>
             ))}
          </div>
        )}
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
                      
                      const isExpired = routine.deadline && !isCompleted && (() => {
                         const now = dayjs();
                         const deadlineTime = dayjs(`${todayStr}T${routine.deadline}`);
                         return now.isAfter(deadlineTime);
                      })();
                      
                      return (
                          <motion.div 
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                              key={routine.id} 
                              className={`group px-3 py-3 md:px-4 md:py-3.5 -mx-3 md:-mx-4 rounded-[12px] flex items-center gap-3 md:gap-4 transition-all duration-300 ${isExpired ? 'cursor-default' : 'cursor-pointer'} ${isCompleted ? 'bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)] scale-[0.99] hover:bg-emerald-500/15' : (isExpired ? 'bg-rose-500/10 ring-1 ring-inset ring-rose-500/30' : 'hover:bg-app-surface')}`}
                              onClick={(e) => {
                                 if (isExpired) return;
                                 // To prevent double triggering if checkbox is clicked directly
                                 const target = e.target as HTMLElement;
                                 if (target.closest('button')) return;
                                 
                                 const totalTarget = (routine.sets || 1) * routine.targetValue;
                                 const newStatus = isCompleted ? 'MISSED' : 'COMPLETED';
                                 const newVal = newStatus === 'COMPLETED' ? totalTarget : 0;
                                 
                                 mutation.mutate({ routineId: routine.id, date: todayStr, status: newStatus, targetValue: totalTarget, value: newVal });
                                 if (newStatus === 'COMPLETED' && !isCompleted) {
                                     handleCompletion(e.currentTarget, routine.id, newStatus);
                                 } else if (newStatus === 'MISSED' && isCompleted) {
                                     SoundService.playNegativeFeedback();
                                 }
                              }}
                          >
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isExpired) return;
                                    const totalTarget = (routine.sets || 1) * routine.targetValue;
                                    const newStatus = isCompleted ? 'MISSED' : 'COMPLETED';
                                    const newVal = newStatus === 'COMPLETED' ? totalTarget : 0;
                                    
                                    mutation.mutate({ routineId: routine.id, date: todayStr, status: newStatus, targetValue: totalTarget, value: newVal });
                                    
                                    if (newStatus === 'COMPLETED' && !isCompleted) {
                                        handleCompletion(e.currentTarget, routine.id, newStatus);
                                    } else if (newStatus === 'MISSED' && isCompleted) {
                                        SoundService.playNegativeFeedback();
                                    }
                                }}
                                className={`w-5 h-5 md:w-6 md:h-6 shrink-0 rounded-[6px] flex items-center justify-center transition-all duration-300 border shadow-sm ${isCompleted ? 'bg-emerald-500 border-emerald-400 text-constant-white shadow-[0_0_8px_rgba(16,185,129,0.4)] scale-110' : (isExpired ? 'bg-rose-500/20 border-rose-500/50 text-transparent' : 'bg-transparent border-app-border text-transparent group-hover:border-app-text-s/70 hover:scale-105')}`}
                            >
                                <Check className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform duration-300 ${isCompleted ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'}`} strokeWidth={3} />
                            </button>
                            
                            <div className="flex flex-col gap-0.5 flex-1 select-none overflow-hidden">
                                <h3 className={`text-sm md:text-base font-medium transition-colors duration-300 truncate flex items-center gap-2 ${isCompleted ? 'text-white' : (isExpired ? 'text-rose-400' : 'text-white group-hover:text-emerald-400')}`}>
                                    {(() => {
                                       const IconComponent = getIcon(routine.icon);
                                       return <IconComponent className={`w-4 h-4 md:w-5 md:h-5 ${isCompleted ? 'text-emerald-400/80' : 'text-app-text-s'}`} />;
                                    })()}
                                    {routine.name}
                                </h3>
                                <div className="flex max-w-full overflow-x-auto hide-scrollbar">
                                    <div className="flex items-center gap-1.5 md:gap-2 mt-0.5 whitespace-nowrap min-w-max pb-0.5">
                                        <span className="text-[9px] md:text-[10px] font-mono px-1.5 md:px-2 py-0.5 rounded-md bg-app-surface/60 border border-app-border text-app-text-s tracking-wide uppercase">
                                          {routine.categoryName}
                                        </span>
                                        {routine.targetValue && routine.targetUnit && (() => {
                                           const sets = routine.sets || 1;
                                           const totalTarget = sets * routine.targetValue;
                                           const currentVal = getDayCompletionValue(routine.id);
                                           const setsCompleted = Math.floor(currentVal / routine.targetValue);
                                           const showSetsProgress = sets > 1 && currentVal > 0;
                                           
                                           return (
                                              <span 
                                                className="text-[9px] md:text-[10px] font-mono px-1.5 md:px-2 py-0.5 rounded-md bg-app-surface/40 border border-app-border/60 text-app-text-s tracking-wide uppercase flex items-center gap-1 cursor-pointer hover:bg-app-surface hover:text-white transition-colors"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const input = prompt(`Enter progress for ${routine.name} (Target: ${totalTarget} ${routine.targetUnit}):`, currentVal.toString());
                                                  if (input !== null) {
                                                      const parsed = parseFloat(input);
                                                      if (!isNaN(parsed) && parsed >= 0) {
                                                          const newVal = Math.min(parsed, totalTarget);
                                                          const newStatus = newVal >= totalTarget ? 'COMPLETED' : (newVal > 0 ? 'PARTIAL' : 'MISSED');
                                                          mutation.mutate({ routineId: routine.id, date: todayStr, status: newStatus, targetValue: totalTarget, value: newVal });
                                                          if (newStatus === 'COMPLETED' && !isCompleted) {
                                                              handleCompletion(e.currentTarget, routine.id, newStatus);
                                                          }
                                                      }
                                                  }
                                                }}
                                              >
                                                <span className="opacity-60">Goal:</span>
                                                <span className={isCompleted ? 'text-emerald-400' : (isExpired ? 'text-rose-400' : 'text-gray-300')}>
                                                  {sets > 1 
                                                     ? (showSetsProgress ? `${setsCompleted} / ${sets}` : `${sets} × ${routine.targetValue}`)
                                                     : (routine.targetValue > 1 ? `${currentVal}/${routine.targetValue}` : routine.targetValue)}
                                                </span>
                                                <span className="opacity-60 lowercase">
                                                  {sets > 1 && showSetsProgress ? 'sets completed' : routine.targetUnit}
                                                </span>
                                              </span>
                                           );
                                        })()}
                                        {currentStreak > 0 && (() => {
                                            const milestone = getMilestone(currentStreak);
                                            const progress = Math.min(100, (currentStreak / milestone.target) * 100);
                                            return (
                                                <motion.div 
                                                    key={`streak-badge-${currentStreak}`}
                                                    initial={{ scale: 0.8, y: 5, opacity: 0 }}
                                                    animate={{ scale: 1, y: 0, opacity: 1 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                    className={`flex items-center gap-1.5 px-1.5 py-0.5 md:py-1 rounded-md border ${milestone.badgeColor} transition-colors text-[9px] md:text-[10px] font-mono tracking-wide`}
                                                >
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
                                                </motion.div>
                                            );
                                        })()}
                                        {routine.deadline && (
                                           <span className={`text-[9px] md:text-[10px] font-mono px-1.5 md:px-2 py-0.5 rounded-md border tracking-wide uppercase flex items-center gap-1 shrink-0 ${isExpired ? 'bg-rose-500 text-white border-rose-400 font-bold shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                                              {isExpired ? `Expired (${routine.deadline})` : `By ${routine.deadline}`}
                                           </span>
                                        )}
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

      {pausedRoutines.length > 0 && (
         <div className="bg-app-glass border border-app-border rounded-[20px] p-4 sm:p-5 md:p-6 flex flex-col gap-3 md:gap-4 mb-8 md:mb-12 opacity-60 hover:opacity-100 transition-opacity">
           <div className="flex justify-between items-center border-b border-app-border/50 pb-3 md:pb-4 mb-2">
             <h2 className="text-lg md:text-xl font-display font-medium text-white truncate pr-2">Paused Routines</h2>
             <span className="text-[10px] md:text-sm font-mono text-app-text-s tracking-wide whitespace-nowrap">
               {pausedRoutines.length} Paused
             </span>
           </div>
           
           <div className="flex flex-col gap-1 md:gap-2">
             {pausedRoutines.map((routine: any) => {
               const category = categoriesData.find((c: Category) => c.id === routine.categoryId);
               const categoryName = category ? category.name : 'Unknown';
               const currentStreak = getStreak(routine.id);
               const IconComponent = getIcon(routine.icon);
               
               return (
                   <div 
                       key={routine.id} 
                       className="group px-3 py-3 md:px-4 md:py-3.5 -mx-3 md:-mx-4 rounded-[12px] flex items-center gap-3 md:gap-4 transition-all duration-300 pointer-events-none"
                   >
                       <div className="w-5 h-5 md:w-6 md:h-6 shrink-0 rounded-[6px] flex items-center justify-center transition-all duration-300 border shadow-sm bg-transparent border-app-border text-transparent"></div>
                       
                       <div className="flex-1 min-w-0">
                           <h3 className="text-sm md:text-base font-medium truncate text-app-text-p flex items-center gap-2">
                               {IconComponent && <IconComponent className="w-4 h-4 text-app-text-s hidden sm:block" />}
                               {routine.name}
                               <span className="text-[10px] ml-1 bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-mono uppercase">Paused</span>
                           </h3>
                           <div className="flex max-w-full overflow-x-auto hide-scrollbar">
                               <div className="flex items-center gap-1.5 md:gap-2 mt-0.5 whitespace-nowrap min-w-max pb-0.5">
                                   <span className="text-[9px] md:text-[10px] font-mono px-1.5 md:px-2 py-0.5 rounded-md bg-app-surface/60 border border-app-border text-app-text-s tracking-wide uppercase">
                                     {categoryName}
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
                                           </div>
                                       );
                                   })()}
                               </div>
                           </div>
                       </div>
                   </div>
               )
             })}
           </div>
         </div>
      )}

      {restrictedTasks.length > 0 && selectedSection === 'All' && (
        <RestrictedTasksList tasks={restrictedTasks} completions={restrictedCompletions} />
      )}
    </div>
  );
}
