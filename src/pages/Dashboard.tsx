import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Check, Flame, CircleDashed, Filter, ArrowUpDown, Trophy } from 'lucide-react';
import { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { fetchRoutines, fetchCompletions, toggleCompletion, fetchStreaks, fetchCategories, fetchSections } from '../services/api';
import { Routine, Completion, Streak, Category, Section } from '../types';
import { HabitHeatmap } from '../components/HabitHeatmap';
import { formatTarget } from '../lib/utils';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [sortByPriority, setSortByPriority] = useState<boolean>(false);

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

  if (sortByPriority) {
    const priorityWeight: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };
    filteredRoutines = [...filteredRoutines].sort((a, b) => {
      const pA = priorityWeight[a.priority || 'Medium'] || 2;
      const pB = priorityWeight[b.priority || 'Medium'] || 2;
      return pB - pA;
    });
  }


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
              Today's Grind
            </h1>
            <p className="text-app-text-s font-mono text-sm uppercase tracking-wider">{format(new Date(), 'EEE, MMM d, yyyy')}</p>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar flex-1 md:justify-end">
            <button
              onClick={() => setSortByPriority(!sortByPriority)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors mr-2 ${
                sortByPriority 
                  ? 'bg-app-accent text-zinc-900 border border-app-accent' 
                  : 'bg-app-glass border border-app-border text-app-text hover:border-app-text-s'
              }`}
              title="Sort by Priority"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort Priority
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-6 mb-8 md:mb-12">
        {filteredRoutines.length === 0 ? (
           <div className="text-center py-20 bg-app-surface border border-app-border rounded-2xl">
              <p className="text-app-text-s">No routines scheduled for today based on your categories.</p>
           </div>
        ) : (
          todayCategories.map((category: Category) => {
            const categoryRoutines = filteredRoutines.filter((r: Routine) => r.categoryId === category.id);
            if (categoryRoutines.length === 0) return null;
            return (
              <div key={category.id} className="space-y-3">
                <h2 className="text-lg font-semibold text-app-text-p flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-app-accent"></div>
                  {category.name}
                </h2>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {categoryRoutines.map((routine: Routine, idx: number) => {
                      const status = getDayStatus(routine.id);
                      const currentStreak = getStreak(routine.id);
                      return (
                          <motion.div 
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                              key={routine.id} 
                              className={`group bg-app-surface border ${status === 'COMPLETED' ? 'border-app-accent' : 'border-app-border'} hover:border-app-text-s p-4 rounded-[12px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors`}
                          >
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-base font-semibold text-white flex items-center">
                                {routine.name}
                                {routine.priority && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ml-3 tracking-wider uppercase ${
                                        routine.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                                        routine.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    }`}>
                                        {routine.priority}
                                    </span>
                                )}
                                {routine.autoImprovement && <span className="text-[10px] bg-app-accent/10 text-app-accent px-2 py-0.5 rounded-full ml-2">Growing target</span>}
                            </h3>
                            <p className="text-[12px] text-app-text-s font-mono">Target: {formatTarget(routine.targetValue)} {routine.targetUnit}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-6">
                        {currentStreak > 0 && (
                            <div className="flex items-center gap-1.5 text-app-text-s px-3 py-1 text-xs font-mono font-medium border border-app-border rounded-lg bg-app-glass">
                                <Flame className="w-3 h-3 text-app-accent" /> <span>{currentStreak} <span className="hidden sm:inline">day streak</span></span>
                            </div>
                        )}
                        {currentStreak === 0 && <div className="hidden md:block w-4"></div>}
                        <div className="flex items-center ml-auto md:ml-0">
                            <button 
                                onClick={(e) => {
                                    const newStatus = status === 'COMPLETED' ? 'MISSED' : 'COMPLETED';
                                    mutation.mutate({ routineId: routine.id, date: todayStr, status: newStatus, targetValue: routine.targetValue, value: newStatus === 'COMPLETED' ? routine.targetValue : 0 });
                                    
                                    if (newStatus === 'COMPLETED') {
                                        const newStreak = currentStreak + 1;
                                        if (newStreak > 0 && (newStreak % 7 === 0 || newStreak === 30 || newStreak === 100)) {
                                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                            const x = (rect.left + rect.width / 2) / window.innerWidth;
                                            const y = (rect.top + rect.height / 2) / window.innerHeight;
                                            
                                            confetti({
                                                particleCount: 100,
                                                spread: 70,
                                                origin: { x, y },
                                                colors: ['#c0ff00', '#ffffff', '#a8e6cf', '#ffdd00'],
                                                zIndex: 1000
                                            });
                                        }
                                    }
                                }}
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${status === 'COMPLETED' ? 'bg-app-accent border-app-accent text-app-bg' : 'border-app-border text-transparent hover:border-app-accent hover:bg-app-glass'}`}
                            >
                                <Check className="w-5 h-5" strokeWidth={3} />
                            </button>
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
