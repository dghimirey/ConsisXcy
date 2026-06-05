import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Plus, Play, Pause, Trash2, Tag, X, Edit2, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchRoutines, createRoutine, updateRoutine, deleteRoutine, fetchCategories, createCategory, updateCategory, deleteCategory, fetchSections, createSection, updateSection, deleteSection } from '../services/api';
import { Routine, Category, Section } from '../types';
import { formatTarget } from '../lib/utils';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function RoutinesPage() {
  const queryClient = useQueryClient();
  const { data: routines = [] } = useQuery({ queryKey: ['routines'], queryFn: fetchRoutines });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const { data: sections = [] } = useQuery({ queryKey: ['sections'], queryFn: fetchSections });
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const [editingRoutine, setEditingRoutine] = useState<Partial<Routine> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingSection, setEditingSection] = useState<Partial<Section> | null>(null);

  // Mutations
  const updateRoutineMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateRoutine(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['routines'] }); setEditingRoutine(null); }
  });
  const createRoutineMutation = useMutation({
    mutationFn: (data: any) => createRoutine(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['routines'] }); setEditingRoutine(null); }
  });
  const deleteRoutineMutation = useMutation({
    mutationFn: deleteRoutine,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines'] })
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateCategory(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setEditingCategory(null); }
  });
  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => createCategory(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setEditingCategory(null); }
  });
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ id, name }: { id: string, name: string }) => updateSection(id, name),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sections'] }); setEditingSection(null); }
  });
  const createSectionMutation = useMutation({
    mutationFn: (name: string) => createSection(name),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sections'] }); setEditingSection(null); }
  });
  const deleteSectionMutation = useMutation({
    mutationFn: deleteSection,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sections'] })
  });

  const toggleSection = (id: string) => setExpandedSections(prev => ({...prev, [id]: !prev[id]}));
  const toggleCategory = (id: string) => setExpandedCategories(prev => ({...prev, [id]: !prev[id]}));

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-white mb-1">Manage</h1>
            <p className="text-app-text-s">Organize sections, categories, and routines.</p>
        </div>
        <button 
          onClick={() => setEditingSection({ name: '' })}
          className="flex items-center justify-center gap-2 bg-app-accent text-app-bg font-medium px-4 py-3 md:py-2 rounded-xl transition-all w-full md:w-auto"
        >
          <Plus className="w-4 h-4" /> New Section
        </button>
      </div>

      <div className="space-y-4">
        {sections.map((section: Section) => (
          <div key={section.id} className="bg-app-glass border border-app-border rounded-[20px] overflow-hidden">
            <div className="bg-app-surface p-4 flex items-center justify-between cursor-pointer" onClick={() => toggleSection(section.id)}>
              <div className="flex items-center gap-3">
                {expandedSections[section.id] ? <ChevronDown className="w-5 h-5 text-app-text-s" /> : <ChevronRight className="w-5 h-5 text-app-text-s" />}
                <h2 className="text-lg font-semibold text-white">{section.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); setEditingSection(section); }} className="p-2 text-app-text-s hover:text-white rounded-lg hover:bg-app-bg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteSectionMutation.mutate(section.id); }} className="p-2 text-app-text-s hover:text-rose-400 rounded-lg hover:bg-app-bg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {expandedSections[section.id] && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="p-4 pt-2 pb-4 space-y-3 bg-app-bg/50">
                    {categories.filter((c: Category) => c.sectionId === section.id).map((category: Category) => (
                      <div key={category.id} className="bg-app-bg border border-app-border rounded-xl ml-4 overflow-hidden">
                        <div className="p-3 flex items-center justify-between cursor-pointer border-b border-transparent hover:bg-app-surface/50" onClick={() => toggleCategory(category.id)}>
                          <div className="flex items-center gap-3">
                            {expandedCategories[category.id] ? <ChevronDown className="w-4 h-4 text-app-text-s" /> : <ChevronRight className="w-4 h-4 text-app-text-s" />}
                            <h3 className="font-medium text-white">{category.name}</h3>
                            <div className="flex gap-1">
                              {DAYS.map((d, i) => category.schedule?.includes(i) ? <span key={d} className="text-[10px] bg-app-accent/20 text-app-accent px-1.5 rounded">{d}</span> : null)}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setEditingCategory(category); }} className="p-1.5 text-app-text-s hover:text-white rounded-md hover:bg-app-glass transition-colors">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteCategoryMutation.mutate(category.id); }} className="p-1.5 text-app-text-s hover:text-rose-400 rounded-md hover:bg-app-glass transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedCategories[category.id] && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                              <div className="p-3 bg-app-surface/30 space-y-2 border-t border-app-border/50 pl-8">
                                {routines.filter((r: Routine) => r.categoryId === category.id).map((routine: Routine) => (
                                  <div key={routine.id} className="bg-app-glass border border-app-border p-3 rounded-lg flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${routine.isActive ? 'bg-emerald-500' : 'bg-app-text-s'}`}></div>
                                      <div>
                                        <p className="text-white font-medium text-sm">{routine.name}</p>
                                        <p className="text-xs text-app-text-s font-mono">Target: {formatTarget(routine.targetValue)} {routine.targetUnit}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => setEditingRoutine(routine)} className="p-1.5 text-app-text-s hover:text-white rounded-md hover:bg-app-surface transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => updateRoutineMutation.mutate({ id: routine.id, data: { isActive: !routine.isActive } })} className="p-1.5 text-app-text-s hover:text-white rounded-md hover:bg-app-surface transition-colors">
                                        {routine.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                      </button>
                                      <button onClick={() => deleteRoutineMutation.mutate(routine.id)} className="p-1.5 text-app-text-s hover:text-rose-400 rounded-md hover:bg-app-surface transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                <button onClick={() => setEditingRoutine({ categoryId: category.id, category: category.name, name: '', targetValue: 1, targetUnit: 'times', priority: 'Medium', isActive: true, autoImprovement: false })} className="w-full flex items-center justify-center gap-2 p-2 mt-2 text-sm text-app-text-s hover:text-white border border-dashed border-app-border hover:border-app-text-s rounded-lg transition-colors">
                                  <Plus className="w-4 h-4" /> Add Routine
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                    <button onClick={() => setEditingCategory({ sectionId: section.id, name: '', schedule: [0,1,2,3,4,5,6] })} className="w-full flex items-center justify-center gap-2 p-3 text-sm text-app-text-s hover:text-white border border-dashed border-app-border hover:border-app-text-s rounded-xl transition-colors ml-4" style={{ width: 'calc(100% - 1rem)' }}>
                      <Plus className="w-4 h-4" /> Add Category
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        {sections.length === 0 && (
          <div className="text-center py-20 text-app-text-s">
            <p>No sections found. Create one to begin.</p>
          </div>
        )}
      </div>

      {/* Editing Section Modal */}
      <AnimatePresence>
        {editingSection && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-app-surface w-full max-w-md rounded-2xl border border-app-border flex flex-col">
              <div className="flex justify-between items-center p-5 border-b border-app-border">
                <h2 className="text-xl font-medium text-white">{editingSection.id ? 'Edit Section' : 'New Section'}</h2>
                <button onClick={() => setEditingSection(null)} className="text-app-text-s hover:text-white p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-app-text-s mb-2">Section Name</label>
                <input autoFocus type="text" className="w-full bg-app-bg border border-app-border p-3 rounded-xl text-white outline-none focus:border-app-accent" value={editingSection.name || ''} onChange={e => setEditingSection({...editingSection, name: e.target.value})} placeholder="e.g. Fitness, Study, Life" />
              </div>
              <div className="p-5 border-t border-app-border flex justify-end gap-3">
                <button onClick={() => setEditingSection(null)} className="px-4 py-2 text-app-text-s hover:text-white transition-colors">Cancel</button>
                <button onClick={() => {
                  if (editingSection.id) updateSectionMutation.mutate({ id: editingSection.id, name: editingSection.name || '' });
                  else createSectionMutation.mutate(editingSection.name || '');
                }} className="px-6 py-2 bg-app-accent text-app-bg font-medium rounded-xl hover:opacity-90 transition-opacity">Save</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editing Category Modal */}
      <AnimatePresence>
        {editingCategory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-app-surface w-full max-w-md rounded-2xl border border-app-border flex flex-col">
              <div className="flex justify-between items-center p-5 border-b border-app-border">
                <h2 className="text-xl font-medium text-white">{editingCategory.id ? 'Edit Category' : 'New Category'}</h2>
                <button onClick={() => setEditingCategory(null)} className="text-app-text-s hover:text-white p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-app-text-s mb-2">Category Name</label>
                  <input autoFocus type="text" className="w-full bg-app-bg border border-app-border p-3 rounded-xl text-white outline-none focus:border-app-accent" value={editingCategory.name || ''} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} placeholder="e.g. Chest, Mathematics" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-s mb-2">Parent Section</label>
                  <select value={editingCategory.sectionId || ''} onChange={e => setEditingCategory({...editingCategory, sectionId: e.target.value})} className="w-full bg-app-bg border border-app-border p-3 rounded-xl text-white outline-none focus:border-app-accent">
                    <option value="" disabled>Select Section</option>
                    {sections.map((sec: Section) => (
                      <option key={sec.id} value={sec.id}>{sec.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-s mb-2">Schedule (Days active)</label>
                  <div className="flex gap-2">
                    {DAYS.map((day, idx) => (
                      <button 
                        key={idx}
                        onClick={() => {
                          const sched = editingCategory.schedule || [];
                          const newSched = sched.includes(idx) ? sched.filter(d => d !== idx) : [...sched, idx];
                          setEditingCategory({...editingCategory, schedule: newSched});
                        }}
                        className={`flex-1 aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition-colors ${editingCategory.schedule?.includes(idx) ? 'bg-app-accent text-zinc-900 border border-app-accent' : 'bg-app-bg border border-app-border text-app-text-s hover:border-app-text-s'}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-app-border flex justify-end gap-3">
                <button onClick={() => setEditingCategory(null)} className="px-4 py-2 text-app-text-s hover:text-white transition-colors">Cancel</button>
                <button onClick={() => {
                  if (editingCategory.id) updateCategoryMutation.mutate({ id: editingCategory.id, data: editingCategory });
                  else createCategoryMutation.mutate(editingCategory);
                }} className="px-6 py-2 bg-app-accent text-app-bg font-medium rounded-xl hover:opacity-90 transition-opacity">Save</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editing Routine Modal */}
      <AnimatePresence>
        {editingRoutine && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pt-20 pb-20">
            <div className="bg-app-surface w-full max-w-lg rounded-2xl border border-app-border flex flex-col max-h-full">
              <div className="flex justify-between items-center p-5 border-b border-app-border shrink-0">
                <h2 className="text-xl font-medium text-white">{editingRoutine.id ? 'Edit Routine' : 'New Routine'}</h2>
                <button onClick={() => setEditingRoutine(null)} className="text-app-text-s hover:text-white p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-app-text-s mb-2">Routine Name</label>
                  <input autoFocus type="text" className="w-full bg-app-bg border border-app-border p-3 rounded-xl text-white outline-none focus:border-app-accent" value={editingRoutine.name || ''} onChange={e => setEditingRoutine({...editingRoutine, name: e.target.value})} placeholder="e.g. 50 Pushups" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-s mb-2">Parent Category</label>
                  <select value={editingRoutine.categoryId || ''} onChange={e => {
                    const selectedCat = categories.find((c: Category) => c.id === e.target.value);
                    setEditingRoutine({...editingRoutine, categoryId: e.target.value, category: selectedCat ? selectedCat.name : ''});
                  }} className="w-full bg-app-bg border border-app-border p-3 rounded-xl text-white outline-none focus:border-app-accent">
                    <option value="" disabled>Select Category</option>
                    {categories.map((cat: Category) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-s mb-2">Description / Notes</label>
                  <textarea className="w-full bg-app-bg border border-app-border p-3 rounded-xl text-white outline-none focus:border-app-accent resize-none h-24" value={editingRoutine.description || ''} onChange={e => setEditingRoutine({...editingRoutine, description: e.target.value})} placeholder="Optional details..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-app-text-s mb-2">Target Value</label>
                    <input type="number" step="1" min="1" className="w-full bg-app-bg border border-app-border p-3 rounded-xl text-white outline-none focus:border-app-accent" value={editingRoutine.targetValue ? formatTarget(editingRoutine.targetValue) : ''} onChange={e => setEditingRoutine({...editingRoutine, targetValue: parseFloat(e.target.value)})} placeholder="e.g. 50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-app-text-s mb-2">Unit</label>
                    <input type="text" className="w-full bg-app-bg border border-app-border p-3 rounded-xl text-white outline-none focus:border-app-accent" value={editingRoutine.targetUnit || ''} onChange={e => setEditingRoutine({...editingRoutine, targetUnit: e.target.value})} placeholder="e.g. reps" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-s mb-2">Priority</label>
                  <select value={editingRoutine.priority} onChange={e => setEditingRoutine({...editingRoutine, priority: e.target.value as any})} className="w-full bg-app-bg border border-app-border p-3 rounded-xl text-white outline-none focus:border-app-accent">
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 bg-app-bg border border-app-border p-4 rounded-xl mt-2">
                    <input type="checkbox" id="autoImprovementOption" checked={editingRoutine.autoImprovement || false} onChange={e => setEditingRoutine({...editingRoutine, autoImprovement: e.target.checked})} className="w-4 h-4 accent-app-accent bg-app-surface shrink-0" />
                    <label htmlFor="autoImprovementOption" className="text-sm font-medium text-app-text-p cursor-pointer select-none">1% Daily Improvement <span className="block text-xs text-app-text-s font-normal">Automatically increments target on completion.</span></label>
                </div>
              </div>
              <div className="p-5 border-t border-app-border flex justify-end gap-3 shrink-0">
                <button onClick={() => setEditingRoutine(null)} className="px-4 py-2 text-app-text-s hover:text-white transition-colors">Cancel</button>
                <button onClick={() => {
                  if (editingRoutine.id) updateRoutineMutation.mutate({ id: editingRoutine.id, data: editingRoutine });
                  else createRoutineMutation.mutate(editingRoutine);
                }} className="px-6 py-2 bg-app-accent text-app-bg font-medium rounded-xl hover:opacity-90 transition-opacity">Save Routine</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
