import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 text-center">
        <p className="text-5xl font-medium text-ink">404</p>
        <p className="mt-3 text-sm font-medium text-ink">This page does not exist</p>
        <p className="mt-1 text-xs text-muted">
          The link may be broken, or the page may have moved.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Go to home</Link>
        </Button>
      </div>
    </div>
  )
}
