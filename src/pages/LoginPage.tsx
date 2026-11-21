import { Link, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { homePathForRole } from '@/features/auth/roles'
import { useAuth } from '@/features/auth/AuthProvider'

const demoAccounts = [
  { label: 'Admin', email: 'admin@medibook.app' },
  { label: 'Doctor', email: 'dr.arjun@medibook.app' },
  { label: 'Patient', email: 'patient@medibook.app' },
]

export function LoginPage() {
  const { session, profile } = useAuth()

  if (session && profile) {
    return <Navigate to={homePathForRole(profile.role)} replace />
  }

  return (
    <AuthLayout>
      <div className="space-y-1">
        <h1 className="text-2xl font-medium text-ink">Welcome back</h1>
        <p className="text-xs text-muted">Sign in to manage your appointments.</p>
      </div>

      <div className="mt-6">
        <LoginForm />
      </div>

      {import.meta.env.DEV ? (
        <div className="mt-6 rounded-xl bg-muted-soft p-3">
          <p className="text-[11px] font-medium text-ink">Demo accounts</p>
          <div className="mt-2 space-y-1">
            {demoAccounts.map((account) => (
              <div key={account.email} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-muted">{account.label}</span>
                <span className="font-mono text-ink">{account.email}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Password for all demo accounts: <span className="font-mono text-ink">MediBook@123</span>
          </p>
        </div>
      ) : null}

      <p className="mt-6 text-center text-[11px] text-muted">
        By signing in you agree to the clinic&apos;s appointment policy.{' '}
        <Link to="/" className="text-accent hover:underline">
          Read more
        </Link>
      </p>
    </AuthLayout>
  )
}
