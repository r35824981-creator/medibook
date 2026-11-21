import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field } from '@/components/shared/Field'
import { useUpdateDoctor } from '@/features/doctors/hooks'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type { Department, DoctorListItem } from '@/types'

const schema = z.object({
  departmentId: z.string().uuid('Choose a department'),
  specialization: z.string().trim().min(2, 'Enter a specialization'),
  fees: z.coerce.number().min(0, 'Fees cannot be negative').max(100000, 'Fees look too high'),
  bio: z.string().trim().max(600, 'Keep the bio under 600 characters').optional(),
})

export function EditDoctorDialog({
  doctor,
  departments,
  open,
  onOpenChange,
}: {
  doctor: DoctorListItem | null
  departments: Department[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateDoctor = useUpdateDoctor()
  const [departmentId, setDepartmentId] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [fees, setFees] = useState('0')
  const [bio, setBio] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (doctor) {
      setDepartmentId(doctor.department_id ?? '')
      setSpecialization(doctor.specialization)
      setFees(String(doctor.fees))
      setBio(doctor.bio)
      setIsActive(doctor.is_active)
      setError('')
    }
  }, [doctor])

  async function handleSubmit() {
    if (!doctor) return
    setError('')

    const parsed = schema.safeParse({ departmentId, specialization, fees, bio })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the form')
      return
    }

    try {
      await updateDoctor.mutateAsync({
        id: doctor.id,
        patch: {
          department_id: parsed.data.departmentId,
          specialization: parsed.data.specialization,
          fees: parsed.data.fees,
          bio: parsed.data.bio ?? '',
          is_active: isActive,
        },
      })
      toast.success('Doctor updated')
      onOpenChange(false)
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit doctor</DialogTitle>
          <DialogDescription>
            {doctor?.profile?.full_name ?? 'Doctor'} · update the public profile.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Department" htmlFor="edit-department">
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger id="edit-department">
                  <SelectValue placeholder="Choose a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Consultation fee (₹)" htmlFor="edit-fees">
              <Input
                id="edit-fees"
                inputMode="numeric"
                value={fees}
                onChange={(event) => setFees(event.target.value)}
              />
            </Field>
          </div>

          <Field label="Specialization" htmlFor="edit-specialization">
            <Input
              id="edit-specialization"
              value={specialization}
              onChange={(event) => setSpecialization(event.target.value)}
            />
          </Field>

          <Field label="Short bio" htmlFor="edit-bio">
            <Textarea
              id="edit-bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
            />
          </Field>

          <div className="flex items-center justify-between rounded-xl bg-muted-soft px-4 py-3">
            <div>
              <p className="text-xs font-medium text-ink">Accepting appointments</p>
              <p className="text-[11px] text-muted">
                Inactive doctors stay in reports but cannot be booked.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive((value) => !value)}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                isActive ? 'bg-accent' : 'bg-line',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                  isActive ? 'translate-x-[22px]' : 'translate-x-0.5',
                )}
              />
            </button>
          </div>

          {error ? (
            <p className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">{error}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateDoctor.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateDoctor.isPending}>
            {updateDoctor.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
