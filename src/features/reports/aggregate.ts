import { eachDayOfInterval, format, startOfDay, subDays } from 'date-fns'
import { toDateKey } from '@/lib/date'
import type { AppointmentStatus, AppointmentWithRelations } from '@/types'

export type StatusCount = {
  status: AppointmentStatus
  label: string
  count: number
}

export type DoctorStat = {
  name: string
  total: number
  completed: number
  cancelled: number
}

export type ReportData = {
  total: number
  completed: number
  cancelled: number
  pending: number
  confirmed: number
  cancellationRate: number
  busiestHour: string
  perDay: { date: string; label: string; total: number; completed: number }[]
  perDoctor: DoctorStat[]
  perHour: { hour: string; total: number }[]
  perDepartment: { name: string; total: number }[]
  statusCounts: StatusCount[]
}

const statusLabels: Record<AppointmentStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
}

const statuses: AppointmentStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'rejected',
]

function hourLabel(hour: number): string {
  const suffix = hour < 12 ? 'AM' : 'PM'
  return `${hour % 12 || 12} ${suffix}`
}

export function buildReport(
  appointments: AppointmentWithRelations[],
  rangeDays: number,
): ReportData {
  const end = startOfDay(new Date())
  const start = subDays(end, rangeDays - 1)
  const startKey = toDateKey(start)
  const endKey = toDateKey(end)

  const inRange = appointments.filter(
    (appointment) =>
      appointment.appointment_date >= startKey && appointment.appointment_date <= endKey,
  )

  const completed = inRange.filter((appointment) => appointment.status === 'completed').length
  const cancelled = inRange.filter(
    (appointment) => appointment.status === 'cancelled' || appointment.status === 'rejected',
  ).length
  const pending = inRange.filter((appointment) => appointment.status === 'pending').length
  const confirmed = inRange.filter((appointment) => appointment.status === 'confirmed').length

  const days = eachDayOfInterval({ start, end })
  const perDay = days.map((day) => {
    const key = toDateKey(day)
    const dayAppointments = inRange.filter(
      (appointment) => appointment.appointment_date === key,
    )
    return {
      date: key,
      label: format(day, 'd MMM'),
      total: dayAppointments.length,
      completed: dayAppointments.filter((appointment) => appointment.status === 'completed')
        .length,
    }
  })

  const doctorMap = new Map<string, DoctorStat>()
  for (const appointment of inRange) {
    const name = appointment.doctor?.profile?.full_name ?? 'Unassigned'
    const current = doctorMap.get(name) ?? {
      name,
      total: 0,
      completed: 0,
      cancelled: 0,
    }
    current.total += 1
    if (appointment.status === 'completed') current.completed += 1
    if (appointment.status === 'cancelled' || appointment.status === 'rejected') {
      current.cancelled += 1
    }
    doctorMap.set(name, current)
  }
  const perDoctor = Array.from(doctorMap.values()).sort((a, b) => b.total - a.total)

  const hourMap = new Map<number, number>()
  for (const appointment of inRange) {
    const hour = Number(appointment.start_time.slice(0, 2))
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1)
  }
  const perHour = Array.from({ length: 12 }, (_, index) => index + 8).map((hour) => ({
    hour: hourLabel(hour),
    total: hourMap.get(hour) ?? 0,
  }))

  const departmentMap = new Map<string, number>()
  for (const appointment of inRange) {
    const name = appointment.doctor?.department?.name ?? 'Unassigned'
    departmentMap.set(name, (departmentMap.get(name) ?? 0) + 1)
  }
  const perDepartment = Array.from(departmentMap.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)

  const statusCounts = statuses.map((status) => ({
    status,
    label: statusLabels[status],
    count: inRange.filter((appointment) => appointment.status === status).length,
  }))

  const busiest = perHour.reduce(
    (best, current) => (current.total > best.total ? current : best),
    perHour[0] ?? { hour: '—', total: 0 },
  )

  return {
    total: inRange.length,
    completed,
    cancelled,
    pending,
    confirmed,
    cancellationRate: inRange.length === 0 ? 0 : Math.round((cancelled / inRange.length) * 100),
    busiestHour: busiest.total > 0 ? busiest.hour : '—',
    perDay,
    perDoctor,
    perHour,
    perDepartment,
    statusCounts,
  }
}
