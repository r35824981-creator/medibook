import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  Search,
  Stethoscope,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { MetricCard } from '@/components/shared/MetricCard'
import { AlertCard } from '@/components/shared/AlertCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AppointmentCard } from '@/features/appointments/components/AppointmentCard'
import {
  useAppointmentRealtime,
  useAppointments,
  useUpdateAppointment,
} from '@/features/appointments/hooks'
import { useDoctors } from '@/features/doctors/hooks'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  formatDateLong,
  formatDateShort,
  formatDayNumber,
  formatMonth,
  formatTimeRange,
  formatWeekday,
  todayKey,
} from '@/lib/date'
import { formatInr } from '@/lib/utils'
import { getErrorMessage } from '@/lib/errors'

export function PatientHomePage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const appointmentsQuery = useAppointments()
  const doctorsQuery = useDoctors()
  const updateAppointment = useUpdateAppointment()
  useAppointmentRealtime()

  const [cancelId, setCancelId] = useState<string | null>(null)
  const today = todayKey()

  const appointments = appointmentsQuery.data ?? []

  const upcoming = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            appointment.appointment_date >= today &&
            (appointment.status === 'pending' || appointment.status === 'confirmed'),
        )
        .sort(
          (a, b) =>
            a.appointment_date.localeCompare(b.appointment_date) ||
            a.start_time.localeCompare(b.start_time),
        ),
    [appointments, today],
  )

  const next = upcoming[0]
  const pendingCount = upcoming.filter((appointment) => appointment.status === 'pending').length
  const completedCount = appointments.filter(
    (appointment) => appointment.status === 'completed',
  ).length
  const past = appointments
    .filter(
      (appointment) =>
        !upcoming.some((upcomingAppointment) => upcomingAppointment.id === appointment.id),
    )
    .slice(0, 3)

  const firstName = profile?.full_name.split(' ')[0] ?? 'there'

  async function handleCancel() {
    if (!cancelId) return
    try {
      await updateAppointment.mutateAsync({ id: cancelId, patch: { status: 'cancelled' } })
      toast.success('Appointment cancelled')
      setCancelId(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title={`Welcome, ${firstName}`} subtitle={formatDateLong(new Date())} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Upcoming"
          value={upcoming.length}
          icon={CalendarDays}
          tone="accent"
          hint="Pending and confirmed visits"
        />
        <MetricCard
          label="Awaiting confirmation"
          value={pendingCount}
          icon={Clock3}
          tone="warning"
          hint="The doctor still needs to confirm"
        />
        <MetricCard
          label="Completed visits"
          value={completedCount}
          icon={CheckCircle2}
          tone="success"
          hint="All time"
        />
        <MetricCard
          label="Doctors available"
          value={doctorsQuery.data?.length ?? 0}
          icon={Stethoscope}
          tone="default"
          hint="Across every department"
        />
      </div>

      {appointmentsQuery.isLoading ? <LoadingState rows={2} /> : null}
      {appointmentsQuery.isError ? (
        <ErrorState
          message={getErrorMessage(appointmentsQuery.error)}
          onRetry={() => void appointmentsQuery.refetch()}
        />
      ) : null}

      {!appointmentsQuery.isLoading && !appointmentsQuery.isError ? (
        appointments.length === 0 ? (
          <EmptyState
            icon={CalendarPlus}
            title="No appointments yet"
            description="Find a doctor, pick a free slot and your first appointment will show up here."
            actionLabel="Find a doctor"
            onAction={() => navigate('/patient/doctors')}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
            <div className="space-y-4">
              {next ? (
                <div className="rounded-2xl bg-surface p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-medium text-ink">Next appointment</p>
                    <StatusBadge status={next.status} />
                  </div>

                  <div className="mt-4 flex gap-4">
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-muted-soft">
                      <span className="text-[10px] uppercase text-muted">
                        {formatWeekday(next.appointment_date)}
                      </span>
                      <span className="text-xl font-medium text-ink">
                        {formatDayNumber(next.appointment_date)}
                      </span>
                      <span className="text-[10px] uppercase text-muted">
                        {formatMonth(next.appointment_date)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">
                        {next.doctor?.profile?.full_name ?? 'Doctor'}
                      </p>
                      <p className="text-xs text-muted">
                        {[next.doctor?.specialization, next.doctor?.department?.name]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      <p className="mt-2 text-xs text-ink">
                        {formatTimeRange(next.start_time, next.end_time)}
                        <span className="text-muted">
                          {' '}
                          · {formatDateShort(next.appointment_date)}
                        </span>
                      </p>
                      {next.doctor?.fees ? (
                        <p className="mt-1 text-xs text-muted">
                          Consultation fee {formatInr(next.doctor.fees)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {next.reason ? (
                    <p className="mt-3 rounded-lg bg-muted-soft px-3 py-2 text-xs text-muted">
                      <span className="font-medium text-ink">Reason:</span> {next.reason}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/patient/appointments">View all appointments</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-error hover:bg-error-soft"
                      onClick={() => setCancelId(next.id)}
                    >
                      Cancel appointment
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={CalendarPlus}
                  title="No upcoming appointments"
                  description="Your past visits are below. Book a new slot whenever you need one."
                  actionLabel="Book an appointment"
                  onAction={() => navigate('/patient/doctors')}
                />
              )}

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-ink">Recent activity</p>
                  <Link
                    to="/patient/appointments"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    See all
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {past.length === 0 ? (
                  <div className="rounded-2xl bg-surface px-5 py-8 text-center text-xs text-muted">
                    Nothing here yet. Completed and cancelled visits will appear here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {past.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        viewer="patient"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {next ? (
                <AlertCard
                  level={next.status === 'pending' ? 'high' : 'medium'}
                  icon={next.status === 'pending' ? Clock3 : CalendarCheck}
                  title={
                    next.status === 'pending'
                      ? 'Waiting for the doctor'
                      : 'Your appointment is confirmed'
                  }
                  subtitle={`${next.doctor?.profile?.full_name ?? 'Doctor'} · ${formatDateShort(
                    next.appointment_date,
                  )}`}
                  detail={
                    next.status === 'pending'
                      ? 'The doctor usually confirms within a few hours. You will get an email once it is confirmed.'
                      : 'You will get a reminder email 24 hours before the visit. Arrive 10 minutes early.'
                  }
                  action={
                    <Button
                      asChild
                      size="sm"
                      className="bg-white/20 text-white hover:bg-white/30"
                    >
                      <Link to="/patient/appointments">View</Link>
                    </Button>
                  }
                />
              ) : null}

              <div className="rounded-2xl bg-surface p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Search className="h-4 w-4" />
                </span>
                <p className="mt-4 text-sm font-medium text-ink">Need another visit?</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Search by department or specialization and book the next free slot.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-4 w-full">
                  <Link to="/patient/doctors">Find a doctor</Link>
                </Button>
              </div>

              <div className="rounded-2xl bg-ink p-5 text-white">
                <p className="text-xs text-white/70">Appointment policy</p>
                <p className="mt-2 text-sm font-medium">Cancel early, help another patient</p>
                <p className="mt-1 text-xs leading-relaxed text-white/60">
                  You can cancel a pending or confirmed appointment from this dashboard. The slot
                  is released immediately.
                </p>
              </div>
            </div>
          </div>
        )
      ) : null}

      <ConfirmDialog
        open={Boolean(cancelId)}
        onOpenChange={(open) => {
          if (!open) setCancelId(null)
        }}
        title="Cancel this appointment?"
        description="The slot will be released for other patients. This cannot be undone."
        confirmLabel="Cancel appointment"
        cancelLabel="Keep it"
        destructive
        isLoading={updateAppointment.isPending}
        onConfirm={handleCancel}
      />
    </div>
  )
}
