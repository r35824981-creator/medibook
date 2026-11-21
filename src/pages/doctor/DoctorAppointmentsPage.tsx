import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Search,
  Stethoscope,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { AppointmentCard } from '@/features/appointments/components/AppointmentCard'
import { NotesDialog } from '@/features/appointments/components/NotesDialog'
import {
  useAppointmentRealtime,
  useAppointments,
  useUpdateAppointment,
} from '@/features/appointments/hooks'
import { useMyDoctor } from '@/features/doctors/hooks'
import { useAuth } from '@/features/auth/AuthProvider'
import { getErrorMessage } from '@/lib/errors'
import type { AppointmentStatus, AppointmentWithRelations } from '@/types'

type TabValue = 'pending' | 'confirmed' | 'completed' | 'all'

const tabStatus: Record<Exclude<TabValue, 'all'>, AppointmentStatus[]> = {
  pending: ['pending'],
  confirmed: ['confirmed'],
  completed: ['completed'],
}

export function DoctorAppointmentsPage() {
  const { profile } = useAuth()
  const doctorQuery = useMyDoctor(profile?.id)
  const appointmentsQuery = useAppointments()
  const updateAppointment = useUpdateAppointment()
  useAppointmentRealtime()

  const [tab, setTab] = useState<TabValue>('pending')
  const [search, setSearch] = useState('')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [notesTarget, setNotesTarget] = useState<AppointmentWithRelations | null>(null)

  const appointments = appointmentsQuery.data ?? []

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return appointments
      .filter((appointment) => {
        if (tab !== 'all' && !tabStatus[tab].includes(appointment.status)) return false
        if (!term) return true
        return (
          appointment.patient?.full_name?.toLowerCase().includes(term) ||
          appointment.reason.toLowerCase().includes(term)
        )
      })
      .sort(
        (a, b) =>
          a.appointment_date.localeCompare(b.appointment_date) ||
          a.start_time.localeCompare(b.start_time),
      )
  }, [appointments, search, tab])

  const counts = {
    pending: appointments.filter((appointment) => appointment.status === 'pending').length,
    confirmed: appointments.filter((appointment) => appointment.status === 'confirmed').length,
    completed: appointments.filter((appointment) => appointment.status === 'completed').length,
  }

  async function setStatus(id: string, status: AppointmentStatus, message: string) {
    try {
      await updateAppointment.mutateAsync({ id, patch: { status } })
      toast.success(message)
      setRejectId(null)
      setCancelId(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  function actionsFor(appointment: AppointmentWithRelations) {
    if (appointment.status === 'pending') {
      return (
        <>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void setStatus(appointment.id, 'confirmed', 'Appointment confirmed')}
            disabled={updateAppointment.isPending}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Confirm
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-error hover:bg-error-soft"
            onClick={() => setRejectId(appointment.id)}
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </Button>
        </>
      )
    }

    if (appointment.status === 'confirmed') {
      return (
        <>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void setStatus(appointment.id, 'completed', 'Visit marked complete')}
            disabled={updateAppointment.isPending}
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            Mark completed
          </Button>
          <Button size="sm" variant="outline" onClick={() => setNotesTarget(appointment)}>
            {appointment.doctor_notes ? 'Edit notes' : 'Add notes'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-error hover:bg-error-soft"
            onClick={() => setCancelId(appointment.id)}
          >
            Cancel
          </Button>
        </>
      )
    }

    return (
      <Button size="sm" variant="outline" onClick={() => setNotesTarget(appointment)}>
        {appointment.doctor_notes ? 'Edit notes' : 'Add notes'}
      </Button>
    )
  }

  if (doctorQuery.isError) {
    return (
      <ErrorState
        message="Your account is not linked to a doctor profile yet. Ask an administrator to add you to the directory."
        onRetry={() => void doctorQuery.refetch()}
      />
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Appointments"
        subtitle="Confirm requests, complete visits and keep notes for your patients."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/doctor/availability">
              <Clock3 className="h-3.5 w-3.5" />
              Availability
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={tab} onValueChange={(value) => setTab(value as TabValue)}>
          <TabsList>
            <TabsTrigger value="pending">Needs action ({counts.pending})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed ({counts.confirmed})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
            <TabsTrigger value="all">All ({appointments.length})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative md:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search patient or reason"
            className="pl-9"
            aria-label="Search appointments"
          />
        </div>
      </div>

      {appointmentsQuery.isLoading ? <LoadingState rows={3} /> : null}

      {appointmentsQuery.isError ? (
        <ErrorState
          message={getErrorMessage(appointmentsQuery.error)}
          onRetry={() => void appointmentsQuery.refetch()}
        />
      ) : null}

      {!appointmentsQuery.isLoading && !appointmentsQuery.isError ? (
        filtered.length === 0 ? (
          <EmptyState
            icon={tab === 'pending' ? Clock3 : CalendarDays}
            title={
              tab === 'pending'
                ? 'No requests waiting'
                : tab === 'confirmed'
                  ? 'No confirmed appointments'
                  : tab === 'completed'
                    ? 'No completed visits yet'
                    : 'No appointments found'
            }
            description={
              tab === 'pending'
                ? 'New patient requests will show up here for you to confirm or reject.'
                : 'Try another tab or clear the search.'
            }
            actionLabel={search ? 'Clear search' : undefined}
            onAction={search ? () => setSearch('') : undefined}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                viewer="doctor"
                actions={actionsFor(appointment)}
              />
            ))}
          </div>
        )
      ) : null}

      <div className="rounded-2xl bg-muted-soft p-4">
        <div className="flex items-start gap-2">
          <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
          <p className="text-xs leading-relaxed text-muted">
            Patients get an email when you confirm. Marking a visit complete keeps your reports and
            the admin dashboard accurate.
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(rejectId)}
        onOpenChange={(open) => {
          if (!open) setRejectId(null)
        }}
        title="Reject this appointment?"
        description="The slot is released immediately and the patient is told the request was rejected."
        confirmLabel="Reject request"
        cancelLabel="Keep it"
        destructive
        isLoading={updateAppointment.isPending}
        onConfirm={() => {
          if (rejectId) void setStatus(rejectId, 'rejected', 'Appointment rejected')
        }}
      />

      <ConfirmDialog
        open={Boolean(cancelId)}
        onOpenChange={(open) => {
          if (!open) setCancelId(null)
        }}
        title="Cancel this appointment?"
        description="The patient will be notified and the slot released for someone else."
        confirmLabel="Cancel appointment"
        cancelLabel="Keep it"
        destructive
        isLoading={updateAppointment.isPending}
        onConfirm={() => {
          if (cancelId) void setStatus(cancelId, 'cancelled', 'Appointment cancelled')
        }}
      />

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
