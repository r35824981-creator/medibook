import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Camera, Mail, ShieldCheck, Stethoscope, UserRound } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/shared/PageHeader'
import { Field } from '@/components/shared/Field'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { useAuth } from '@/features/auth/AuthProvider'
import { roleLabels } from '@/features/auth/roles'
import {
  useMyDoctor,
  useUpdateDoctor,
  useUpdateProfile,
  useUploadDoctorPhoto,
} from '@/features/doctors/hooks'
import {
  doctorProfessionalSchema,
  profileSchema,
  type DoctorProfessionalInput,
  type ProfileInput,
} from '@/features/doctors/schemas'
import { getErrorMessage } from '@/lib/errors'
import { formatInr, initials } from '@/lib/utils'

export function DoctorProfilePage() {
  const { profile, user, refreshProfile } = useAuth()
  const doctorQuery = useMyDoctor(profile?.id)
  const updateProfile = useUpdateProfile()
  const updateDoctor = useUpdateDoctor()
  const uploadPhoto = useUploadDoctorPhoto()
  const fileInput = useRef<HTMLInputElement>(null)

  const [profileError, setProfileError] = useState('')
  const [doctorError, setDoctorError] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  const doctor = doctorQuery.data

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: profile?.full_name ?? '', phone: profile?.phone ?? '' },
  })

  const professionalForm = useForm<DoctorProfessionalInput>({
    resolver: zodResolver(doctorProfessionalSchema),
    defaultValues: { specialization: '', fees: 0, bio: '' },
  })

  useEffect(() => {
    if (profile) {
      profileForm.reset({ fullName: profile.full_name, phone: profile.phone })
    }
  }, [profile, profileForm])

  useEffect(() => {
    if (doctor) {
      professionalForm.reset({
        specialization: doctor.specialization,
        fees: doctor.fees,
        bio: doctor.bio,
      })
      setPhotoUrl(doctor.photo_url)
    }
  }, [doctor, professionalForm])

  const onSubmitProfile = profileForm.handleSubmit(async (values) => {
    if (!profile) return
    setProfileError('')
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        patch: { full_name: values.fullName, phone: values.phone },
      })
      await refreshProfile()
      toast.success('Contact details updated')
    } catch (submitError) {
      setProfileError(getErrorMessage(submitError))
    }
  })

  const onSubmitProfessional = professionalForm.handleSubmit(async (values) => {
    if (!doctor) return
    setDoctorError('')
    try {
      await updateDoctor.mutateAsync({
        id: doctor.id,
        patch: {
          specialization: values.specialization,
          fees: values.fees,
          bio: values.bio ?? '',
        },
      })
      toast.success('Professional profile updated')
    } catch (submitError) {
      setDoctorError(getErrorMessage(submitError))
    }
  })

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !doctor) return

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Choose an image under 3 MB')
      return
    }

    try {
      const url = await uploadPhoto.mutateAsync({ doctorId: doctor.id, file })
      await updateDoctor.mutateAsync({ id: doctor.id, patch: { photo_url: url } })
      setPhotoUrl(url)
      toast.success('Photo updated')
    } catch (submitError) {
      toast.error(getErrorMessage(submitError))
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  if (profile && doctorQuery.isLoading) {
    return <LoadingState rows={3} />
  }

  if (!profile) return null

  return (
    <div className="space-y-5">
      <PageHeader
        title="Profile"
        subtitle="Your account details and the professional profile patients see."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          <div className="rounded-2xl bg-surface p-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-16 w-16 rounded-2xl">
                  {photoUrl ? <AvatarImage src={photoUrl} alt={profile.full_name} /> : null}
                  <AvatarFallback className="rounded-2xl text-lg">
                    {initials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={!doctor || uploadPhoto.isPending}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface text-muted transition-colors hover:text-ink disabled:opacity-50"
                  aria-label="Change profile photo"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{profile.full_name}</p>
                <Badge variant="accent" className="mt-1">
                  {roleLabels[profile.role]}
                </Badge>
                <p className="mt-1 text-[11px] text-muted">
                  {uploadPhoto.isPending ? 'Uploading photo…' : 'Tap the camera to change photo'}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-line pt-4 text-xs">
              <div className="flex items-center gap-2 text-muted">
                <Mail className="h-3.5 w-3.5" />
                {user?.email}
              </div>
              <div className="flex items-center gap-2 text-muted">
                <UserRound className="h-3.5 w-3.5" />
                {profile.phone || 'No phone number yet'}
              </div>
              {doctor ? (
                <div className="flex items-center gap-2 text-muted">
                  <Stethoscope className="h-3.5 w-3.5" />
                  {doctor.department?.name ?? 'No department'} · {formatInr(doctor.fees)}
                </div>
              ) : null}
            </div>

            <div className="mt-5 rounded-xl bg-muted-soft p-3">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <p className="text-[11px] leading-relaxed text-muted">
                  Department, fees visibility and active status are managed by the hospital
                  administrator.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-surface p-5">
            <p className="text-sm font-medium text-ink">Contact details</p>
            <form onSubmit={onSubmitProfile} className="mt-4 space-y-4" noValidate>
              <Field
                label="Full name"
                htmlFor="doctor-name"
                error={profileForm.formState.errors.fullName?.message}
              >
                <Input id="doctor-name" {...profileForm.register('fullName')} />
              </Field>
              <Field
                label="Phone"
                htmlFor="doctor-phone"
                error={profileForm.formState.errors.phone?.message}
              >
                <Input id="doctor-phone" inputMode="numeric" {...profileForm.register('phone')} />
              </Field>

              {profileError ? (
                <p className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">
                  {profileError}
                </p>
              ) : null}

              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? 'Saving…' : 'Save contact details'}
              </Button>
            </form>
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-5">
          <p className="text-sm font-medium text-ink">Professional profile</p>
          <p className="mt-1 text-xs text-muted">
            This is what patients read before they book. Keep it short and specific.
          </p>

          {doctorQuery.isError ? (
            <div className="mt-4">
              <ErrorState
                message={getErrorMessage(doctorQuery.error)}
                onRetry={() => void doctorQuery.refetch()}
              />
            </div>
          ) : (
            <form onSubmit={onSubmitProfessional} className="mt-5 space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Specialization"
                  htmlFor="doctor-specialization"
                  error={professionalForm.formState.errors.specialization?.message}
                >
                  <Input
                    id="doctor-specialization"
                    placeholder="Interventional Cardiologist"
                    {...professionalForm.register('specialization')}
                  />
                </Field>

                <Field
                  label="Consultation fee (₹)"
                  htmlFor="doctor-fees"
                  error={professionalForm.formState.errors.fees?.message}
                >
                  <Input
                    id="doctor-fees"
                    inputMode="numeric"
                    {...professionalForm.register('fees')}
                  />
                </Field>
              </div>

              <Field
                label="Short bio"
                htmlFor="doctor-bio"
                error={professionalForm.formState.errors.bio?.message}
                hint="Patients see this on your doctor card."
              >
                <Textarea
                  id="doctor-bio"
                  className="min-h-32"
                  placeholder="Experience, focus areas and approach to care."
                  {...professionalForm.register('bio')}
                />
              </Field>

              {doctorError ? (
                <p className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">
                  {doctorError}
                </p>
              ) : null}

              <Button type="submit" variant="outline" disabled={updateDoctor.isPending || !doctor}>
                {updateDoctor.isPending ? 'Saving…' : 'Save professional profile'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
