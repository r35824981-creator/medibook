import { CalendarClock, Info, Stethoscope } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { AvailabilityDayRow } from '@/features/availability/components/AvailabilityDayRow'
import { useAvailability } from '@/features/availability/hooks'
import { useMyDoctor } from '@/features/doctors/hooks'
import { useAuth } from '@/features/auth/AuthProvider'
import { getErrorMessage } from '@/lib/errors'
import { timeToMinutes } from '@/lib/date'

const weekdays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export function DoctorAvailabilityPage() {
  const { profile } = useAuth()
  const doctorQuery = useMyDoctor(profile?.id)
  const doctor = doctorQuery.data

  const availabilityQuery = useAvailability(doctor?.id)

  if (doctorQuery.isLoading || availabilityQuery.isLoading) {
    return <LoadingState rows={4} />
  }

  if (doctorQuery.isError || !doctor) {
    return (
      <ErrorState
        message={
          doctorQuery.isError
            ? getErrorMessage(doctorQuery.error)
            : 'Your account is not linked to a doctor profile yet. Ask an administrator to add you to the directory.'
        }
        onRetry={() => void doctorQuery.refetch()}
      />
    )
  }

  const rules = availabilityQuery.data ?? []
  const activeDays = rules.length
  const weeklyMinutes = rules.reduce(
    (total, rule) => total + (timeToMinutes(rule.end_time) - timeToMinutes(rule.start_time)),
    0,
  )
  const weeklySlots = rules.reduce((total, rule) => {
    const span = timeToMinutes(rule.end_time) - timeToMinutes(rule.start_time)
    return total + Math.floor(span / rule.slot_minutes)
  }, 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Weekly availability"
        subtitle="Patients only see slots generated from these rules. Slots are never stored."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-surface p-5">
          <p className="text-xs text-muted">Days open</p>
          <p className="mt-1 text-2xl font-medium text-ink">{activeDays} / 7</p>
        </div>
        <div className="rounded-2xl bg-surface p-5">
          <p className="text-xs text-muted">Weekly hours</p>
          <p className="mt-1 text-2xl font-medium text-ink">
            {(weeklyMinutes / 60).toFixed(weeklyMinutes % 60 === 0 ? 0 : 1)} h
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-5">
          <p className="text-xs text-muted">Bookable slots per week</p>
          <p className="mt-1 text-2xl font-medium text-ink">{weeklySlots}</p>
        </div>
      </div>

      {availabilityQuery.isError ? (
        <ErrorState
          message={getErrorMessage(availabilityQuery.error)}
          onRetry={() => void availabilityQuery.refetch()}
        />
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted" />
          <p className="text-sm font-medium text-ink">Opening hours</p>
        </div>

        {weekdays.map((day, weekday) => (
          <AvailabilityDayRow
            key={day}
            doctorId={doctor.id}
            weekday={weekday}
            rule={rules.find((rule) => rule.weekday === weekday)}
          />
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-surface p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Stethoscope className="h-4 w-4" />
          </span>
          <p className="mt-4 text-sm font-medium text-ink">How slots work</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            A slot exists when the day is open, the time falls inside your hours, the date is not
            blocked and nobody has booked it. Change a rule and patients see it instantly.
          </p>
        </div>

        <div className="rounded-2xl bg-muted-soft p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-muted">
            <Info className="h-4 w-4" />
          </span>
          <p className="mt-4 text-sm font-medium text-ink">Existing appointments stay safe</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Shortening your hours does not cancel confirmed visits. Review the appointments page if
            you change a day that already has bookings.
          </p>
        </div>
      </div>
    </div>
  )
}
