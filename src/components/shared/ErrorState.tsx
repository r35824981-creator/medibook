import { AlertCircle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-surface px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-error-soft text-error">
        <AlertCircle className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-medium text-ink">Could not load this section</p>
      <p className="mt-1 max-w-sm text-xs text-muted">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RotateCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      ) : null}
    </div>
  )
}
