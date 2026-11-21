import type { Role } from '@/types'

export function homePathForRole(role: Role): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'doctor':
      return '/doctor'
    default:
      return '/patient'
  }
}

export const roleLabels: Record<Role, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  admin: 'Administrator',
}
