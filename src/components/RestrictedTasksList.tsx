import { RestrictedTask, RestrictedCompletion } from '../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleRestrictedCompletion } from '../services/api';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

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

  if (!tasks || !tasks.length) return null;

  return (
    <div className="mb-8 md:mb-12">
      <div className="bg-app-glass border border-app-border rounded-[20px] p-4 sm:p-5 md:p-6 flex flex-col gap-3 md:gap-4 overflow-hidden relative">
         <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mx-10 -mt-10 pointer-events-none" />
         
         <div className="flex justify-between items-center border-b border-app-border/50 pb-3 md:pb-4 mb-2 relative z-10 w-full overflow-hidden">
            <h2 className="text-lg md:text-xl font-display font-medium text-white pr-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Restricted Tasks
            </h2>
            <span className="text-[10px] md:text-sm font-mono text-app-text-s tracking-wide hidden sm:block">
              Avoid these to maintain focus
            </span>
         </div>

         <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 relative z-10">
            {tasks.map(task => {
          const completion = completions.find(c => c.taskId === task.id && dayjs(c.date).format('YYYY-MM-DD') === todayStr);
          const isAvoided = completion?.status === 'AVOIDED';
          const isFailed = completion?.status === 'FAILED';

          return (
            <div key={task.id} className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-app-surface/60 border border-app-border transition-colors hover:bg-app-surface w-full">
               <div className="flex items-center gap-3 w-1/2 xs:w-auto">
                 {task.icon && <span className="opacity-80 text-lg sm:text-xl">{task.icon}</span>}
                 <span className="text-xs sm:text-sm font-medium text-app-text truncate">{task.name}</span>
               </div>
               
               <div className="flex bg-app-bg items-center p-1 rounded-lg border border-app-border shrink-0 relative">
                  <button
                    onClick={() => !isAvoided && mutation.mutate({ taskId: task.id, date: todayStr, status: 'AVOIDED' })}
                    className={`relative px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center justify-center rounded-md text-[10px] sm:text-xs font-mono font-medium z-10 transition-colors ${isAvoided ? 'text-emerald-400' : 'text-app-text-s hover:text-white'}`}
                  >
                    {isAvoided && (
                      <motion.div layoutId={`bg-${task.id}`} className="absolute inset-0 bg-emerald-500/20 border border-emerald-500/30 rounded-md -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                    )}
                    Avoided
                  </button>
                  <button
                    onClick={() => !isFailed && mutation.mutate({ taskId: task.id, date: todayStr, status: 'FAILED' })}
                    className={`relative px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center justify-center rounded-md text-[10px] sm:text-xs font-mono font-medium z-10 transition-colors ${isFailed ? 'text-rose-400' : 'text-app-text-s hover:text-white'}`}
                  >
                    {isFailed && (
                      <motion.div layoutId={`bg-${task.id}`} className="absolute inset-0 bg-rose-500/20 border border-rose-500/30 rounded-md -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
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
