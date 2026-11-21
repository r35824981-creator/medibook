import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { homePathForRole } from '@/features/auth/roles'
import { useAuth } from '@/features/auth/AuthProvider'
import type { Role } from '@/types'

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page">
      <div className="flex flex-col items-center gap-3">
        <span className="flex h-11 w-11 animate-pulse items-center justify-center rounded-xl bg-ink text-white">
          <Plus className="h-5 w-5" />
        </span>
        <p className="text-xs text-muted">Loading MediBook…</p>
      </div>
    </div>
  )
}

export function ProtectedRoute({ allow }: { allow?: Role[] }) {
  const { session, profile, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageLoader />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!profile) return <FullPageLoader />

  if (allow && !allow.includes(profile.role)) {
    return <Navigate to={homePathForRole(profile.role)} replace />
  }

  return <Outlet />
}
