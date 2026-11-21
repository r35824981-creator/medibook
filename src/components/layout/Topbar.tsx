import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, ChevronDown, LogOut, Menu, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { navByRole, primaryActionByRole } from '@/components/layout/nav'
import { useAppointments } from '@/features/appointments/hooks'
import { roleLabels } from '@/features/auth/roles'
import { useAuth } from '@/features/auth/AuthProvider'
import { todayKey } from '@/lib/date'
import { initials } from '@/lib/utils'

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { profile, role, signOut, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const appointmentsQuery = useAppointments()

  if (!role) return null

  const today = todayKey()
  const pendingCount = (appointmentsQuery.data ?? []).filter(
    (appointment) => appointment.status === 'pending' && appointment.appointment_date >= today,
  ).length
  const appointmentsPath =
    role === 'patient'
      ? '/patient/appointments'
      : role === 'doctor'
        ? '/doctor/appointments'
        : '/admin/appointments'
  const isHome = location.pathname === `/${role}`

  const current =
    navByRole[role].find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
    ) ?? navByRole[role][0]

  const action = primaryActionByRole[role]

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex flex-col gap-3 border-b border-line bg-base px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={onOpenMenu}
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
        {!isHome ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="animate-fade-in"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : null}
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span>MediBook</span>
          <span>/</span>
          <span className="font-medium text-ink">{current.label}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link to={action.to}>{action.label}</Link>
        </Button>

        <Button
          variant="outline"
          size="icon-sm"
          className="relative"
          aria-label={
            pendingCount > 0 ? `${pendingCount} pending appointments` : 'No pending appointments'
          }
          onClick={() => navigate(appointmentsPath)}
        >
          <Bell className="h-4 w-4" />
          {pendingCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-medium leading-none text-white">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          ) : null}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-muted-soft"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials(profile?.full_name ?? '')}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="max-w-[9rem] truncate text-xs font-medium text-ink">
                  {profile?.full_name}
                </p>
                <p className="text-[10px] text-muted">{roleLabels[role]}</p>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block truncate text-xs font-medium text-ink">
                {profile?.full_name}
              </span>
              <span className="block truncate text-[11px] text-muted">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate(`${navByRole[role].at(-1)?.to ?? ''}`)}>
              <UserRound className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
