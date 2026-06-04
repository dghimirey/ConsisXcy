import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Check, Flame, CircleDashed, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { fetchRoutines, fetchCompletions, toggleCompletion, fetchStreaks } from '../services/api';
import { Routine, Completion, Streak } from '../types';
import { HabitHeatmap } from '../components/HabitHeatmap';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const { data: routines = [] } = useQuery({ queryKey: ['routines'], queryFn: fetchRoutines });
  const { data: completions = [] } = useQuery({ queryKey: ['completions'], queryFn: fetchCompletions });
  const { data: streaks = [] } = useQuery({ queryKey: ['streaks'], queryFn: fetchStreaks });

  const categories = useMemo(() => ['All', ...new Set(routines.map((r: Routine) => r.category).filter(Boolean))], [routines]);
  
  const activeRoutines = routines.filter(r => r.isActive);
  const filteredRoutines = activeRoutines.filter(r => selectedCategory === 'All' || r.category === selectedCategory);


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

  const dailyScore = filteredRoutines.length > 0 
    ? filteredRoutines.reduce((acc, r) => acc + (getDayStatus(r.id) === 'COMPLETED' ? 1 : getDayStatus(r.id) === 'PARTIAL' ? 0.5 : 0), 0) / filteredRoutines.length
    : 0;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <header className="mb-6 md:mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2 tracking-tight text-white flex justify-between items-center">
              Today's Grind
            </h1>
            <p className="text-app-text-s font-mono text-sm uppercase tracking-wider">{format(new Date(), 'EEE, MMM d, yyyy')}</p>
          </div>
          {categories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              <Filter className="w-4 h-4 text-app-text-s shrink-0" />
              {categories.map((cat: any) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat 
                      ? 'bg-app-accent text-zinc-900 border border-app-accent' 
                      : 'bg-app-glass border border-app-border text-app-text hover:border-app-text-s'
                  }`}
                >
                  {cat || 'Uncategorized'}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Stats/Dashboard Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
        <div className="bg-app-glass border border-app-border rounded-2xl p-4 md:p-6 relative col-span-1">
           <p className="text-app-text-s text-[11px] uppercase tracking-wider mb-2 font-mono">Today's Progress</p>
           <h3 className="text-4xl font-display font-bold text-white leading-none">{Math.round(dailyScore * 100)}<span className="text-sm text-app-text-s ml-1">%</span></h3>
           <div className="w-full bg-app-border h-1 rounded-sm mt-4 overflow-hidden">
             <motion.div initial={{ width: 0 }} animate={{ width: `${dailyScore * 100}%` }} className="h-full bg-app-accent rounded-sm" />
           </div>
        </div>

        <div className="col-span-1 md:col-span-2 flex justify-center">
            <HabitHeatmap category={selectedCategory} />
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredRoutines.map((routine, idx) => {
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
                                {routine.autoImprovement && <span className="text-[10px] bg-app-accent/10 text-app-accent px-2 py-0.5 rounded-full ml-2">+{routine.targetValue * 0.01}%</span>}
                            </h3>
                            <p className="text-[12px] text-app-text-s font-mono">Target: {routine.targetValue} {routine.targetUnit}</p>
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
        {filteredRoutines.length === 0 && (
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 border border-app-border border-dashed rounded-3xl">
                <CircleDashed className="w-12 h-12 mx-auto text-app-text-s mb-4" />
                <h3 className="text-white font-medium mb-1">No Habits Found</h3>
                <p className="text-app-text-s text-sm">
                  {selectedCategory === 'All' ? 'Create some habits to get started.' : `No habits in the ${selectedCategory} category.`}
                </p>
            </motion.div>
        )}
      </div>
    </div>
  );
}
