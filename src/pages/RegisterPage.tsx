import { Navigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import { homePathForRole } from '@/features/auth/roles'
import { useAuth } from '@/features/auth/AuthProvider'

export function RegisterPage() {
  const { session, profile } = useAuth()

  if (session && profile) {
    return <Navigate to={homePathForRole(profile.role)} replace />
  }

  return (
    <AuthLayout width="max-w-lg">
      <div className="space-y-1">
        <h1 className="text-2xl font-medium text-ink">Create your account</h1>
        <p className="text-xs text-muted">
          Patients can register here. Doctor accounts are created by the hospital administrator.
        </p>
      </div>

      <div className="mt-6">
        <RegisterForm />
      </div>
    </AuthLayout>
  )
}
