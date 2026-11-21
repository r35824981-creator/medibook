import { useMemo, useState } from 'react'
import { CalendarOff, CalendarPlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { Field } from '@/components/shared/Field'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  useCreateTimeOff,
  useDeleteTimeOff,
  useTimeOff,
} from '@/features/availability/hooks'
import { useMyDoctor } from '@/features/doctors/hooks'
import { useAuth } from '@/features/auth/AuthProvider'
import { timeOffSchema } from '@/features/availability/schemas'
import { formatDateLong, todayKey } from '@/lib/date'
import { getErrorMessage } from '@/lib/errors'
import type { DoctorTimeOff } from '@/types'

export function DoctorTimeOffPage() {
  const { profile } = useAuth()
  const doctorQuery = useMyDoctor(profile?.id)
  const doctor = doctorQuery.data

  const timeOffQuery = useTimeOff(doctor?.id)
  const createTimeOff = useCreateTimeOff()
  const deleteTimeOff = useDeleteTimeOff()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<DoctorTimeOff | null>(null)

  const today = todayKey()
  const entries = timeOffQuery.data ?? []

  const { upcoming, past } = useMemo(() => {
    return {
      upcoming: entries
        .filter((entry) => entry.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date)),
      past: entries
        .filter((entry) => entry.date < today)
        .sort((a, b) => b.date.localeCompare(a.date)),
    }
  }, [entries, today])

  function resetForm() {
    setDate('')
    setReason('')
    setError('')
  }

  async function handleCreate() {
    if (!doctor) return

    const parsed = timeOffSchema.safeParse({ date, reason })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the form')
      return
    }

    if (parsed.data.date < today) {
      setError('Choose today or a future date')
      return
    }

    setError('')
    try {
      await createTimeOff.mutateAsync({
        doctorId: doctor.id,
        date: parsed.data.date,
        reason: parsed.data.reason ?? '',
      })
      toast.success('Time off added. Those slots are now hidden.')
      setDialogOpen(false)
      resetForm()
    } catch (submitError) {
      const code = (submitError as { code?: string } | null)?.code
      setError(
        code === '23505'
          ? 'That date is already blocked.'
          : getErrorMessage(submitError),
      )
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteTimeOff.mutateAsync(deleteTarget.id)
      toast.success('Time off removed')
      setDeleteTarget(null)
    } catch (submitError) {
      toast.error(getErrorMessage(submitError))
    }
  }

  if (doctorQuery.isLoading || timeOffQuery.isLoading) {
    return <LoadingState rows={3} />
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

  return (
    <div className="space-y-5">
      <PageHeader
        title="Time off"
        subtitle="Block leave or holidays. Booked slots on those dates are hidden from patients."
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              resetForm()
              setDialogOpen(true)
            }}
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Add time off
          </Button>
        }
      />

      {timeOffQuery.isError ? (
        <ErrorState
          message={getErrorMessage(timeOffQuery.error)}
          onRetry={() => void timeOffQuery.refetch()}
        />
      ) : null}

      <div className="space-y-3">
        <p className="text-sm font-medium text-ink">Upcoming</p>

        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarOff}
            title="No upcoming time off"
            description="Add a date when you will be away and patients will not see slots for it."
            actionLabel="Add time off"
            onAction={() => {
              resetForm()
              setDialogOpen(true)
            }}
          />
        ) : (
          upcoming.map((entry) => (
            <TimeOffRow
              key={entry.id}
              entry={entry}
              onDelete={() => setDeleteTarget(entry)}
            />
          ))
        )}
      </div>

      {past.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-ink">Past</p>
          {past.map((entry) => (
            <TimeOffRow
              key={entry.id}
              entry={entry}
              muted
              onDelete={() => setDeleteTarget(entry)}
            />
          ))}
        </div>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Block a date</DialogTitle>
            <DialogDescription>
              The whole day is blocked. Existing appointments are not cancelled automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <Field label="Date" htmlFor="time-off-date">
              <Input
                id="time-off-date"
                type="date"
                min={today}
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </Field>

            <Field
              label="Reason"
              htmlFor="time-off-reason"
              hint="Optional, shown only to you and the admin."
            >
              <Textarea
                id="time-off-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Conference, personal leave, public holiday…"
                maxLength={200}
              />
            </Field>

            {error ? (
              <p className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">{error}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={createTimeOff.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createTimeOff.isPending}>
              {createTimeOff.isPending ? 'Saving…' : 'Block date'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Remove this time off?"
        description="The day becomes bookable again if you have availability on that weekday."
        confirmLabel="Remove"
        cancelLabel="Keep it"
        destructive
        isLoading={deleteTimeOff.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function TimeOffRow({
  entry,
  onDelete,
  muted = false,
}: {
  entry: DoctorTimeOff
  onDelete: () => void
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted-soft text-muted">
          <CalendarOff className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className={muted ? 'truncate text-sm text-muted' : 'truncate text-sm font-medium text-ink'}>
            {formatDateLong(entry.date)}
          </p>
          <p className="truncate text-xs text-muted">{entry.reason || 'No reason added'}</p>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-muted hover:bg-error-soft hover:text-error"
        onClick={onDelete}
        aria-label={`Remove time off on ${entry.date}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
