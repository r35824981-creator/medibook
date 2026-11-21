import { cn } from '@/lib/utils'

export function Field({
  label,
  error,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string
  error?: string
  hint?: string
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs text-error">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  )
}
