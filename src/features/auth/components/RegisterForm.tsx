import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/shared/Field'
import { useAuth } from '@/features/auth/AuthProvider'
import { homePathForRole } from '@/features/auth/roles'
import { registerSchema, type RegisterInput } from '@/features/auth/schemas'
import { getErrorMessage } from '@/lib/errors'

export function RegisterForm() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true)
    try {
      const result = await signUp({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password,
      })

      if (result.needsConfirmation) {
        setNeedsConfirmation(true)
        return
      }

      toast.success('Account created. Welcome to MediBook.')
      navigate(homePathForRole('patient'), { replace: true })
    } catch (error) {
      form.setError('root', { message: getErrorMessage(error) })
    } finally {
      setIsSubmitting(false)
    }
  })

  if (needsConfirmation) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-success-soft text-success">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Check your inbox</p>
          <p className="mt-1 text-xs text-muted">
            We sent a confirmation link to your email. Confirm it, then sign in to book your first
            appointment.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link to="/login">Go to sign in</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Full name" htmlFor="fullName" error={form.formState.errors.fullName?.message}>
        <Input id="fullName" placeholder="Ananya Sharma" {...form.register('fullName')} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...form.register('email')}
          />
        </Field>

        <Field label="Phone" htmlFor="phone" error={form.formState.errors.phone?.message}>
          <Input id="phone" inputMode="numeric" placeholder="9876543210" {...form.register('phone')} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Password"
          htmlFor="password"
          error={form.formState.errors.password?.message}
          hint="At least 8 characters"
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            {...form.register('password')}
          />
        </Field>

        <Field
          label="Confirm password"
          htmlFor="confirmPassword"
          error={form.formState.errors.confirmPassword?.message}
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            {...form.register('confirmPassword')}
          />
        </Field>
      </div>

      {form.formState.errors.root?.message ? (
        <p className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">
          {form.formState.errors.root.message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        <UserPlus className="h-4 w-4" />
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-center text-xs text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
