import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AuthLayout({
  children,
  width = 'max-w-md',
}: {
  children: React.ReactNode
  width?: string
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-page">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dots opacity-40" />

      <header className="relative flex items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white">
            <Plus className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-medium leading-tight text-ink">MediBook</p>
            <p className="text-[11px] leading-tight text-muted">Hospital appointments</p>
          </div>
        </Link>
        <Link to="/" className="text-xs text-muted transition-colors hover:text-ink">
          Back to home
        </Link>
      </header>

      <main className="relative flex flex-1 items-start justify-center px-4 pb-12 pt-4 sm:items-center">
        <div
          className={cn(
            'w-full animate-slide-up rounded-2xl bg-surface p-6 sm:p-8',
            width,
          )}
        >
          {children}
        </div>
      </main>
    </div>
  )
}
