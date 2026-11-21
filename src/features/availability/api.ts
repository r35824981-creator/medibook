import { supabase } from '@/lib/supabase'
import type { DoctorAvailability, DoctorTimeOff } from '@/types'

export async function fetchAvailability(doctorId: string): Promise<DoctorAvailability[]> {
  const { data, error } = await supabase
    .from('doctor_availability')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('weekday', { ascending: true })

  if (error) throw error
  return (data ?? []) as DoctorAvailability[]
}

export async function upsertAvailability(input: {
  doctorId: string
  weekday: number
  startTime: string
  endTime: string
  slotMinutes: number
}): Promise<void> {
  const { error } = await supabase.from('doctor_availability').upsert(
    {
      doctor_id: input.doctorId,
      weekday: input.weekday,
      start_time: input.startTime,
      end_time: input.endTime,
      slot_minutes: input.slotMinutes,
    },
    { onConflict: 'doctor_id,weekday' },
  )

  if (error) throw error
}

export async function deleteAvailability(id: string): Promise<void> {
  const { error } = await supabase.from('doctor_availability').delete().eq('id', id)
  if (error) throw error
}

export async function fetchTimeOff(doctorId: string): Promise<DoctorTimeOff[]> {
  const { data, error } = await supabase
    .from('doctor_time_off')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('date', { ascending: true })

  if (error) throw error
  return (data ?? []) as DoctorTimeOff[]
}

export async function createTimeOff(input: {
  doctorId: string
  date: string
  reason: string
}): Promise<void> {
  const { error } = await supabase.from('doctor_time_off').insert({
    doctor_id: input.doctorId,
    date: input.date,
    reason: input.reason,
  })

  if (error) throw error
}

export async function deleteTimeOff(id: string): Promise<void> {
  const { error } = await supabase.from('doctor_time_off').delete().eq('id', id)
  if (error) throw error
}

export async function fetchBookedStartTimes(
  doctorId: string,
  dateKey: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('start_time')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', dateKey)
    .not('status', 'in', '(cancelled,rejected)')

  if (error) throw error
  return (data ?? []).map((row) => row.start_time)
}
