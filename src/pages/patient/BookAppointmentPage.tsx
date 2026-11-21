import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { addDays } from 'date-fns'
import { ArrowLeft, CalendarOff, Check, Clock3, Loader2, Stethoscope } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { ErrorState } from '@/components/shared/ErrorState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useAppointmentRealtime, useBookAppointment } from '@/features/appointments/hooks'
import {
  useAvailability,
  useBookedStartTimes,
  useTimeOff,
} from '@/features/availability/hooks'
import { buildSlots, type Slot } from '@/features/availability/slots'
import { useDoctor } from '@/features/doctors/hooks'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  BOOKING_WINDOW_DAYS,
  formatDateLong,
  formatDateShort,
  formatDayNumber,
  formatMonth,
  formatTimeRange,
  formatWeekday,
  fromDateKey,
  toDateKey,
} from '@/lib/date'
import { getErrorMessage } from '@/lib/errors'
import { cn, formatInr, initials } from '@/lib/utils'

export function BookAppointmentPage() {
  const { doctorId } = useParams<{ doctorId: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const doctorQuery = useDoctor(doctorId)
  const availabilityQuery = useAvailability(doctorId)
  const timeOffQuery = useTimeOff(doctorId)
  const bookAppointment = useBookAppointment()
  useAppointmentRealtime()

  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const days = useMemo(
    () => Array.from({ length: BOOKING_WINDOW_DAYS }, (_, index) => addDays(new Date(), index)),
    [],
  )

  const availability = availabilityQuery.data ?? []
  const timeOff = timeOffQuery.data ?? []

  function ruleFor(dateKey: string) {
    const weekday = fromDateKey(dateKey).getDay()
    return availability.find((rule) => rule.weekday === weekday) ?? null
  }

  function isBlocked(dateKey: string) {
    return timeOff.some((entry) => entry.date === dateKey)
  }

  const firstAvailable = days.find((day) => {
    const key = toDateKey(day)
    return Boolean(ruleFor(key)) && !isBlocked(key)
  })

  const effectiveDate = selectedDate || (firstAvailable ? toDateKey(firstAvailable) : '')
  const rule = effectiveDate ? ruleFor(effectiveDate) : null
  const blocked = effectiveDate ? isBlocked(effectiveDate) : false

  const bookedQuery = useBookedStartTimes(doctorId, effectiveDate)

  const slots = useMemo(
    () =>
      buildSlots({
        dateKey: effectiveDate,
        availability: rule,
        hasTimeOff: blocked,
        bookedStartTimes: bookedQuery.data ?? [],
      }),
    [effectiveDate, rule, blocked, bookedQuery.data],
  )

  // Another patient may book the selected slot while this page is open. The
  // realtime subscription refetches booked times; drop a selection that is gone.
  useEffect(() => {
    if (!selectedSlot) return
    if (slots.some((slot) => slot.startTime === selectedSlot.startTime)) return

    setSelectedSlot(null)
    setError('That slot was just booked by someone else. Please pick another time.')
  }, [slots, selectedSlot])

  const doctor = doctorQuery.data
  const name = doctor?.profile?.full_name ?? 'Doctor'
  const isLoading = doctorQuery.isLoading || availabilityQuery.isLoading || timeOffQuery.isLoading

  function handleSelectDate(key: string) {
    setSelectedDate(key)
    setSelectedSlot(null)
    setError('')
  }

  async function handleBook() {
    if (!profile || !doctorId || !selectedSlot || !effectiveDate) {
      setError('Choose a date and a slot first')
      return
    }

    if (reason.trim().length < 5) {
      setError('Tell the doctor why you are visiting (at least 5 characters)')
      return
    }

    setError('')

    try {
      await bookAppointment.mutateAsync({
        patientId: profile.id,
        doctorId,
        appointmentDate: effectiveDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason: reason.trim(),
      })
      toast.success('Appointment requested. The doctor will confirm it shortly.')
      navigate('/patient/appointments')
    } catch (bookingError) {
      setError(getErrorMessage(bookingError))
      void bookedQuery.refetch()
    }
  }

  if (doctorQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(doctorQuery.error)}
        onRetry={() => void doctorQuery.refetch()}
      />
    )
  }

  return (
    <div className="space-y-5">
      <Link
        to="/patient/doctors"
        className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to doctors
      </Link>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : !doctor ? (
        <ErrorState message="This doctor could not be found or is no longer available." />
      ) : (
        <>
          <div className="rounded-2xl bg-surface p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-xl">
                  {doctor.photo_url ? <AvatarImage src={doctor.photo_url} alt={name} /> : null}
                  <AvatarFallback className="rounded-xl">{initials(name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-ink">{name}</p>
                  <p className="text-xs text-muted">
                    {[doctor.specialization, doctor.department?.name].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
                  {formatInr(doctor.fees)}
                </span>
                <StatusBadge status="pending" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {[
              { step: 1, label: 'Pick a date' },
              { step: 2, label: 'Pick a slot' },
              { step: 3, label: 'Confirm' },
            ].map((item) => {
              const active = item.step === (selectedSlot ? 3 : effectiveDate ? 2 : 1)
              const done = item.step < (selectedSlot ? 3 : effectiveDate ? 2 : 1)
              return (
                <div key={item.step} className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium',
                      active
                        ? 'bg-accent text-white'
                        : done
                          ? 'bg-success-soft text-success'
                          : 'bg-muted-soft text-muted',
                    )}
                  >
                    {done ? <Check className="h-3 w-3" /> : item.step}
                  </span>
                  <span className={active ? 'font-medium text-ink' : 'text-muted'}>
                    {item.label}
                  </span>
                  {item.step < 3 ? <span className="text-line">—</span> : null}
                </div>
              )
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-4">
              <div className="rounded-2xl bg-surface p-5">
                <div className="flex items-center justify-between">
                  <p className="text-base font-medium text-ink">Choose a date</p>
                  <span className="text-xs text-muted">Next {BOOKING_WINDOW_DAYS} days</span>
                </div>

                <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
                  {days.map((day) => {
                    const key = toDateKey(day)
                    const available = Boolean(ruleFor(key)) && !isBlocked(key)
                    const selected = key === effectiveDate

                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={!available}
                        onClick={() => handleSelectDate(key)}
                        className={cn(
                          'flex w-16 shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2 py-2.5 transition-colors',
                          selected
                            ? 'border-accent bg-accent text-white'
                            : available
                              ? 'border-line bg-surface text-ink hover:border-accent'
                              : 'border-line bg-muted-soft text-muted opacity-50',
                        )}
                      >
                        <span className="text-[10px] uppercase">{formatWeekday(day)}</span>
                        <span className="text-lg font-medium leading-none">
                          {formatDayNumber(day)}
                        </span>
                        <span className="text-[10px] uppercase">{formatMonth(day)}</span>
                      </button>
                    )
                  })}
                </div>

                {!firstAvailable ? (
                  <p className="mt-4 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
                    This doctor has no availability in the next {BOOKING_WINDOW_DAYS} days.
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl bg-surface p-5">
                <div className="flex items-center justify-between">
                  <p className="text-base font-medium text-ink">Pick a slot</p>
                  {effectiveDate ? (
                    <span className="text-xs text-muted">{formatDateLong(effectiveDate)}</span>
                  ) : null}
                </div>

                {blocked ? (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
                    <CalendarOff className="h-4 w-4" />
                    The doctor is on leave on this date. Choose another day.
                  </div>
                ) : null}

                {!blocked && !rule ? (
                  <p className="mt-4 rounded-lg bg-muted-soft px-3 py-2 text-xs text-muted">
                    No availability is configured for this weekday.
                  </p>
                ) : null}

                {!blocked && rule ? (
                  bookedQuery.isLoading ? (
                    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {Array.from({ length: 10 }).map((_, index) => (
                        <Skeleton key={index} className="h-9 w-full" />
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="mt-4 rounded-lg bg-muted-soft px-3 py-2 text-xs text-muted">
                      No free slots left for this day. Try another date.
                    </p>
                  ) : (
                    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {slots.map((slot) => {
                        const selected = selectedSlot?.startTime === slot.startTime
                        return (
                          <button
                            key={slot.startTime}
                            type="button"
                            onClick={() => {
                              setSelectedSlot(slot)
                              setError('')
                            }}
                            className={cn(
                              'rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                              selected
                                ? 'border-accent bg-accent text-white'
                                : 'border-line bg-surface text-ink hover:border-accent',
                            )}
                          >
                            {slot.label}
                          </button>
                        )
                      })}
                    </div>
                  )
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-surface p-5">
                <p className="text-base font-medium text-ink">Confirm your visit</p>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Doctor</span>
                    <span className="font-medium text-ink">{name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Date</span>
                    <span className="font-medium text-ink">
                      {effectiveDate ? formatDateShort(effectiveDate) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Time</span>
                    <span className="font-medium text-ink">
                      {selectedSlot
                        ? formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)
                        : 'Pick a slot'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-line pt-3">
                    <span className="text-muted">Consultation fee</span>
                    <span className="font-medium text-ink">{formatInr(doctor.fees)}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="reason" className="text-xs font-medium text-ink">
                    Why are you visiting?
                  </label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Briefly describe your symptoms or reason for the visit."
                    className="mt-1.5"
                    maxLength={300}
                  />
                  <p className="mt-1 text-right text-[10px] text-muted">{reason.length}/300</p>
                </div>

                {error ? (
                  <p className="mt-2 rounded-lg bg-error-soft px-3 py-2 text-xs text-error">
                    {error}
                  </p>
                ) : null}

                <Button
                  className="mt-4 w-full"
                  variant="secondary"
                  onClick={handleBook}
                  disabled={!selectedSlot || bookAppointment.isPending}
                >
                  {bookAppointment.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {bookAppointment.isPending ? 'Booking…' : 'Request appointment'}
                </Button>

                <p className="mt-3 text-center text-[11px] text-muted">
                  The doctor will confirm your request. You will get an email when they do.
                </p>
              </div>

              <div className="rounded-2xl bg-muted-soft p-4">
                <div className="flex items-start gap-2">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                  <p className="text-xs leading-relaxed text-muted">
                    Slots are held only after you confirm. If someone books first, you will be
                    asked to pick another time.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-ink p-5 text-white">
                <Stethoscope className="h-5 w-5 text-white/70" />
                <p className="mt-3 text-sm font-medium">What happens next?</p>
                <ol className="mt-2 space-y-1.5 text-xs text-white/60">
                  <li>1. The doctor confirms or rejects the request.</li>
                  <li>2. You get a confirmation email.</li>
                  <li>3. A reminder arrives 24 hours before.</li>
                </ol>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
