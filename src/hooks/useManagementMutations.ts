import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRoutine, updateRoutine, deleteRoutine, createCategory, updateCategory, deleteCategory, createSection, updateSection, deleteSection } from '../services/api';

export function useManagementMutations() {
  const queryClient = useQueryClient();

  // Routines
  const updateRoutineMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateRoutine(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines'] })
  });
  const createRoutineMutation = useMutation({
    mutationFn: (data: any) => createRoutine(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines'] })
  });
  const deleteRoutineMutation = useMutation({
    mutationFn: deleteRoutine,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines'] })
  });

  // Categories
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateCategory(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });
  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => createCategory(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });

  // Sections
  const updateSectionMutation = useMutation({
    mutationFn: ({ id, name }: { id: string, name: string }) => updateSection(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sections'] })
  });
  const createSectionMutation = useMutation({
    mutationFn: (name: string) => createSection(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sections'] })
  });
  const deleteSectionMutation = useMutation({
    mutationFn: deleteSection,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sections'] })
  });

  return {
    updateRoutineMutation, createRoutineMutation, deleteRoutineMutation,
    updateCategoryMutation, createCategoryMutation, deleteCategoryMutation,
    updateSectionMutation, createSectionMutation, deleteSectionMutation
  };
}
