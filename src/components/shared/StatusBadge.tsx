import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { AppointmentStatus } from '@/types'

const statusConfig: Record<
  AppointmentStatus,
  { label: string; variant: BadgeProps['variant'] }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'accent' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'error' },
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
