import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createDepartment,
  deleteDepartment,
  fetchDepartments,
  updateDepartment,
} from '@/features/departments/api'

export const departmentKeys = {
  all: ['departments'] as const,
}

export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.all,
    queryFn: fetchDepartments,
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { name?: string; description?: string } }) =>
      updateDepartment(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}
