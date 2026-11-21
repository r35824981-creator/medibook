import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl bg-surface px-6 py-14 text-center',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted-soft text-muted">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-muted">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-5" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
