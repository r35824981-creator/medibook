import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Field } from '@/components/shared/Field'
import {
  useCreateDoctor,
  useDeleteDoctor,
  usePromoteToDoctor,
} from '@/features/doctors/hooks'
import { getErrorMessage } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { Department, Profile } from '@/types'

const baseSchema = z.object({
  departmentId: z.string().uuid('Choose a department'),
  specialization: z.string().trim().min(2, 'Enter a specialization'),
  fees: z.coerce.number().min(0, 'Fees cannot be negative').max(100000, 'Fees look too high'),
  bio: z.string().trim().max(600, 'Keep the bio under 600 characters').optional(),
})

const newAccountSchema = baseSchema.extend({
  fullName: z.string().trim().min(2, 'Enter the doctor name'),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
})

type Mode = 'existing' | 'new'

export function AddDoctorDialog({
  open,
  onOpenChange,
  departments,
  patients,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  departments: Department[]
  patients: Pick<Profile, 'id' | 'full_name' | 'phone' | 'role'>[]
}) {
  const createDoctor = useCreateDoctor()
  const promote = usePromoteToDoctor()
  const deleteDoctor = useDeleteDoctor()
  const queryClient = useQueryClient()

  const [mode, setMode] = useState<Mode>('existing')
  const [profileId, setProfileId] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [fees, setFees] = useState('500')
  const [bio, setBio] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setMode('existing')
      setProfileId('')
      setFullName('')
      setEmail('')
      setPassword('')
      setDepartmentId('')
      setSpecialization('')
      setFees('500')
      setBio('')
      setError('')
      setIsSubmitting(false)
    }
  }, [open])

  async function handleSubmit() {
    setError('')

    if (mode === 'existing') {
      const parsed = baseSchema.safeParse({ departmentId, specialization, fees, bio })
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Check the form')
        return
      }
      if (!profileId) {
        setError('Choose the user account to promote to a doctor')
        return
      }

      setIsSubmitting(true)
      try {
        const created = await createDoctor.mutateAsync({
          profileId,
          departmentId: parsed.data.departmentId,
          specialization: parsed.data.specialization,
          fees: parsed.data.fees,
          bio: parsed.data.bio ?? '',
        })

        try {
          await promote.mutateAsync(profileId)
        } catch (promoteError) {
          await deleteDoctor.mutateAsync(created.id)
          throw promoteError
        }

        toast.success('Doctor added to the directory')
        onOpenChange(false)
      } catch (submitError) {
        setError(getErrorMessage(submitError))
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    const parsed = newAccountSchema.safeParse({
      fullName,
      email,
      password,
      departmentId,
      specialization,
      fees,
      bio,
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the form')
      return
    }

    setIsSubmitting(true)
    try {
      const { error: invokeError } = await supabase.functions.invoke('admin-create-doctor', {
        body: {
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          password: parsed.data.password,
          departmentId: parsed.data.departmentId,
          specialization: parsed.data.specialization,
          fees: parsed.data.fees,
          bio: parsed.data.bio ?? '',
        },
      })

      if (invokeError) {
        throw new Error(
          'Creating a new doctor account needs the admin-create-doctor Edge Function. Deploy it, or register the doctor and add them as an existing user.',
        )
      }

      await queryClient.invalidateQueries({ queryKey: ['doctors'] })
      await queryClient.invalidateQueries({ queryKey: ['profiles'] })
      toast.success('Doctor account created')
      onOpenChange(false)
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add a doctor</DialogTitle>
          <DialogDescription>
            Promote an existing account or create a new doctor login.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
            <TabsList className="w-full">
              <TabsTrigger value="existing" className="flex-1">
                Existing user
              </TabsTrigger>
              <TabsTrigger value="new" className="flex-1">
                New account
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-4 space-y-4">
          {mode === 'existing' ? (
            <Field label="User account" htmlFor="doctor-user">
              <Select value={profileId} onValueChange={setProfileId}>
                <SelectTrigger id="doctor-user">
                  <SelectValue placeholder="Choose a registered patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.full_name} · {patient.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {patients.length === 0 ? (
                <p className="text-xs text-muted">
                  No patient accounts to promote yet. Ask the doctor to register first.
                </p>
              ) : null}
            </Field>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="doctor-name">
                <Input
                  id="doctor-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Dr. Anil Kapoor"
                />
              </Field>
              <Field label="Email" htmlFor="doctor-email">
                <Input
                  id="doctor-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="doctor@hospital.com"
                />
              </Field>
              <Field
                label="Temporary password"
                htmlFor="doctor-password"
                hint="The doctor can change it after signing in."
                className="sm:col-span-2"
              >
                <Input
                  id="doctor-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                />
              </Field>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Department" htmlFor="doctor-department">
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger id="doctor-department">
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

            <Field label="Consultation fee (₹)" htmlFor="doctor-fees">
              <Input
                id="doctor-fees"
                inputMode="numeric"
                value={fees}
                onChange={(event) => setFees(event.target.value)}
              />
            </Field>
          </div>

          <Field label="Specialization" htmlFor="doctor-specialization">
            <Input
              id="doctor-specialization"
              value={specialization}
              onChange={(event) => setSpecialization(event.target.value)}
              placeholder="Interventional Cardiologist"
            />
          </Field>

          <Field label="Short bio" htmlFor="doctor-bio">
            <Textarea
              id="doctor-bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Experience, focus areas and approach to care."
            />
          </Field>

          {error ? (
            <p className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">{error}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Adding…' : 'Add doctor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
