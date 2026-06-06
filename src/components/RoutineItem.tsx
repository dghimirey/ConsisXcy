import { useState } from 'react';
import { MoreVertical, Edit2, Play, Pause, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Routine } from '../types';
import { formatTarget } from '../lib/utils';
import { useManagementMutations } from '../hooks/useManagementMutations';

interface RoutineItemProps {
  routine: Routine;
  onEdit: (routine: Routine) => void;
}

export function RoutineItem({ routine, onEdit }: RoutineItemProps) {
  const { updateRoutineMutation, deleteRoutineMutation } = useManagementMutations();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-app-glass border border-app-border/60 p-3.5 md:p-4 rounded-xl flex items-center justify-between group relative hover:border-app-text-s/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${routine.isActive ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-app-border'}`}></div>
        <div>
          <p className="text-white font-medium text-sm md:text-base">{routine.name}</p>
          <p className="text-xs text-app-text-s font-mono tracking-wide mt-0.5">
            {formatTarget(routine.targetValue)} {routine.targetUnit}
          </p>
        </div>
      </div>
      
      <div className="relative">
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1.5 md:p-2 text-app-text-s hover:text-white rounded-lg hover:bg-app-surface transition-colors"
        >
          <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}></div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 w-40 bg-app-surface border border-app-border rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div className="py-1">
                  <button 
                    onClick={() => { setMenuOpen(false); onEdit(routine); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-app-glass transition-colors text-left"
                  >
                    <Edit2 className="w-4 h-4 text-app-text-s" /> Edit
                  </button>
                  <button 
                    onClick={() => {
                      setMenuOpen(false);
                      updateRoutineMutation.mutate({ id: routine.id, data: { isActive: !routine.isActive } });
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-app-glass transition-colors text-left"
                  >
                    {routine.isActive ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
                    {routine.isActive ? 'Pause' : 'Resume'}
                  </button>
                  <div className="h-px bg-app-border/50 my-1"></div>
                  <button 
                    onClick={() => {
                      setMenuOpen(false);
                      deleteRoutineMutation.mutate(routine.id);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
