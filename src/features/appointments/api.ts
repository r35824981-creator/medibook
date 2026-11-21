import { supabase } from '@/lib/supabase'
import type { AppointmentStatus, AppointmentWithRelations } from '@/types'

const APPOINTMENT_SELECT = `
  id,
  patient_id,
  doctor_id,
  appointment_date,
  start_time,
  end_time,
  status,
  reason,
  doctor_notes,
  created_at,
  updated_at,
  doctor:doctors(
    id,
    profile_id,
    specialization,
    fees,
    photo_url,
    profile:profiles(full_name),
    department:departments(name)
  ),
  patient:profiles(id, full_name, phone)
`

export async function fetchAppointments(): Promise<AppointmentWithRelations[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT)
    .order('appointment_date', { ascending: false })
    .order('start_time', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as AppointmentWithRelations[]
}

export async function bookAppointment(input: {
  patientId: string
  doctorId: string
  appointmentDate: string
  startTime: string
  endTime: string
  reason: string
}): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      patient_id: input.patientId,
      doctor_id: input.doctorId,
      appointment_date: input.appointmentDate,
      start_time: input.startTime,
      end_time: input.endTime,
      status: 'pending',
      reason: input.reason,
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}

export async function updateAppointment(
  id: string,
  patch: { status?: AppointmentStatus; doctor_notes?: string },
): Promise<void> {
  const { error } = await supabase.from('appointments').update(patch).eq('id', id)
  if (error) throw error
}

export type AppointmentEmailType = 'booking' | 'confirmation' | 'cancellation'

// Email is best effort: the booking itself must never fail because the
// notification pipeline (Edge Function + Resend) is not configured yet.
export async function sendAppointmentEmail(
  appointmentId: string,
  type: AppointmentEmailType,
): Promise<void> {
  // Emails are opt-in so the demo stays quiet until the Edge Function and
  // Resend are actually configured (see supabase/functions/README.md).
  if (import.meta.env.VITE_ENABLE_EMAILS !== 'true') return

  try {
    const { error } = await supabase.functions.invoke('send-appointment-email', {
      body: { appointmentId, type },
    })
    if (error) {
      console.warn('[email] Appointment email was not sent:', error.message)
    }
  } catch (error) {
    console.warn('[email] Appointment email request failed:', error)
  }
}
