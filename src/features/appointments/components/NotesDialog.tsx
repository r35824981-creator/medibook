import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateAppointment } from '@/features/appointments/hooks'
import { getErrorMessage } from '@/lib/errors'
import type { AppointmentWithRelations } from '@/types'

export function NotesDialog({
  appointment,
  open,
  onOpenChange,
}: {
  appointment: AppointmentWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateAppointment = useUpdateAppointment()
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && appointment) {
      setNotes(appointment.doctor_notes ?? '')
      setError('')
    }
  }, [open, appointment])

  async function handleSave() {
    if (!appointment) return

    if (notes.trim().length < 2) {
      setError('Add a short note for the patient')
      return
    }

    setError('')
    try {
      await updateAppointment.mutateAsync({
        id: appointment.id,
        patch: { doctor_notes: notes.trim() },
      })
      toast.success('Consultation notes saved')
      onOpenChange(false)
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Consultation notes</DialogTitle>
          <DialogDescription>
            {appointment?.patient?.full_name ?? 'Patient'} · visible to the patient after the
            visit.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-2">
          <label htmlFor="doctor-notes" className="text-xs font-medium text-ink">
            Notes
          </label>
          <Textarea
            id="doctor-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Diagnosis summary, follow-up advice or medication guidance."
            maxLength={500}
            className="min-h-32"
          />
          <p className="text-right text-[10px] text-muted">{notes.length}/500</p>
          {error ? (
            <p className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">{error}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateAppointment.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateAppointment.isPending}>
            {updateAppointment.isPending ? 'Saving…' : 'Save notes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
