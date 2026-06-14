import { RestrictedTask, RestrictedCompletion } from '../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleRestrictedCompletion } from '../services/api';
import dayjs from 'dayjs';
import { motion } from 'motion/react';
import { getIcon } from '../lib/icons';

interface RestrictedTasksListProps {
  tasks: RestrictedTask[];
  completions: RestrictedCompletion[];
}

export function RestrictedTasksList({ tasks, completions }: RestrictedTasksListProps) {
  const queryClient = useQueryClient();
  const todayStr = dayjs().format('YYYY-MM-DD');

  const mutation = useMutation({
    mutationFn: toggleRestrictedCompletion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restrictedCompletions'] });
    }
  });

  const todayIndex = dayjs().day();
  const activeTasksForToday = tasks.filter(task => {
    if (!task.schedule || task.schedule.length === 0) return true;
    return task.schedule.includes(todayIndex);
  });

  if (!activeTasksForToday || !activeTasksForToday.length) return null;

  return (
    <div className="mb-8 md:mb-12 relative">
      <div className="bg-[#111111] border border-app-border rounded-[20px] p-6 sm:p-8 flex flex-col gap-6 overflow-hidden relative">
         {/* Background accent */}
         <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[100px] -mx-10 -mt-10 pointer-events-none" />
         
         {/* Header */}
         <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-app-border/40 pb-5 relative z-10">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl md:text-2xl font-display font-medium text-white flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-20"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                </span>
                Restricted Tasks
              </h2>
              <p className="text-sm text-app-text-s/80">
                Avoid these activities to maintain focus and discipline
              </p>
            </div>
         </div>

         {/* Grid */}
         <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 relative z-10">
            {activeTasksForToday.map(task => {
              const completion = completions.find(c => c.taskId === task.id && dayjs(c.date).format('YYYY-MM-DD') === todayStr);
              const isAvoided = completion?.status === 'AVOIDED';
              const isFailed = completion?.status === 'FAILED';
              const IconComponent = getIcon(task.icon);

              return (
                <div 
                  key={task.id} 
                  className={`flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 w-full group ${
                    isAvoided ? 'bg-[#042f2e]/20 border-emerald-500/20' : 
                    isFailed ? 'bg-[#4c0519]/20 border-rose-500/20' : 
                    'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#1f1f1f]'
                  }`}
                >
                   <div className="flex items-start gap-3 mb-5">
                     <IconComponent className="opacity-90 w-6 h-6 shrink-0 leading-none" />
                     <span className={`text-sm font-medium leading-relaxed ${isFailed ? 'text-rose-200' : isAvoided ? 'text-emerald-200' : 'text-gray-200'}`}>
                       {task.name}
                     </span>
                   </div>
                   
                   <div className="flex bg-black/40 items-center p-1 rounded-xl border border-white/5 self-end mt-auto w-full sm:w-auto">
                      <button
                        onClick={() => !isAvoided && mutation.mutate({ taskId: task.id, date: todayStr, status: 'AVOIDED' })}
                        className={`relative flex-1 sm:flex-none px-4 py-2 flex items-center justify-center rounded-lg text-xs font-mono font-medium z-10 transition-colors ${isAvoided ? 'text-emerald-400' : 'text-app-text-s hover:text-white'}`}
                      >
                        {isAvoided && (
                          <motion.div layoutId={`bg-${task.id}`} className="absolute inset-0 bg-emerald-500/20 border border-emerald-500/30 rounded-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                        )}
                        Avoided
                      </button>
                      <button
                        onClick={() => !isFailed && mutation.mutate({ taskId: task.id, date: todayStr, status: 'FAILED' })}
                        className={`relative flex-1 sm:flex-none px-4 py-2 flex items-center justify-center rounded-lg text-xs font-mono font-medium z-10 transition-colors ${isFailed ? 'text-rose-400' : 'text-app-text-s hover:text-white'}`}
                      >
                        {isFailed && (
                          <motion.div layoutId={`bg-${task.id}`} className="absolute inset-0 bg-rose-500/20 border border-rose-500/30 rounded-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                        )}
                        Failed
                      </button>
                   </div>
                </div>
              );
            })}
         </div>
      </div>
    </div>
  );
}
