import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/shared/Field'
import { useAuth } from '@/features/auth/AuthProvider'
import { homePathForRole } from '@/features/auth/roles'
import { loginSchema, type LoginInput } from '@/features/auth/schemas'
import { getErrorMessage } from '@/lib/errors'

export function LoginForm() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true)
    try {
      const profile = await signIn(values.email, values.password)
      toast.success(`Welcome back, ${profile.full_name.split(' ')[0]}`)
      navigate(homePathForRole(profile.role), { replace: true })
    } catch (error) {
      form.setError('root', { message: getErrorMessage(error) })
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...form.register('email')}
        />
      </Field>

      <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...form.register('password')}
        />
      </Field>

      {form.formState.errors.root?.message ? (
        <p className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">
          {form.formState.errors.root.message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        <LogIn className="h-4 w-4" />
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="text-center text-xs text-muted">
        New to MediBook?{' '}
        <Link to="/register" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  )
}
