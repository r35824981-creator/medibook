import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type AlertLevel = 'critical' | 'high' | 'medium'

type AlertCardProps = {
  level: AlertLevel
  icon: LucideIcon
  title: string
  subtitle: string
  detail?: string
  meta?: string
  action?: React.ReactNode
  className?: string
}

const levelClasses: Record<AlertLevel, string> = {
  critical: 'bg-critical',
  high: 'bg-warning',
  medium: 'bg-success',
}

export function AlertCard({
  level,
  icon: Icon,
  title,
  subtitle,
  detail,
  meta,
  action,
  className,
}: AlertCardProps) {
  return (
    <div className={cn('rounded-2xl p-5 text-white', levelClasses[level], className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="mt-0.5 text-xs text-white/80">{subtitle}</p>
          </div>
        </div>
        {action}
      </div>

      {detail ? <p className="mt-4 text-sm text-white/90">{detail}</p> : null}

      {meta ? <p className="mt-3 text-right text-xs text-white/70">{meta}</p> : null}
    </div>
  )
}
