import {
  BarChart3,
  Building2,
  CalendarDays,
  CalendarOff,
  Clock,
  Home,
  Settings,
  Stethoscope,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/types'

export type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export const navByRole: Record<Role, NavItem[]> = {
  patient: [
    { label: 'Home', to: '/patient', icon: Home, end: true },
    { label: 'Find Doctors', to: '/patient/doctors', icon: Stethoscope },
    { label: 'My Appointments', to: '/patient/appointments', icon: CalendarDays },
    { label: 'Profile', to: '/patient/profile', icon: UserRound },
  ],
  doctor: [
    { label: 'Home', to: '/doctor', icon: Home, end: true },
    { label: 'Appointments', to: '/doctor/appointments', icon: CalendarDays },
    { label: 'Availability', to: '/doctor/availability', icon: Clock },
    { label: 'Time Off', to: '/doctor/time-off', icon: CalendarOff },
    { label: 'Profile', to: '/doctor/profile', icon: UserRound },
  ],
  admin: [
    { label: 'Home', to: '/admin', icon: Home, end: true },
    { label: 'Doctors', to: '/admin/doctors', icon: Stethoscope },
    { label: 'Departments', to: '/admin/departments', icon: Building2 },
    { label: 'Appointments', to: '/admin/appointments', icon: CalendarDays },
    { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
    { label: 'Settings', to: '/admin/settings', icon: Settings },
  ],
}

export const primaryActionByRole: Record<Role, { label: string; to: string }> = {
  patient: { label: 'Book appointment', to: '/patient/doctors' },
  doctor: { label: 'Set availability', to: '/doctor/availability' },
  admin: { label: 'Add doctor', to: '/admin/doctors?new=1' },
}
