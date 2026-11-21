import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { addDays } from 'date-fns'
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Stethoscope,
  Users,
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
import { AppointmentCard } from '@/features/appointments/components/AppointmentCard'
import {
  useAppointmentRealtime,
  useAppointments,
  useUpdateAppointment,
} from '@/features/appointments/hooks'
import { useMyDoctor } from '@/features/doctors/hooks'
import { useAuth } from '@/features/auth/AuthProvider'
import { formatDateLong, formatDateShort, formatTime, toDateKey, todayKey } from '@/lib/date'
import { getErrorMessage } from '@/lib/errors'
import { formatInr } from '@/lib/utils'

export function DoctorHomePage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const doctorQuery = useMyDoctor(profile?.id)
  const appointmentsQuery = useAppointments()
  const updateAppointment = useUpdateAppointment()
  useAppointmentRealtime()

  const [rejectId, setRejectId] = useState<string | null>(null)
  const today = todayKey()
  const weekEnd = toDateKey(addDays(new Date(), 7))

  const appointments = appointmentsQuery.data ?? []

  const todayAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => appointment.appointment_date === today)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [appointments, today],
  )

  const pending = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            appointment.status === 'pending' && appointment.appointment_date >= today,
        )
        .sort(
          (a, b) =>
            a.appointment_date.localeCompare(b.appointment_date) ||
            a.start_time.localeCompare(b.start_time),
        ),
    [appointments, today],
  )

  const upcomingWeek = appointments.filter(
    (appointment) =>
      appointment.appointment_date >= today &&
      appointment.appointment_date <= weekEnd &&
      (appointment.status === 'pending' || appointment.status === 'confirmed'),
  )

  const completed = appointments.filter(
    (appointment) => appointment.status === 'completed',
  ).length

  async function confirmAppointment(id: string) {
    try {
      await updateAppointment.mutateAsync({ id, patch: { status: 'confirmed' } })
      toast.success('Appointment confirmed')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleReject() {
    if (!rejectId) return
    try {
      await updateAppointment.mutateAsync({ id: rejectId, patch: { status: 'rejected' } })
      toast.success('Appointment rejected')
      setRejectId(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  if (doctorQuery.isLoading) return <LoadingState rows={4} />

  if (doctorQuery.isError || !doctorQuery.data) {
    return (
      <ErrorState
        message={
          doctorQuery.isError
            ? getErrorMessage(doctorQuery.error)
            : 'Your account is not linked to a doctor profile yet. Ask an administrator to add you to the doctor directory.'
        }
        onRetry={() => void doctorQuery.refetch()}
      />
    )
  }

  const doctor = doctorQuery.data
  const firstName = profile?.full_name.replace(/^Dr\.?\s+/i, '').split(' ')[0] ?? 'Doctor'

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Welcome, Dr. ${firstName}`}
        subtitle={`${formatDateLong(new Date())} · ${doctor.specialization}`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Today's appointments"
          value={todayAppointments.filter((appointment) => appointment.status !== 'cancelled')
            .length}
          icon={CalendarDays}
          tone="accent"
          hint="Scheduled for today"
        />
        <MetricCard
          label="Pending requests"
          value={pending.length}
          icon={Clock3}
          tone="warning"
          hint="Waiting for your decision"
        />
        <MetricCard
          label="Next 7 days"
          value={upcomingWeek.length}
          icon={CalendarCheck}
          tone="success"
          hint="Pending and confirmed"
        />
        <MetricCard
          label="Completed visits"
          value={completed}
          icon={CheckCircle2}
          tone="default"
          hint="All time"
        />
      </div>

      {pending.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {pending.slice(0, 2).map((appointment) => (
            <AlertCard
              key={appointment.id}
              level="high"
              icon={Clock3}
              title={`${appointment.patient?.full_name ?? 'Patient'} requested a slot`}
              subtitle={`${formatTime(appointment.start_time)} · ${formatDateShort(
                appointment.appointment_date,
              )}`}
              detail={appointment.reason}
              action={
                <Button
                  size="sm"
                  className="bg-white/20 text-white hover:bg-white/30"
                  onClick={() => void confirmAppointment(appointment.id)}
                  disabled={updateAppointment.isPending}
                >
                  Confirm
                </Button>
              }
            />
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Today&apos;s schedule</p>
            <Link to="/doctor/appointments" className="text-xs text-accent hover:underline">
              All appointments
            </Link>
          </div>

          {todayAppointments.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nothing scheduled today"
              description="Use the time to review availability or check pending requests."
              actionLabel="Review availability"
              onAction={() => navigate('/doctor/availability')}
            />
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  viewer="doctor"
                  actions={
                    appointment.status === 'pending' ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => void confirmAppointment(appointment.id)}
                          disabled={updateAppointment.isPending}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-error hover:bg-error-soft"
                          onClick={() => setRejectId(appointment.id)}
                        >
                          Reject
                        </Button>
                      </>
                    ) : null
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-surface p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Stethoscope className="h-4 w-4" />
            </span>
            <p className="mt-4 text-sm font-medium text-ink">Your public profile</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Patients see your specialization, department, fee and bio when booking.
            </p>
            <div className="mt-4 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Department</span>
                <span className="font-medium text-ink">{doctor.department?.name ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Fee</span>
                <span className="font-medium text-ink">{formatInr(doctor.fees)}</span>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="mt-4 w-full">
              <Link to="/doctor/profile">Edit profile</Link>
            </Button>
          </div>

          <div className="rounded-2xl bg-ink p-5 text-white">
            <Users className="h-5 w-5 text-white/70" />
            <p className="mt-3 text-sm font-medium">Keep your week accurate</p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">
              Update availability before the week starts and block dates you will be away.
              Patients only see slots that actually exist.
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                asChild
                size="sm"
                className="bg-white/20 text-white hover:bg-white/30"
              >
                <Link to="/doctor/availability">Availability</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-white/10 text-white hover:bg-white/20"
              >
                <Link to="/doctor/time-off">Time off</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(rejectId)}
        onOpenChange={(open) => {
          if (!open) setRejectId(null)
        }}
        title="Reject this appointment?"
        description="The patient will be told the request was rejected and the slot is released."
        confirmLabel="Reject"
        cancelLabel="Keep it"
        destructive
        isLoading={updateAppointment.isPending}
        onConfirm={handleReject}
      />
    </div>
  )
}
