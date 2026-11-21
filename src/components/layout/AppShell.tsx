import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (!mobileOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileOpen(false)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileOpen])

  return (
    <div className="min-h-screen bg-page md:p-4">
      <div className="flex min-h-screen overflow-hidden bg-base md:min-h-[calc(100vh-2rem)] md:rounded-3xl">
        <Sidebar className="hidden lg:flex" />

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 z-50 animate-slide-in-left">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onOpenMenu={() => setMobileOpen(true)} />
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div key={location.pathname} className="animate-page-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
