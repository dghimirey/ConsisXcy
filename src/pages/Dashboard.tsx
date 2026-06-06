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
     return streaks.find(s => s.routineId === routineId)?.currentStreak || 0;
  };

  const userGlobalStreaks = useMemo(() => {
    const completedDates = [...new Set(
      completions
        .filter(c => c.status === 'COMPLETED')
        .map(c => new Date(c.date).toISOString().split('T')[0])
    )].sort();

    if (completedDates.length === 0) return { current: 0, longest: 0 };

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < completedDates.length; i++) {
        const prevDate = new Date(completedDates[i - 1]);
        const currDate = new Date(completedDates[i]);
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

        if (diffDays === 1) {
            tempStreak++;
        } else if (diffDays > 1) {
            if (tempStreak > longestStreak) longestStreak = tempStreak;
            tempStreak = 1;
        }
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;

    const todayString = format(new Date(), 'yyyy-MM-dd');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = format(yesterday, 'yyyy-MM-dd');
    
    const lastCompletedDate = completedDates[completedDates.length - 1];

    if (lastCompletedDate === todayString || lastCompletedDate === yesterdayString) {
        currentStreak = tempStreak;
    } else {
        currentStreak = 0;
    }

    return { current: currentStreak, longest: longestStreak };
  }, [completions]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Global Streaks Section */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
        <div className="bg-app-glass border border-app-border rounded-[20px] p-6 md:p-8 flex flex-col justify-between overflow-hidden relative group hover:border-app-text-s/30 transition-colors">
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <Flame className="w-5 h-5 text-app-accent" />
            <h3 className="text-xs uppercase tracking-wider text-app-text-s font-mono font-medium">Current Streak</h3>
          </div>
          <p className="text-5xl md:text-6xl font-display font-bold text-white tracking-tight relative z-10 flex items-baseline gap-2">
            {userGlobalStreaks.current} <span className="text-sm font-mono text-app-text-s tracking-normal font-normal">days</span>
          </p>
          <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500">
             <Flame className="w-48 h-48" />
          </div>
        </div>

        <div className="bg-app-glass border border-app-border rounded-[20px] p-6 md:p-8 flex flex-col justify-between overflow-hidden relative group hover:border-app-text-s/30 transition-colors">
          <div className="flex items-center gap-2 mb-2 relative z-10">
             <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-xs uppercase tracking-wider text-app-text-s font-mono font-medium">Longest Streak</h3>
          </div>
          <p className="text-5xl md:text-6xl font-display font-bold text-white tracking-tight relative z-10 flex items-baseline gap-2">
            {userGlobalStreaks.longest} <span className="text-sm font-mono text-app-text-s tracking-normal font-normal">days</span>
          </p>
          <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500">
             <Trophy className="w-48 h-48" />
          </div>
        </div>
      </div>

      <header className="mb-6 md:mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2 tracking-tight text-white flex justify-between items-center">
              Today's Plan
            </h1>
            <p className="text-app-text-s font-mono text-sm uppercase tracking-wider">{format(new Date(), 'EEE, MMM d, yyyy')}</p>
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
              <div key={section.id} className="bg-app-glass border border-app-border rounded-[20px] p-5 md:p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-app-border/50 pb-4 mb-2">
                  <h2 className="text-xl font-display font-medium text-white">{section.name}</h2>
                  <span className="text-sm font-mono text-app-text-s tracking-wide">
                    {completedCount}/{totalCount} Completed
                  </span>
                </div>
                
                <div className="flex flex-col">
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
                              className={`group px-3 py-3 md:px-4 md:py-3.5 -mx-3 md:-mx-4 rounded-[12px] flex items-center gap-4 transition-colors hover:bg-app-surface cursor-pointer ${isCompleted ? 'opacity-60 hover:opacity-100' : ''}`}
                              onClick={(e) => {
                                 // To prevent double triggering if checkbox is clicked directly
                                 const target = e.target as HTMLElement;
                                 if (target.closest('button')) return;
                                 
                                 const newStatus = isCompleted ? 'MISSED' : 'COMPLETED';
                                 mutation.mutate({ routineId: routine.id, date: todayStr, status: newStatus, targetValue: routine.targetValue, value: newStatus === 'COMPLETED' ? routine.targetValue : 0 });
                                 if (newStatus === 'COMPLETED') {
                                     // confetti logic
                                     const rect = e.currentTarget.getBoundingClientRect();
                                     const x = (rect.left + rect.width / 2) / window.innerWidth;
                                     const y = (rect.top + rect.height / 2) / window.innerHeight;
                                     confetti({ particleCount: 80, spread: 60, origin: { x, y }, colors: ['#c0ff00', '#ffffff', '#a8e6cf', '#ffdd00'], zIndex: 1000 });
                                 }
                              }}
                          >
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newStatus = isCompleted ? 'MISSED' : 'COMPLETED';
                                    mutation.mutate({ routineId: routine.id, date: todayStr, status: newStatus, targetValue: routine.targetValue, value: newStatus === 'COMPLETED' ? routine.targetValue : 0 });
                                    
                                    if (newStatus === 'COMPLETED') {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = (rect.left + rect.width / 2) / window.innerWidth;
                                        const y = (rect.top + rect.height / 2) / window.innerHeight;
                                        confetti({ particleCount: 80, spread: 60, origin: { x, y }, colors: ['#c0ff00', '#ffffff', '#a8e6cf', '#ffdd00'], zIndex: 1000 });
                                    }
                                }}
                                className={`w-6 h-6 shrink-0 rounded-[6px] flex items-center justify-center transition-all border shadow-sm ${isCompleted ? 'bg-app-accent border-app-accent text-app-bg' : 'bg-transparent border-app-border text-transparent group-hover:border-app-text-s/70'}`}
                            >
                                <Check className="w-4 h-4" strokeWidth={3} />
                            </button>
                            
                            <div className="flex flex-col gap-0.5 flex-1 select-none">
                                <h3 className={`text-base font-medium transition-colors ${isCompleted ? 'text-app-text-s line-through decoration-app-text-s/50' : 'text-white group-hover:text-app-accent'}`}>
                                    {routine.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5 max-w-full overflow-hidden">
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-app-surface/60 border border-app-border text-app-text-s tracking-wide uppercase truncate">
                                      {routine.categoryName}
                                    </span>
                                    {currentStreak > 0 && (
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-mono tracking-wide">
                                            <Flame className="w-2.5 h-2.5" />
                                            {currentStreak}
                                        </div>
                                    )}
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
