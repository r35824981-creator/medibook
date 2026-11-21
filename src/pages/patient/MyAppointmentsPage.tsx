import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarPlus, CalendarX2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared/PageHeader'
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
import { todayKey } from '@/lib/date'
import { getErrorMessage } from '@/lib/errors'

type TabValue = 'upcoming' | 'past' | 'all'

export function MyAppointmentsPage() {
  const navigate = useNavigate()
  const appointmentsQuery = useAppointments()
  const updateAppointment = useUpdateAppointment()
  useAppointmentRealtime()

  const [tab, setTab] = useState<TabValue>('upcoming')
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

  const past = useMemo(() => {
    const upcomingIds = new Set(upcoming.map((appointment) => appointment.id))
    return appointments.filter((appointment) => !upcomingIds.has(appointment.id))
  }, [appointments, upcoming])

  const visible = tab === 'upcoming' ? upcoming : tab === 'past' ? past : appointments

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
      <PageHeader
        title="My appointments"
        subtitle="Track requests, confirmed visits and past consultations."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/patient/doctors">
              <CalendarPlus className="h-3.5 w-3.5" />
              Book new
            </Link>
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as TabValue)}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          <TabsTrigger value="all">All ({appointments.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {appointmentsQuery.isLoading ? <LoadingState rows={3} /> : null}

      {appointmentsQuery.isError ? (
        <ErrorState
          message={getErrorMessage(appointmentsQuery.error)}
          onRetry={() => void appointmentsQuery.refetch()}
        />
      ) : null}

      {!appointmentsQuery.isLoading && !appointmentsQuery.isError ? (
        visible.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title={
              tab === 'upcoming'
                ? 'No upcoming appointments'
                : tab === 'past'
                  ? 'No past appointments'
                  : 'No appointments yet'
            }
            description={
              tab === 'upcoming'
                ? 'Book a slot with a doctor and it will appear here while it waits for confirmation.'
                : 'Completed, cancelled and rejected visits will appear here.'
            }
            actionLabel={tab === 'upcoming' ? 'Find a doctor' : undefined}
            onAction={tab === 'upcoming' ? () => navigate('/patient/doctors') : undefined}
          />
        ) : (
          <div className="space-y-3">
            {visible.map((appointment) => {
              const canCancel =
                appointment.appointment_date >= today &&
                (appointment.status === 'pending' || appointment.status === 'confirmed')

              return (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  viewer="patient"
                  actions={
                    canCancel ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-error hover:bg-error-soft"
                        onClick={() => setCancelId(appointment.id)}
                      >
                        Cancel appointment
                      </Button>
                    ) : null
                  }
                />
              )
            })}
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
