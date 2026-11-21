import type { Tables } from './database'

export type Role = 'patient' | 'doctor' | 'admin'

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'rejected'

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'rejected',
]

export type Profile = Omit<Tables<'profiles'>, 'role'> & { role: Role }
export type Department = Tables<'departments'>
export type Doctor = Tables<'doctors'>
export type DoctorAvailability = Tables<'doctor_availability'>
export type DoctorTimeOff = Tables<'doctor_time_off'>
export type Appointment = Omit<Tables<'appointments'>, 'status'> & {
  status: AppointmentStatus
}

export type DoctorListItem = Doctor & {
  profile: { full_name: string } | null
  department: { id: string; name: string } | null
}

export type AppointmentDoctor = Pick<
  Doctor,
  'id' | 'profile_id' | 'specialization' | 'fees' | 'photo_url'
> & {
  profile: { full_name: string } | null
  department: { name: string } | null
}

export type AppointmentPatient = Pick<Profile, 'id' | 'full_name' | 'phone'> | null

export type AppointmentWithRelations = Appointment & {
  doctor: AppointmentDoctor | null
  patient: AppointmentPatient
}

export type DoctorOption = {
  id: string
  label: string
}
