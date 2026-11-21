import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createDoctor,
  deleteDoctor,
  fetchDoctor,
  fetchDoctors,
  fetchMyDoctor,
  fetchPatientProfiles,
  promoteToDoctor,
  updateDoctor,
  updateProfile,
  uploadDoctorPhoto,
  type DoctorInput,
  type DoctorPatch,
} from '@/features/doctors/api'

export const doctorKeys = {
  all: ['doctors'] as const,
  list: (includeInactive: boolean) => ['doctors', { includeInactive }] as const,
  detail: (id: string) => ['doctors', 'detail', id] as const,
  mine: (profileId: string) => ['doctors', 'mine', profileId] as const,
  patients: ['profiles', 'patients'] as const,
}

export function useDoctors(options?: { includeInactive?: boolean }) {
  return useQuery({
    queryKey: doctorKeys.list(Boolean(options?.includeInactive)),
    queryFn: () => fetchDoctors(options),
  })
}

export function useDoctor(id: string | undefined) {
  return useQuery({
    queryKey: doctorKeys.detail(id ?? ''),
    queryFn: () => fetchDoctor(id as string),
    enabled: Boolean(id),
  })
}

export function useMyDoctor(profileId: string | undefined) {
  return useQuery({
    queryKey: doctorKeys.mine(profileId ?? ''),
    queryFn: () => fetchMyDoctor(profileId as string),
    enabled: Boolean(profileId),
  })
}

export function usePatientProfiles(enabled = true) {
  return useQuery({
    queryKey: doctorKeys.patients,
    queryFn: fetchPatientProfiles,
    enabled,
  })
}

export function useCreateDoctor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: DoctorInput) => createDoctor(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: doctorKeys.all })
      void queryClient.invalidateQueries({ queryKey: doctorKeys.patients })
    },
  })
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: DoctorPatch }) => updateDoctor(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: doctorKeys.all })
    },
  })
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDoctor(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: doctorKeys.all })
    },
  })
}

export function usePromoteToDoctor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (profileId: string) => promoteToDoctor(profileId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: doctorKeys.patients })
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { full_name?: string; phone?: string } }) =>
      updateProfile(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: doctorKeys.all })
    },
  })
}

export function useUploadDoctorPhoto() {
  return useMutation({
    mutationFn: ({ doctorId, file }: { doctorId: string; file: File }) =>
      uploadDoctorPhoto(doctorId, file),
  })
}
