import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTrash, restoreTrashItems, deleteTrashItems, TrashItem } from '../services/api';
import { Trash2, RotateCcw, AlertTriangle, Search, CheckSquare, Square } from 'lucide-react';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';

export default function TrashPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const { data: trashItems = [], isLoading } = useQuery({
    queryKey: ['trash'],
    queryFn: fetchTrash
  });

  const restoreMutation = useMutation({
    mutationFn: restoreTrashItems,
    onSuccess: () => {
      toast.success('Items successfully restored.');
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      setSelectedIds([]);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to restore items.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTrashItems,
    onSuccess: () => {
      toast.success('Items permanently deleted.');
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      setSelectedIds([]);
      setDeleteModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete items.');
    }
  });

  const filteredItems = trashItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i.id));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const getDaysRemaining = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const expiresDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = expiresDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const getSelectedItemsData = () => {
    return trashItems.filter(item => selectedIds.includes(item.id)).map(item => ({ id: item.id, type: item.type }));
  };

  const handleRestoreSelected = () => {
    if (selectedIds.length === 0) return;
    restoreMutation.mutate(getSelectedItemsData());
  };

  const handlePermanentDelete = () => {
    if (selectedIds.length === 0) return;
    deleteMutation.mutate(getSelectedItemsData());
  };

  return (
    <div className="min-h-full bg-app-bg text-app-text-p p-6 lg:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight text-white flex items-center gap-4">
              <Trash2 className="w-10 h-10 text-app-text-s/50" /> Trash
            </h1>
            <p className="text-app-text-s text-lg max-w-2xl font-light">
              Items are kept for 30 days before being permanently deleted.
            </p>
          </div>
          
          <div className="flex bg-app-surface/50 border border-app-border rounded-xl p-1.5 backdrop-blur-xl">
             <button 
                onClick={handleRestoreSelected}
                disabled={selectedIds.length === 0 || restoreMutation.isPending}
                className="px-4 py-2 text-sm font-medium rounded-lg text-white disabled:text-app-text-s/50 hover:bg-app-glass disabled:hover:bg-transparent transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Restore {selectedIds.length > 0 && `(${selectedIds.length})`}
              </button>
              <button 
                onClick={() => setDeleteModalOpen(true)}
                disabled={selectedIds.length === 0 || deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium rounded-lg text-rose-400 disabled:text-app-text-s/50 hover:bg-rose-500/10 disabled:hover:bg-transparent transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete {selectedIds.length > 0 && `(${selectedIds.length})`}
              </button>
          </div>
        </section>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-app-text-s" />
          <input 
            type="text" 
            placeholder="Search trash..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-app-surface border border-app-border p-4 pl-12 rounded-2xl text-white outline-none focus:border-app-accent transition-colors shadow-sm placeholder:text-app-text-s/50"
          />
        </div>

        {/* List */}
        <div className="bg-app-surface border border-app-border rounded-2xl shadow-sm overflow-hidden text-sm md:text-base">
          {isLoading ? (
             <div className="p-12 text-center text-app-text-s animate-pulse">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-app-text-s">
              <Trash2 className="w-12 h-12 mb-4 opacity-20" />
              <p>No items in trash</p>
            </div>
          ) : (
            <div className="divide-y divide-app-border">
              <div className="flex items-center px-6 py-4 bg-app-surface/50 border-b border-app-border">
                  <button onClick={handleSelectAll} className="mr-6 text-app-text-s hover:text-white transition-colors cursor-pointer">
                    {selectedIds.length === filteredItems.length && filteredItems.length > 0 ? <CheckSquare className="w-5 h-5 text-app-accent" /> : <Square className="w-5 h-5" />}
                  </button>
                  <div className="flex-1 font-medium text-app-text-s uppercase tracking-wider text-xs">Name</div>
                  <div className="w-24 md:w-28 font-medium text-app-text-s uppercase tracking-wider text-xs">Type</div>
                  <div className="hidden md:block w-32 font-medium text-app-text-s uppercase tracking-wider text-xs">Deleted</div>
                  <div className="w-24 md:w-32 text-right font-medium text-app-text-s uppercase tracking-wider text-xs">Expires</div>
              </div>

              {filteredItems.map(item => {
                const days = getDaysRemaining(item.deletedAt);
                const isSelected = selectedIds.includes(item.id);
                const deletedDateObj = new Date(item.deletedAt);
                const formattedDeleted = deletedDateObj.toLocaleDateString();
                
                return (
                  <div key={`${item.type}-${item.id}`} className={`flex items-center px-6 py-4 transition-colors ${isSelected ? 'bg-app-accent/5' : 'hover:bg-app-surface/80'}`}>
                    <button onClick={() => handleSelect(item.id)} className="mr-6 text-app-text-s hover:text-white transition-colors cursor-pointer shrink-0">
                      {isSelected ? <CheckSquare className="w-5 h-5 text-app-accent" /> : <Square className="w-5 h-5" />}
                    </button>
                    <div className="flex-1 font-medium text-white truncate pr-4" title={item.name}>{item.name}</div>
                    <div className="w-24 md:w-28 text-app-text-s">
                       <span className="bg-app-surface border border-app-border px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wide">{item.type}</span>
                    </div>
                    <div className="hidden md:block w-32 text-app-text-s text-sm">
                      {formattedDeleted}
                    </div>
                    <div className={`w-24 md:w-32 text-right text-sm ${days <= 3 ? 'text-orange-400 font-medium' : 'text-app-text-s'}`}>
                      In {days} {days === 1 ? 'day' : 'days'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete Modal */}
        <Modal 
          isOpen={deleteModalOpen} 
          onClose={() => setDeleteModalOpen(false)} 
          title="Confirm Permanent Deletion"
          footer={
            <div className="flex w-full justify-end gap-2">
              <button 
                onClick={() => setDeleteModalOpen(false)} 
                className="px-5 py-2.5 min-h-[44px] text-sm font-medium text-app-text-s hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handlePermanentDelete} 
                disabled={deleteMutation.isPending}
                className="px-6 py-2.5 min-h-[44px] text-sm bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white font-medium rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl text-sm flex items-start gap-4">
               <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
               <p>Are you sure you want to permanently delete {selectedIds.length} item(s)? This action cannot be undone.</p>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
}
