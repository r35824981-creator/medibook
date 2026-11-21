import { useMemo, useState } from 'react'
import { CalendarDays, ChevronDown, Search, Stethoscope } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { NotesDialog } from '@/features/appointments/components/NotesDialog'
import {
  useAppointmentRealtime,
  useAppointments,
  useUpdateAppointment,
} from '@/features/appointments/hooks'
import { useDoctors } from '@/features/doctors/hooks'
import { APPOINTMENT_STATUSES, type AppointmentStatus, type AppointmentWithRelations } from '@/types'
import { formatDateShort, formatTime, todayKey } from '@/lib/date'
import { getErrorMessage } from '@/lib/errors'
import { formatInr } from '@/lib/utils'

const statusLabels: Record<AppointmentStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
}

type DateFilter = 'all' | 'today' | 'upcoming' | 'past'

export function AdminAppointmentsPage() {
  const appointmentsQuery = useAppointments()
  const doctorsQuery = useDoctors({ includeInactive: true })
  const updateAppointment = useUpdateAppointment()
  useAppointmentRealtime()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | AppointmentStatus>('all')
  const [doctorId, setDoctorId] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('upcoming')
  const [notesTarget, setNotesTarget] = useState<AppointmentWithRelations | null>(null)

  const today = todayKey()
  const appointments = appointmentsQuery.data ?? []

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return appointments
      .filter((appointment) => {
        if (status !== 'all' && appointment.status !== status) return false
        if (doctorId && appointment.doctor?.id !== doctorId) return false

        if (dateFilter === 'today' && appointment.appointment_date !== today) return false
        if (dateFilter === 'upcoming' && appointment.appointment_date < today) return false
        if (dateFilter === 'past' && appointment.appointment_date >= today) return false

        if (!term) return true
        return (
          appointment.patient?.full_name?.toLowerCase().includes(term) ||
          appointment.doctor?.profile?.full_name?.toLowerCase().includes(term) ||
          appointment.reason.toLowerCase().includes(term)
        )
      })
      .sort(
        (a, b) =>
          b.appointment_date.localeCompare(a.appointment_date) ||
          b.start_time.localeCompare(a.start_time),
      )
  }, [appointments, dateFilter, doctorId, search, status, today])

  async function changeStatus(appointment: AppointmentWithRelations, next: AppointmentStatus) {
    if (next === appointment.status) return
    try {
      await updateAppointment.mutateAsync({ id: appointment.id, patch: { status: next } })
      toast.success(`Marked ${statusLabels[next].toLowerCase()}`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="All appointments"
        subtitle="Every appointment across the hospital. Admins can override any status."
      />

      <div className="rounded-2xl bg-surface p-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patient, doctor or reason"
              className="pl-9"
              aria-label="Search appointments"
            />
          </div>

          <Select
            value={status}
            onValueChange={(value) => setStatus(value as 'all' | AppointmentStatus)}
          >
            <SelectTrigger aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {APPOINTMENT_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {statusLabels[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={doctorId} onValueChange={setDoctorId}>
            <SelectTrigger aria-label="Filter by doctor">
              <span className="flex items-center gap-2 truncate">
                <Stethoscope className="h-3.5 w-3.5 shrink-0 text-muted" />
                <SelectValue placeholder="All doctors" />
              </span>
            </SelectTrigger>
            <SelectContent>
              {(doctorsQuery.data ?? []).map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.profile?.full_name ?? 'Doctor'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
            <SelectTrigger aria-label="Filter by date">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-muted" />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="past">Past</SelectItem>
              <SelectItem value="all">Any date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          {filtered.length} of {appointments.length} appointments
        </p>
      </div>

      {appointmentsQuery.isLoading ? <LoadingState rows={5} /> : null}

      {appointmentsQuery.isError ? (
        <ErrorState
          message={getErrorMessage(appointmentsQuery.error)}
          onRetry={() => void appointmentsQuery.refetch()}
        />
      ) : null}

      {!appointmentsQuery.isLoading && !appointmentsQuery.isError ? (
        filtered.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No appointments match"
            description="Change the filters or clear the search to see more appointments."
            actionLabel="Clear filters"
            onAction={() => {
              setSearch('')
              setStatus('all')
              setDoctorId('')
              setDateFilter('all')
            }}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl bg-surface">
            <div className="hidden grid-cols-[1.3fr_1.3fr_1fr_0.6fr_0.8fr_0.6fr] gap-4 border-b border-line px-5 py-3 text-[11px] font-medium text-muted lg:grid">
              <span>Patient</span>
              <span>Doctor</span>
              <span>Date &amp; time</span>
              <span>Fee</span>
              <span>Status</span>
              <span className="text-right">Manage</span>
            </div>

            <div className="divide-y divide-line">
              {filtered.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex flex-col gap-3 px-5 py-4 lg:grid lg:grid-cols-[1.3fr_1.3fr_1fr_0.6fr_0.8fr_0.6fr] lg:items-center lg:gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {appointment.patient?.full_name ?? 'Patient'}
                    </p>
                    <p className="truncate text-[11px] text-muted">
                      {appointment.patient?.phone || 'No phone'}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs text-ink lg:text-sm">
                      {appointment.doctor?.profile?.full_name ?? 'Doctor'}
                    </p>
                    <p className="truncate text-[11px] text-muted">
                      {appointment.doctor?.department?.name ?? 'Unassigned'}
                    </p>
                  </div>

                  <div className="text-xs text-ink lg:text-sm">
                    {formatDateShort(appointment.appointment_date)}
                    <span className="text-muted"> · {formatTime(appointment.start_time)}</span>
                  </div>

                  <div className="text-xs text-ink lg:text-sm">
                    {formatInr(appointment.doctor?.fees ?? 0)}
                  </div>

                  <div>
                    <StatusBadge status={appointment.status} />
                  </div>

                  <div className="flex items-center gap-2 lg:justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                          Manage
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Change status</DropdownMenuLabel>
                        {APPOINTMENT_STATUSES.map((item) => (
                          <DropdownMenuItem
                            key={item}
                            disabled={item === appointment.status || updateAppointment.isPending}
                            onSelect={() => void changeStatus(appointment, item)}
                          >
                            {statusLabels[item]}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setNotesTarget(appointment)}>
                          {appointment.doctor_notes ? 'Edit notes' : 'Add notes'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {appointment.reason ? (
                    <p className="text-[11px] text-muted lg:col-span-6">
                      <span className="font-medium text-ink">Reason:</span> {appointment.reason}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )
      ) : null}

      <NotesDialog
        appointment={notesTarget}
        open={Boolean(notesTarget)}
        onOpenChange={(open) => {
          if (!open) setNotesTarget(null)
        }}
      />
    </div>
  )
}
