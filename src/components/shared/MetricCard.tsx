import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type MetricCardProps = {
  label: string
  value: string | number
  icon: LucideIcon
  hint?: string
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'critical'
  sparkline?: number[]
}

const toneClasses = {
  default: 'bg-muted-soft text-ink',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  critical: 'bg-critical-soft text-critical',
}

const barClasses = {
  default: 'bg-ink',
  accent: 'bg-chart-1',
  success: 'bg-chart-2',
  warning: 'bg-chart-3',
  critical: 'bg-chart-4',
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'default',
  sparkline,
}: MetricCardProps) {
  const max = sparkline && sparkline.length > 0 ? Math.max(...sparkline, 1) : 1

  return (
    <div className="rounded-2xl bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl',
              toneClasses[tone],
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-xs text-muted">{label}</span>
        </div>
        <span className="text-2xl font-medium leading-none text-ink">{value}</span>
      </div>

      {sparkline && sparkline.length > 0 ? (
        <div className="mt-4 flex h-8 items-end gap-1">
          {sparkline.map((point, index) => (
            <div
              key={index}
              className={cn('flex-1 rounded-sm', barClasses[tone])}
              style={{ height: `${Math.max(12, (point / max) * 100)}%`, opacity: 0.85 }}
            />
          ))}
        </div>
      ) : null}

      {hint ? <p className="mt-3 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}
