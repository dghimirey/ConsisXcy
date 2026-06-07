import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRoutine, updateRoutine, deleteRoutine, createCategory, updateCategory, deleteCategory, createSection, updateSection, deleteSection } from '../services/api';

export function useManagementMutations() {
  const queryClient = useQueryClient();

  // Routines
  const updateRoutineMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateRoutine(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines'] }),
    onError: (err: any) => console.error("Update Routine Error:", err)
  });
  const createRoutineMutation = useMutation({
    mutationFn: (data: any) => createRoutine(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines'] }),
    onError: (err: any) => console.error("Create Routine Error:", err)
  });
  const deleteRoutineMutation = useMutation({
    mutationFn: deleteRoutine,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines'] }),
    onError: (err: any) => console.error("Delete Routine Error:", err)
  });

  // Categories
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateCategory(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: (err: any) => console.error("Update Category Error:", err)
  });
  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => createCategory(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: (err: any) => console.error("Create Category Error:", err)
  });
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: (err: any) => console.error("Delete Category Error:", err)
  });

  // Sections
  const updateSectionMutation = useMutation({
    mutationFn: ({ id, name }: { id: string, name: string }) => updateSection(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sections'] }),
    onError: (err: any) => console.error("Update Section Error:", err)
  });
  const createSectionMutation = useMutation({
    mutationFn: (name: string) => createSection(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sections'] }),
    onError: (err: any) => console.error("Create Section Error:", err)
  });
  const deleteSectionMutation = useMutation({
    mutationFn: deleteSection,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sections'] }),
    onError: (err: any) => console.error("Delete Section Error:", err)
  });

  return {
    updateRoutineMutation, createRoutineMutation, deleteRoutineMutation,
    updateCategoryMutation, createCategoryMutation, deleteCategoryMutation,
    updateSectionMutation, createSectionMutation, deleteSectionMutation
  };
}
