import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Plus, Search } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { navByRole } from '@/components/layout/nav'
import { roleLabels } from '@/features/auth/roles'
import { useAuth } from '@/features/auth/AuthProvider'
import { cn, initials } from '@/lib/utils'

export function Sidebar({
  onNavigate,
  className,
}: {
  onNavigate?: () => void
  className?: string
}) {
  const { profile, role, signOut } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return
      event.preventDefault()
      searchRef.current?.focus()
      searchRef.current?.select()
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const items = useMemo(() => {
    if (!role) return []
    const all = navByRole[role]
    if (!query.trim()) return all
    return all.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))
  }, [role, query])

  async function handleSignOut() {
    await signOut()
    onNavigate?.()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={cn('flex h-full w-60 shrink-0 flex-col bg-base px-4 py-6', className)}>
      <div className="flex items-center gap-2.5 px-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white">
          <Plus className="h-5 w-5" />
        </span>
        <div>
          <p className="text-base font-medium leading-tight text-ink">MediBook</p>
          <p className="text-[11px] leading-tight text-muted">Hospital appointments</p>
        </div>
      </div>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          ref={searchRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Escape') return
            setQuery('')
            event.currentTarget.blur()
          }}
          placeholder="Search"
          className="h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-12 text-xs text-ink transition-colors placeholder:text-muted hover:bg-base focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          aria-label="Search navigation"
          aria-keyshortcuts="Control+K Meta+K"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted">
          ⌘K
        </kbd>
      </div>

      <nav className="mt-5 flex-1 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150',
                  isActive
                    ? 'bg-nav-active text-nav-text'
                    : 'text-muted hover:bg-muted-soft hover:text-ink',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        })}

        {items.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted">No matching pages</p>
        ) : null}
      </nav>

      <div className="mt-4 border-t border-line pt-4">
        <div className="flex items-center gap-2.5 px-1">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initials(profile?.full_name ?? '')}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-ink">{profile?.full_name}</p>
            <p className="truncate text-[11px] text-muted">
              {role ? roleLabels[role] : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-3 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-muted-soft hover:text-ink"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  )
}
