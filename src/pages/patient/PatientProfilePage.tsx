import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Mail, ShieldCheck, UserRound } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/PageHeader'
import { Field } from '@/components/shared/Field'
import { useAuth } from '@/features/auth/AuthProvider'
import { roleLabels } from '@/features/auth/roles'
import { profileSchema, type ProfileInput } from '@/features/doctors/schemas'
import { useUpdateProfile } from '@/features/doctors/hooks'
import { getErrorMessage } from '@/lib/errors'
import { initials } from '@/lib/utils'

export function PatientProfilePage() {
  const { profile, user, refreshProfile } = useAuth()
  const updateProfile = useUpdateProfile()
  const [error, setError] = useState('')

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
    },
  })

  useEffect(() => {
    if (profile) {
      form.reset({ fullName: profile.full_name, phone: profile.phone })
    }
  }, [profile, form])

  const onSubmit = form.handleSubmit(async (values) => {
    if (!profile) return
    setError('')

    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        patch: { full_name: values.fullName, phone: values.phone },
      })
      await refreshProfile()
      toast.success('Profile updated')
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    }
  })

  if (!profile) return null

  return (
    <div className="space-y-5">
      <PageHeader
        title="Profile"
        subtitle="Keep your contact details up to date so the clinic can reach you."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-2xl bg-surface p-5">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 rounded-2xl">
              <AvatarFallback className="rounded-2xl text-base">
                {initials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-ink">{profile.full_name}</p>
              <Badge variant="accent" className="mt-1">
                {roleLabels[profile.role]}
              </Badge>
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
          </div>

          <div className="mt-5 rounded-xl bg-muted-soft p-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              <p className="text-[11px] leading-relaxed text-muted">
                Your account role is managed by the hospital. Contact the administrator if it
                needs to change.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-5">
          <p className="text-base font-medium text-ink">Contact details</p>
          <p className="mt-1 text-xs text-muted">
            These details appear on your appointments so the doctor can identify you.
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
            <Field
              label="Full name"
              htmlFor="profile-name"
              error={form.formState.errors.fullName?.message}
            >
              <Input id="profile-name" {...form.register('fullName')} />
            </Field>

            <Field
              label="Phone"
              htmlFor="profile-phone"
              error={form.formState.errors.phone?.message}
            >
              <Input id="profile-phone" inputMode="numeric" {...form.register('phone')} />
            </Field>

            <Field label="Email" htmlFor="profile-email" hint="Email changes are handled by support.">
              <Input id="profile-email" value={user?.email ?? ''} disabled readOnly />
            </Field>

            {error ? (
              <p className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">{error}</p>
            ) : null}

            <Button type="submit" variant="outline" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
