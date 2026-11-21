import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTimeOff,
  deleteAvailability,
  deleteTimeOff,
  fetchAvailability,
  fetchBookedStartTimes,
  fetchTimeOff,
  upsertAvailability,
} from '@/features/availability/api'

export const availabilityKeys = {
  all: ['availability'] as const,
  byDoctor: (doctorId: string) => ['availability', doctorId] as const,
  timeOffAll: ['time-off'] as const,
  timeOff: (doctorId: string) => ['time-off', doctorId] as const,
  slots: (doctorId: string, dateKey: string) => ['slots', doctorId, dateKey] as const,
}

export function useAvailability(doctorId: string | undefined) {
  return useQuery({
    queryKey: availabilityKeys.byDoctor(doctorId ?? ''),
    queryFn: () => fetchAvailability(doctorId as string),
    enabled: Boolean(doctorId),
  })
}

export function useUpsertAvailability() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: upsertAvailability,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: availabilityKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}

export function useDeleteAvailability() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAvailability,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: availabilityKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}

export function useTimeOff(doctorId: string | undefined) {
  return useQuery({
    queryKey: availabilityKeys.timeOff(doctorId ?? ''),
    queryFn: () => fetchTimeOff(doctorId as string),
    enabled: Boolean(doctorId),
  })
}

export function useCreateTimeOff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTimeOff,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: availabilityKeys.timeOffAll })
      void queryClient.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}

export function useDeleteTimeOff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTimeOff,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: availabilityKeys.timeOffAll })
      void queryClient.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}

export function useBookedStartTimes(doctorId: string | undefined, dateKey: string) {
  return useQuery({
    queryKey: availabilityKeys.slots(doctorId ?? '', dateKey),
    queryFn: () => fetchBookedStartTimes(doctorId as string, dateKey),
    enabled: Boolean(doctorId && dateKey),
  })
}
