import { Stethoscope, UserRound } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import {
  formatDateShort,
  formatDayNumber,
  formatMonth,
  formatTimeRange,
  formatWeekday,
} from '@/lib/date'
import type { AppointmentWithRelations, Role } from '@/types'

export function AppointmentCard({
  appointment,
  viewer,
  actions,
}: {
  appointment: AppointmentWithRelations
  viewer: Role
  actions?: React.ReactNode
}) {
  const doctorName = appointment.doctor?.profile?.full_name ?? 'Doctor'
  const patientName = appointment.patient?.full_name ?? 'Patient'
  const specialization = appointment.doctor?.specialization
  const department = appointment.doctor?.department?.name

  const title = viewer === 'patient' ? doctorName : patientName
  const subtitle =
    viewer === 'patient'
      ? [specialization, department].filter(Boolean).join(' · ')
      : viewer === 'admin'
        ? [doctorName, department].filter(Boolean).join(' · ')
        : appointment.patient?.phone || 'Patient'

  const Icon = viewer === 'patient' ? Stethoscope : UserRound

  return (
    <div className="rounded-2xl bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-muted-soft">
            <span className="text-[10px] uppercase leading-none text-muted">
              {formatWeekday(appointment.appointment_date)}
            </span>
            <span className="mt-0.5 text-base font-medium leading-none text-ink">
              {formatDayNumber(appointment.appointment_date)}
            </span>
            <span className="mt-0.5 text-[9px] uppercase leading-none text-muted">
              {formatMonth(appointment.appointment_date)}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 shrink-0 text-muted" />
              <p className="truncate text-sm font-medium text-ink">{title}</p>
            </div>
            {subtitle ? <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p> : null}
            <p className="mt-1 text-xs text-ink">
              {formatTimeRange(appointment.start_time, appointment.end_time)}
              <span className="text-muted"> · {formatDateShort(appointment.appointment_date)}</span>
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <StatusBadge status={appointment.status} />
        </div>
      </div>

      {appointment.reason ? (
        <p className="mt-3 text-xs text-muted">
          <span className="font-medium text-ink">Reason:</span> {appointment.reason}
        </p>
      ) : null}

      {appointment.doctor_notes ? (
        <p className="mt-1.5 rounded-lg bg-muted-soft px-3 py-2 text-xs text-muted">
          <span className="font-medium text-ink">Doctor&apos;s notes:</span>{' '}
          {appointment.doctor_notes}
        </p>
      ) : null}

      {actions ? <div className="mt-3 flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
