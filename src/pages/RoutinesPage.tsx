import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchRoutines, fetchCategories, fetchSections, fetchRestrictedTasks } from '../services/api';
import { Routine, Category, Section, RestrictedTask } from '../types';
import { formatTarget } from '../lib/utils';
import { Modal } from '../components/Modal';
import { useManagementMutations } from '../hooks/useManagementMutations';
import { RoutineItem } from '../components/RoutineItem';
import { IconPicker } from '../components/IconPicker';
import toast from 'react-hot-toast';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function RoutinesPage() {
  const [activeTab, setActiveTab] = useState<'routines' | 'restricted'>('routines');

  const { data: routines = [] } = useQuery({ queryKey: ['routines'], queryFn: fetchRoutines });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const { data: sections = [] } = useQuery({ queryKey: ['sections'], queryFn: fetchSections });
  const { data: restrictedTasks = [] } = useQuery({ queryKey: ['restrictedTasks'], queryFn: fetchRestrictedTasks });
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const [editingRoutine, setEditingRoutine] = useState<Partial<Routine> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingSection, setEditingSection] = useState<Partial<Section> | null>(null);
  const [editingRestricted, setEditingRestricted] = useState<Partial<RestrictedTask> | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'Routine' | 'Category' | 'Section' | 'RestrictedTask'} | null>(null);
  
  const [saveErrors, setSaveErrors] = useState<Record<string, string | null>>({});

  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    updateRoutineMutation, createRoutineMutation, deleteRoutineMutation,
    updateCategoryMutation, createCategoryMutation, deleteCategoryMutation,
    updateSectionMutation, createSectionMutation, deleteSectionMutation,
    updateRestrictedMutation, createRestrictedMutation, deleteRestrictedMutation
  } = useManagementMutations();

  // Auto-expand sections that have categories
  useEffect(() => {
    if (sections.length > 0 && Object.keys(expandedSections).length === 0) {
      const initial: Record<string, boolean> = {};
      sections.forEach((s: Section) => { initial[s.id] = true; });
      setExpandedSections(initial);
    }
  }, [sections]);

  // Pre-compute hierarchical data
  const groupedData = useMemo(() => {
    return sections.map((section: Section) => {
      const sectionCategories = categories.filter((c: Category) => c.sectionId === section.id).map((category: Category) => {
        const categoryRoutines = routines.filter((r: Routine) => r.categoryId === category.id);
        return {
          ...category,
          routines: categoryRoutines
        };
      });
      const routineCount = sectionCategories.reduce((sum: number, cat: any) => sum + cat.routines.length, 0);
      return {
        ...section,
        categories: sectionCategories,
        categoryCount: sectionCategories.length,
        routineCount
      };
    });
  }, [sections, categories, routines]);

  const toggleSection = (id: string) => setExpandedSections(prev => ({...prev, [id]: !prev[id]}));
  const toggleCategory = (id: string) => setExpandedCategories(prev => ({...prev, [id]: !prev[id]}));

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-white mb-1.5 md:mb-2">Manage</h1>
            <div className="flex gap-4 mt-2">
               <button onClick={() => setActiveTab('routines')} className={`pb-1 border-b-2 text-sm font-medium transition-colors ${activeTab === 'routines' ? 'border-app-accent text-white' : 'border-transparent text-app-text-s hover:text-white'}`}>Habits & Routines</button>
               <button onClick={() => setActiveTab('restricted')} className={`pb-1 border-b-2 text-sm font-medium transition-colors ${activeTab === 'restricted' ? 'border-rose-400 text-white' : 'border-transparent text-app-text-s hover:text-white'}`}>Restricted Tasks</button>
            </div>
        </div>
        {activeTab === 'routines' ? (
          <button 
            onClick={() => setEditingSection({ name: '' })}
            className="flex items-center justify-center gap-2 bg-app-accent text-app-bg hover:bg-app-accent/90 shrink-0 font-medium px-5 py-3 md:py-2.5 rounded-xl transition-all shadow-md w-full md:w-auto"
          >
            <Plus className="w-4 h-4 text-zinc-900" strokeWidth={3} />
            New Section
          </button>
        ) : (
          <button 
            onClick={() => setEditingRestricted({ name: '', icon: '🚫', isActive: true })}
            className="flex items-center justify-center gap-2 bg-rose-500 text-white hover:bg-rose-400 shrink-0 font-medium px-5 py-3 md:py-2.5 rounded-xl transition-all shadow-md w-full md:w-auto"
          >
             <Plus className="w-4 h-4 text-white" strokeWidth={3} />
             New Restricted Task
          </button>
        )}
      </div>

      <div className="space-y-6">
        {activeTab === 'routines' && groupedData.map((section: any) => (
          <div key={section.id} className="bg-app-glass border border-app-border rounded-[20px] overflow-hidden">
            <div className="bg-app-surface/60 p-4 md:p-6 flex items-center justify-between cursor-pointer hover:bg-app-surface/80 transition-colors" onClick={() => toggleSection(section.id)}>
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-1 bg-app-bg border border-app-border rounded-lg text-app-text-s">
                  {expandedSections[section.id] ? <ChevronDown className="w-4 h-4 md:w-5 md:h-5" /> : <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />}
                </div>
                <div>
                  <h2 className="text-base md:text-xl font-display font-medium text-white tracking-wide">{section.name}</h2>
                  <p className="text-[10px] md:text-xs font-mono text-app-text-s mt-0.5 md:mt-1">
                    {section.categoryCount} {section.categoryCount === 1 ? 'Category' : 'Categories'} • {section.routineCount} {section.routineCount === 1 ? 'Routine' : 'Routines'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); setEditingSection(section); }} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-app-text-s hover:text-white rounded-xl hover:bg-app-glass transition-colors">
                  <Edit2 className="w-5 h-5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setItemToDelete({id: section.id, type: 'Section'}); }} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-app-text-s hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {expandedSections[section.id] && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="p-4 md:p-6 pt-2 pb-6 space-y-4 bg-app-bg/30">
                    {section.categories.map((category: any) => (
                      <div key={category.id} className="bg-app-bg border border-app-border/60 rounded-2xl ml-0 md:ml-4 overflow-hidden">
                        <div className="p-3 md:p-4 flex items-center justify-between cursor-pointer border-b border-transparent hover:bg-app-surface/30 transition-colors" onClick={() => toggleCategory(category.id)}>
                          <div className="flex items-center gap-2 md:gap-4 font-mono">
                            <div className="text-app-text-s mt-0.5 md:mt-0">
                              {expandedCategories[category.id] ? <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-3">
                              <h3 className="font-medium font-sans text-white text-sm md:text-base">{category.name} <span className="text-app-text-s font-normal">({category.routines.length})</span></h3>
                              {category.schedule && category.schedule.length > 0 && (
                                <span className="text-[10px] md:text-xs text-app-text-s/80 font-normal md:pt-0.5">
                                  {DAYS.filter((_, i) => category.schedule.includes(i)).join(' ')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setEditingCategory(category); }} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-app-text-s hover:text-white rounded-lg hover:bg-app-glass transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteCategoryMutation.mutate(category.id); }} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-app-text-s hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedCategories[category.id] && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                              <div className="p-2.5 md:p-4 bg-app-surface/20 space-y-2.5 md:space-y-3 border-t border-app-border/40 pl-3 md:pl-10">
                                {category.routines.map((routine: Routine) => (
                                  <RoutineItem key={routine.id} routine={routine} onEdit={setEditingRoutine} onDelete={(r) => setItemToDelete({id: r.id, type: 'Routine'})} />
                                ))}
                                <button 
                                  onClick={() => setEditingRoutine({ categoryId: category.id, category: category.name, name: '', targetValue: 1, targetUnit: 'times', sets: 1, isActive: true, autoImprovement: false })} 
                                  className="w-full flex items-center justify-center gap-2 p-3 text-sm font-medium text-app-text-s hover:text-white border border-dashed border-app-border hover:border-app-text-s/70 rounded-xl transition-colors mt-2 bg-app-surface/10 hover:bg-app-surface/30"
                                >
                                  <Plus className="w-4 h-4" /> Add Routine
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                    <button 
                      onClick={() => setEditingCategory({ sectionId: section.id, name: '', schedule: [0,1,2,3,4,5,6] })} 
                      className="flex items-center justify-center gap-2 p-3 font-medium text-sm text-app-text-s hover:text-white border border-dashed border-app-border hover:border-app-text-s/70 rounded-xl transition-colors ml-0 md:ml-4 bg-app-glass hover:bg-app-surface/40 w-full md:w-[calc(100%-1rem)]" 
                    >
                      <Plus className="w-4 h-4" /> Add Category
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        {activeTab === 'routines' && sections.length === 0 && (
          <div className="text-center py-20 bg-app-glass border border-app-border rounded-[20px]">
            <p className="text-app-text-s">No sections found. Create one to begin architecting your day.</p>
          </div>
        )}

        {activeTab === 'restricted' && (
           <div className="bg-app-glass border border-app-border rounded-[20px] overflow-hidden p-4 md:p-6 space-y-4">
              {restrictedTasks.length === 0 ? (
                 <div className="text-center py-10">
                   <p className="text-app-text-s">No restricted tasks found. Create one to add a habit you want to avoid.</p>
                 </div>
              ) : (
                 restrictedTasks.map((task: RestrictedTask) => (
                    <div key={task.id} className="flex items-center justify-between p-3 md:p-4 bg-app-surface/40 hover:bg-app-surface/60 border border-app-border rounded-xl transition-colors">
                       <div className="flex items-center gap-3">
                          <span className="text-xl">{task.icon}</span>
                          <span className="font-medium text-white">{task.name}</span>
                       </div>
                       <div className="flex items-center gap-1">
                          <button onClick={() => setEditingRestricted(task)} className="min-w-[40px] min-h-[40px] flex items-center justify-center text-app-text-s hover:text-white rounded-lg hover:bg-app-glass transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setItemToDelete({id: task.id, type: 'RestrictedTask'})} className="min-w-[40px] min-h-[40px] flex items-center justify-center text-app-text-s hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                 ))
              )}
           </div>
        )}
      </div>

      <Modal 
        isOpen={!!editingSection} 
        onClose={() => { setEditingSection(null); setSaveErrors(p => ({...p, section: null})); }} 
        title={editingSection?.id ? 'Edit Section' : 'New Section'}
        footer={
          <div className="flex w-full justify-between items-center">
            {editingSection?.id ? (
              <button 
                onClick={() => {
                  setItemToDelete({id: editingSection.id as string, type: 'Section'});
                }}
                className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            ) : <div />}
            <div className="flex gap-2">
              <button onClick={() => { setEditingSection(null); setSaveErrors(p => ({...p, section: null})); }} className="px-5 py-2.5 min-h-[44px] text-sm font-medium text-app-text-s hover:text-white transition-colors">Cancel</button>
              <button 
                onClick={() => {
                  if (!editingSection?.name) return;
                  setSaveErrors(p => ({...p, section: null}));
                  const onSuccess = () => { setEditingSection(null); setSaveErrors(p => ({...p, section: null})); };
                  const onError = (e: any) => setSaveErrors(p => ({...p, section: e.message || 'Failed to save section'}));
                  if (editingSection?.id) updateSectionMutation.mutate({ id: editingSection.id, name: editingSection.name }, { onSuccess, onError });
                  else createSectionMutation.mutate(editingSection.name, { onSuccess, onError });
                }} 
                disabled={!editingSection?.name || createSectionMutation.isPending || updateSectionMutation.isPending}
                className="px-6 py-2.5 min-h-[44px] text-sm bg-app-accent text-zinc-900 font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(createSectionMutation.isPending || updateSectionMutation.isPending) ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        }
      >
        <div>
          {saveErrors.section && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">{saveErrors.section}</div>}
          <label className="block text-sm font-medium text-app-text-s mb-2 ml-1">Section Name</label>
          <input autoFocus type="text" className="w-full bg-app-bg border border-app-border p-3.5 rounded-xl text-white outline-none focus:border-app-accent transition-colors" value={editingSection?.name || ''} onChange={e => setEditingSection((s: any) => ({...s, name: e.target.value}))} placeholder="e.g. Fitness, Study, Deep Work" />
        </div>
      </Modal>

      <Modal 
        isOpen={!!editingCategory} 
        onClose={() => { setEditingCategory(null); setSaveErrors(p => ({...p, category: null})); }} 
        title={editingCategory?.id ? 'Edit Category' : 'New Category'}
        footer={
          <div className="flex w-full justify-between items-center">
            {editingCategory?.id ? (
              <button 
                onClick={() => {
                  setItemToDelete({id: editingCategory.id as string, type: 'Category'});
                }}
                className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            ) : <div />}
            <div className="flex gap-2">
              <button onClick={() => { setEditingCategory(null); setSaveErrors(p => ({...p, category: null})); }} className="px-5 py-2.5 min-h-[44px] text-sm font-medium text-app-text-s hover:text-white transition-colors">Cancel</button>
              <button 
                onClick={() => {
                  if (!editingCategory?.name || !editingCategory?.sectionId) return;
                  setSaveErrors(p => ({...p, category: null}));
                  const onSuccess = () => { setEditingCategory(null); setSaveErrors(p => ({...p, category: null})); };
                  const onError = (e: any) => setSaveErrors(p => ({...p, category: e.message || 'Failed to save category'}));
                  if (editingCategory?.id) updateCategoryMutation.mutate({ id: editingCategory.id, data: editingCategory }, { onSuccess, onError });
                  else createCategoryMutation.mutate(editingCategory, { onSuccess, onError });
                }} 
                disabled={!editingCategory?.name || !editingCategory?.sectionId || createCategoryMutation.isPending || updateCategoryMutation.isPending}
                className="px-6 py-2.5 min-h-[44px] text-sm bg-app-accent text-zinc-900 font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(createCategoryMutation.isPending || updateCategoryMutation.isPending) ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {saveErrors.category && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm mb-2">{saveErrors.category}</div>}
          <div>
            <label className="block text-sm font-medium text-app-text-s mb-2 ml-1">Category Name</label>
            <input autoFocus type="text" className="w-full bg-app-bg border border-app-border p-3.5 rounded-xl text-white outline-none focus:border-app-accent transition-colors" value={editingCategory?.name || ''} onChange={e => setEditingCategory((c: any) => ({...c, name: e.target.value}))} placeholder="e.g. Workout, Physics" />
          </div>
          <div>
            <label className="block text-sm font-medium text-app-text-s mb-2 ml-1">Parent Section</label>
            <select value={editingCategory?.sectionId || ''} onChange={e => setEditingCategory((c: any) => ({...c, sectionId: e.target.value}))} className="w-full bg-app-bg border border-app-border p-3.5 rounded-xl text-white outline-none focus:border-app-accent transition-colors appearance-none cursor-pointer">
              <option value="" disabled>Select Section</option>
              {sections.map((sec: Section) => (
                <option key={sec.id} value={sec.id}>{sec.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-app-text-s mb-2 ml-1">Schedule</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day, idx) => {
                const isActive = editingCategory?.schedule?.includes(idx);
                return (
                  <button 
                    key={idx}
                    onClick={() => {
                      const sched = editingCategory?.schedule || [];
                      const newSched = isActive ? sched.filter(d => d !== idx) : [...sched, idx];
                      setEditingCategory((c: any) => ({...c, schedule: newSched}));
                    }}
                    className={`flex-1 min-w-[40px] aspect-[2/1] rounded-lg border-2 flex items-center justify-center text-[11px] uppercase tracking-wider font-semibold transition-all ${isActive ? 'bg-app-accent/10 border-app-accent text-app-accent' : 'bg-app-bg border-transparent text-app-text-s hover:bg-app-surface hover:text-white'}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={!!editingRoutine} 
        onClose={() => { setEditingRoutine(null); setShowAdvanced(false); setSaveErrors(p => ({...p, routine: null})); }} 
        title={editingRoutine?.id ? 'Edit Routine' : 'New Routine'}
        footer={
          <div className="flex w-full justify-between items-center">
            {editingRoutine?.id ? (
              <button 
                onClick={() => {
                  setItemToDelete({id: editingRoutine.id as string, type: 'Routine'});
                }}
                className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            ) : <div />}
            <div className="flex gap-2">
              <button onClick={() => { setEditingRoutine(null); setShowAdvanced(false); setSaveErrors(p => ({...p, routine: null})); }} className="px-5 py-2.5 min-h-[44px] text-sm font-medium text-app-text-s hover:text-white transition-colors">Cancel</button>
              <button 
                onClick={() => {
                  if (!editingRoutine?.name || !editingRoutine?.categoryId || editingRoutine.targetValue === undefined || Number.isNaN(editingRoutine.targetValue)) return;
                  setSaveErrors(p => ({...p, routine: null}));
                  const onSuccess = () => { setEditingRoutine(null); setShowAdvanced(false); setSaveErrors(p => ({...p, routine: null})); };
                  const onError = (e: any) => setSaveErrors(p => ({...p, routine: e.message || 'Failed to save routine'}));
                  if (editingRoutine?.id) updateRoutineMutation.mutate({ id: editingRoutine.id, data: editingRoutine }, { onSuccess, onError });
                  else createRoutineMutation.mutate(editingRoutine, { onSuccess, onError });
                }} 
                disabled={!editingRoutine?.name || !editingRoutine?.categoryId || editingRoutine.targetValue === undefined || Number.isNaN(editingRoutine.targetValue) || createRoutineMutation.isPending || updateRoutineMutation.isPending}
                className="px-6 py-2.5 min-h-[44px] text-sm bg-app-accent text-zinc-900 font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(createRoutineMutation.isPending || updateRoutineMutation.isPending) ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {saveErrors.routine && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm mb-2">{saveErrors.routine}</div>}
          <div>
            <label className="block text-sm font-medium text-app-text-s mb-2 ml-1">Routine Name</label>
            <input autoFocus type="text" className="w-full bg-app-bg border border-app-border p-3.5 rounded-xl text-white outline-none focus:border-app-accent transition-colors" value={editingRoutine?.name || ''} onChange={e => setEditingRoutine((r: any) => ({...r, name: e.target.value}))} placeholder="e.g. 50 Pushups" />
          </div>
          <div>
            <label className="block text-sm font-medium text-app-text-s mb-2 ml-1">Parent Category</label>
            <select value={editingRoutine?.categoryId || ''} onChange={e => {
              const selectedCat = categories.find((c: Category) => c.id === e.target.value);
              setEditingRoutine((r: any) => ({...r, categoryId: e.target.value, category: selectedCat ? selectedCat.name : ''}));
            }} className="w-full bg-app-bg border border-app-border p-3.5 rounded-xl text-white outline-none focus:border-app-accent transition-colors appearance-none cursor-pointer">
              <option value="" disabled>Select Category</option>
              {categories.map((cat: Category) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-app-text-s mb-2 ml-1">Icon</label>
            <IconPicker
               value={editingRoutine?.icon}
               onChange={(icon) => setEditingRoutine((r: any) => ({...r, icon}))}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-app-text-s mb-2 ml-1">Sets</label>
              <input type="number" step="1" min="1" className="w-full bg-app-bg border border-app-border p-3.5 rounded-xl text-white outline-none focus:border-app-accent transition-colors" value={editingRoutine?.sets ?? 1} onChange={e => setEditingRoutine((r: any) => ({...r, sets: parseInt(e.target.value) || 1}))} placeholder="e.g. 3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-app-text-s mb-2 ml-1">Target (per set)</label>
              <input type="number" step="1" min="1" className="w-full bg-app-bg border border-app-border p-3.5 rounded-xl text-white outline-none focus:border-app-accent transition-colors" value={editingRoutine?.targetValue ? formatTarget(editingRoutine.targetValue) : ''} onChange={e => setEditingRoutine((r: any) => ({...r, targetValue: parseFloat(e.target.value)}))} placeholder="e.g. 50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-app-text-s mb-2 ml-1">Unit</label>
              <input type="text" className="w-full bg-app-bg border border-app-border p-3.5 rounded-xl text-white outline-none focus:border-app-accent transition-colors" value={editingRoutine?.targetUnit || ''} onChange={e => setEditingRoutine((r: any) => ({...r, targetUnit: e.target.value}))} placeholder="e.g. reps" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-app-text-s mb-2 ml-1">Notes <span className="text-app-text-s/50">(Optional)</span></label>
            <textarea className="w-full bg-app-bg border border-app-border p-3.5 rounded-xl text-white outline-none focus:border-app-accent transition-colors resize-none h-24" value={editingRoutine?.description || ''} onChange={e => setEditingRoutine((r: any) => ({...r, description: e.target.value}))} placeholder="Details about this routine..." />
          </div>

          <div>
            <button 
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-app-text-s hover:text-white transition-colors w-full p-2"
            >
              <Settings2 className="w-4 h-4" />
              Advanced Settings
              {showAdvanced ? <ChevronDown className="w-3 h-3 ml-auto" /> : <ChevronRight className="w-3 h-3 ml-auto" />}
            </button>
            <AnimatePresence>
              {showAdvanced && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="pt-4 pb-2">
                    <label className="flex items-start gap-3 cursor-pointer group p-4 bg-app-surface/50 border border-app-border rounded-xl">
                      <div className="flex items-center h-5 mt-0.5">
                        <input type="checkbox" className="w-4 h-4 text-app-accent bg-app-bg border-app-border rounded focus:ring-app-accent focus:ring-2" checked={editingRoutine?.autoImprovement || false} onChange={e => setEditingRoutine((r: any) => ({...r, autoImprovement: e.target.checked}))} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white group-hover:text-app-accent transition-colors">Progressive Overload</span>
                        <span className="text-xs text-app-text-s mt-1">Automatically increment target value by 1% each time this routine is completed.</span>
                      </div>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Confirm Deletion"
        footer={
          <div className="flex w-full justify-end gap-2">
            <button 
               onClick={() => setItemToDelete(null)} 
               className="px-5 py-2.5 min-h-[44px] text-sm font-medium text-app-text-s hover:text-white transition-colors"
            >
               Cancel
            </button>
            <button 
               onClick={() => {
                 if (!itemToDelete) return;
                 const successCallback = () => {
                   toast.success('Deleted permanently');
                   setItemToDelete(null);
                   setEditingRoutine(null);
                   setEditingCategory(null);
                   setEditingSection(null);
                   setEditingRestricted(null);
                 };
                 const errorCallback = (err: any) => {
                   toast.error(err.message || 'Failed to delete');
                 };
                 
                 if (itemToDelete.type === 'Routine') {
                   deleteRoutineMutation.mutate(itemToDelete.id, { onSuccess: successCallback, onError: errorCallback });
                 } else if (itemToDelete.type === 'Category') {
                   deleteCategoryMutation.mutate(itemToDelete.id, { onSuccess: successCallback, onError: errorCallback });
                 } else if (itemToDelete.type === 'Section') {
                   deleteSectionMutation.mutate(itemToDelete.id, { onSuccess: successCallback, onError: errorCallback });
                 } else if (itemToDelete.type === 'RestrictedTask') {
                   deleteRestrictedMutation.mutate(itemToDelete.id, { onSuccess: successCallback, onError: errorCallback });
                 }
               }} 
               disabled={deleteRoutineMutation.isPending || deleteCategoryMutation.isPending || deleteSectionMutation.isPending || deleteRestrictedMutation.isPending}
               className="px-6 py-2.5 min-h-[44px] text-sm bg-rose-500/10 text-rose-400 font-medium rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm disabled:opacity-50"
            >
               Delete
            </button>
          </div>
        }
      >
        <div className="space-y-4">
           <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm leading-relaxed">
             Are you sure you want to permanently delete this item?
           </div>
        </div>
      </Modal>

      <Modal 
        isOpen={!!editingRestricted} 
        onClose={() => { setEditingRestricted(null); setSaveErrors(p => ({...p, restricted: null})); }} 
        title={editingRestricted?.id ? 'Edit Restricted Task' : 'New Restricted Task'}
        footer={
          <div className="flex w-full justify-between items-center">
            {editingRestricted?.id ? (
              <button 
                onClick={() => {
                  setItemToDelete({id: editingRestricted.id as string, type: 'RestrictedTask'});
                }}
                className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            ) : <div />}
            <div className="flex gap-2">
              <button onClick={() => { setEditingRestricted(null); setSaveErrors(p => ({...p, restricted: null})); }} className="px-5 py-2.5 min-h-[44px] text-sm font-medium text-app-text-s hover:text-white transition-colors">Cancel</button>
              <button 
                onClick={() => {
                  if (!editingRestricted?.name) return;
                  setSaveErrors(p => ({...p, restricted: null}));
                  const onSuccess = () => { setEditingRestricted(null); setSaveErrors(p => ({...p, restricted: null})); };
                  const onError = (e: any) => setSaveErrors(p => ({...p, restricted: e.message || 'Failed to save task'}));
                  if (editingRestricted?.id) updateRestrictedMutation.mutate({ id: editingRestricted.id, data: editingRestricted }, { onSuccess, onError });
                  else createRestrictedMutation.mutate(editingRestricted, { onSuccess, onError });
                }} 
                disabled={!editingRestricted?.name || createRestrictedMutation.isPending || updateRestrictedMutation.isPending}
                className="px-6 py-2.5 min-h-[44px] text-sm bg-app-accent text-zinc-900 font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(createRestrictedMutation.isPending || updateRestrictedMutation.isPending) ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {saveErrors.restricted && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">{saveErrors.restricted}</div>}
          
          <div>
            <label className="block text-sm font-medium text-app-text-s mb-2 ml-1">Task Name</label>
            <input autoFocus type="text" className="w-full bg-app-bg border border-app-border p-3.5 rounded-xl text-white outline-none focus:border-app-accent transition-colors" value={editingRestricted?.name || ''} onChange={e => setEditingRestricted((r: any) => ({...r, name: e.target.value}))} placeholder="e.g. No Fast Food, No TikTok" />
          </div>

          <div>
             <label className="block text-sm font-medium text-app-text-s mb-2 ml-1">Icon <span className="text-app-text-s/50">(Optional)</span></label>
             <IconPicker 
                value={editingRestricted?.icon}
                onChange={(icon) => setEditingRestricted((r: any) => ({...r, icon}))}
             />
          </div>
        </div>
      </Modal>
    </div>
  );
}
