import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Plus, Play, Pause, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchRoutines, createRoutine, updateRoutine, deleteRoutine } from '../services/api';

export default function RoutinesPage() {
  const queryClient = useQueryClient();
  const { data: routines = [] } = useQuery({ queryKey: ['routines'], queryFn: fetchRoutines });
  
  const [isCreating, setIsCreating] = useState(false);
  const [newRoutine, setNewRoutine] = useState({
    name: '',
    category: 'Fitness',
    description: '',
    targetValue: 1,
    targetUnit: 'times',
    autoImprovement: false,
  });

  const createMutation = useMutation({
    mutationFn: createRoutine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      setIsCreating(false);
      setNewRoutine({ name: '', category: 'Fitness', description: '', targetValue: 1, targetUnit: 'times', autoImprovement: false });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateRoutine(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines'] })
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoutine,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines'] })
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-10 gap-4">
        <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-white mb-1">Routines</h1>
            <p className="text-app-text-s">Manage your habits and daily targets</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center justify-center gap-2 bg-app-accent text-app-bg font-medium px-4 py-3 md:py-2 rounded-xl transition-all w-full md:w-auto"
        >
          <Plus className="w-4 h-4" /> New Routine
        </button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-app-surface border border-app-border p-6 rounded-2xl">
              <h3 className="font-medium text-lg mb-4 text-white">Create New Routine</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" placeholder="Routine Name (e.g. 50 Pushups)" 
                  value={newRoutine.name} onChange={e => setNewRoutine({...newRoutine, name: e.target.value})}
                  className="bg-app-bg border border-app-border p-3 rounded-xl text-white outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent"
                />
                <input 
                  type="text" placeholder="Category (e.g. Fitness, Study)" 
                  value={newRoutine.category} onChange={e => setNewRoutine({...newRoutine, category: e.target.value})}
                  className="bg-app-bg border border-app-border p-3 rounded-xl text-white outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent"
                />
                <div className="flex gap-4">
                  <input 
                    type="number" placeholder="Target Value" 
                    value={newRoutine.targetValue || ''} onChange={e => setNewRoutine({...newRoutine, targetValue: parseFloat(e.target.value)})}
                    className="w-1/3 bg-app-bg border border-app-border p-3 rounded-xl text-white outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent"
                  />
                  <input 
                    type="text" placeholder="Unit (e.g. reps, minutes)" 
                    value={newRoutine.targetUnit} onChange={e => setNewRoutine({...newRoutine, targetUnit: e.target.value})}
                    className="flex-1 bg-app-bg border border-app-border p-3 rounded-xl text-white outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent"
                  />
                </div>
                <div className="flex items-center gap-3 bg-app-bg border border-app-border p-3 rounded-xl">
                    <input 
                        type="checkbox" 
                        id="autoImprovement"
                        checked={newRoutine.autoImprovement} 
                        onChange={e => setNewRoutine({...newRoutine, autoImprovement: e.target.checked})}
                        className="w-4 h-4 accent-app-accent bg-app-surface"
                    />
                    <label htmlFor="autoImprovement" className="text-sm font-medium text-app-text-p">1% Daily Auto Improvement</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setIsCreating(false)} className="px-4 py-2 hover:bg-app-glass text-app-text-s rounded-xl transition-colors">Cancel</button>
                <button 
                  onClick={() => createMutation.mutate(newRoutine)}
                  disabled={!newRoutine.name}
                  className="bg-app-accent disabled:opacity-50 disabled:cursor-not-allowed text-app-bg font-medium px-6 py-2 rounded-xl transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {routines.map(routine => (
          <div key={routine.id} className="bg-app-surface border border-app-border p-4 rounded-[12px] flex items-center justify-between group">
            <div className={`flex flex-col gap-1 ${!routine.isActive && 'opacity-50'}`}>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    {routine.name}
                    {!routine.isActive && <span className="text-[10px] bg-app-border text-app-text-s px-2 py-0.5 rounded-full uppercase tracking-wider">Paused</span>}
                </h3>
                <p className="text-[12px] text-app-text-s font-mono">
                    {routine.category} • {routine.targetValue} {routine.targetUnit}
                    {routine.autoImprovement && <span className="text-[10px] bg-app-accent/10 text-app-accent px-2 py-0.5 rounded-full ml-2">+{routine.targetValue * 0.01}%</span>}
                </p>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => updateMutation.mutate({ id: routine.id, data: { isActive: !routine.isActive } })}
                className="w-10 h-10 flex items-center justify-center text-app-text-s hover:text-white border border-transparent hover:border-app-border rounded-full hover:bg-app-glass transition-colors"
                title={routine.isActive ? "Pause Routine" : "Resume Routine"}
              >
                {routine.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => deleteMutation.mutate(routine.id)}
                className="w-10 h-10 flex items-center justify-center text-app-text-s hover:text-rose-400 border border-transparent hover:border-app-border rounded-full hover:bg-app-glass transition-colors"
                title="Delete Routine"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {routines.length === 0 && !isCreating && (
          <div className="text-center py-20 text-app-text-s">
              <p>No routines yet. Click 'New Routine' to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
