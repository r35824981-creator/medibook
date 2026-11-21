import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bookAppointment, fetchAppointments, sendAppointmentEmail, updateAppointment } from '@/features/appointments/api'
import { supabase } from '@/lib/supabase'
import type { AppointmentStatus } from '@/types'

export const appointmentKeys = {
  all: ['appointments'] as const,
}

export function useAppointments() {
  return useQuery({
    queryKey: appointmentKeys.all,
    queryFn: fetchAppointments,
  })
}

export function useBookAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bookAppointment,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['slots'] })
      void sendAppointmentEmail(data.id, 'booking')
    },
  })
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: { status?: AppointmentStatus; doctor_notes?: string }
    }) => updateAppointment(id, patch),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['slots'] })

      const nextStatus = variables.patch.status
      if (nextStatus === 'confirmed') {
        void sendAppointmentEmail(variables.id, 'confirmation')
      } else if (nextStatus === 'cancelled' || nextStatus === 'rejected') {
        void sendAppointmentEmail(variables.id, 'cancellation')
      }
    },
  })
}

export function useAppointmentRealtime(enabled = true) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel('medibook-appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'medibook', table: 'appointments' },
        () => {
          void queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
          void queryClient.invalidateQueries({ queryKey: ['slots'] })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, queryClient])
}
