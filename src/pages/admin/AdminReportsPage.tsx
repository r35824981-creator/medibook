import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, Clock3, TrendingDown, Users } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared/PageHeader'
import { MetricCard } from '@/components/shared/MetricCard'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useReportData } from '@/features/reports/hooks'
import { getErrorMessage } from '@/lib/errors'
import { cn, pluralize } from '@/lib/utils'
import type { AppointmentStatus } from '@/types'

const ranges = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
]

const statusColors: Record<AppointmentStatus, string> = {
  pending: 'var(--state-warning)',
  confirmed: 'var(--accent-primary)',
  completed: 'var(--state-success)',
  cancelled: 'var(--text-muted)',
  rejected: 'var(--state-critical)',
}

const statusBarColors: Record<AppointmentStatus, string> = {
  pending: 'bg-warning',
  confirmed: 'bg-accent',
  completed: 'bg-success',
  cancelled: 'bg-line',
  rejected: 'bg-critical',
}

export function AdminReportsPage() {
  const [rangeDays, setRangeDays] = useState(7)
  const { report, isLoading, isError, error, refetch } = useReportData(rangeDays)

  const dayData = report.perDay.map((day) => ({
    day: day.label,
    total: day.total,
    completed: day.completed,
  }))

  const hourData = report.perHour.filter((hour) => hour.total > 0)
  const maxDepartment = Math.max(...report.perDepartment.map((item) => item.total), 1)
  const statusTotal = report.statusCounts.reduce((total, item) => total + item.count, 0)

  const pieData = report.statusCounts
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: item.label,
      value: item.count,
      status: item.status,
    }))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        subtitle="Appointments per day, doctor, department and hour, with the cancellation rate."
        actions={
          <Tabs value={String(rangeDays)} onValueChange={(value) => setRangeDays(Number(value))}>
            <TabsList>
              {ranges.map((range) => (
                <TabsTrigger key={range.value} value={String(range.value)}>
                  {range.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      {isLoading ? <LoadingState rows={4} /> : null}

      {isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : null}

      {!isLoading && !isError ? (
        <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Appointments"
          value={report.total}
          icon={BarChart3}
          tone="accent"
          hint={ranges.find((range) => range.value === rangeDays)?.label}
          sparkline={report.perDay.map((day) => day.total)}
        />
        <MetricCard
          label="Completed"
          value={report.completed}
          icon={Users}
          tone="success"
          hint={`${report.total === 0 ? 0 : Math.round((report.completed / report.total) * 100)}% of all visits`}
        />
        <MetricCard
          label="Cancellation rate"
          value={`${report.cancellationRate}%`}
          icon={TrendingDown}
          tone="critical"
          hint={`${report.cancelled} cancelled or rejected`}
        />
        <MetricCard
          label="Busiest hour"
          value={report.busiestHour}
          icon={Clock3}
          tone="warning"
          hint="Most requested start time"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl bg-surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-medium text-ink">Appointments per day</p>
              <p className="mt-0.5 text-xs text-muted">Booked vs completed</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-chart-1" />
                Booked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-chart-2" />
                Completed
              </span>
            </div>
          </div>

          <div className="mt-5 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayData} barGap={4}>
                <CartesianGrid vertical={false} stroke="var(--border-default)" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                />
                <Tooltip
                  cursor={{ fill: 'var(--bg-base)' }}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid var(--border-default)',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="total" name="Booked" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                <Bar
                  dataKey="completed"
                  name="Completed"
                  fill="var(--chart-2)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-5">
          <p className="text-base font-medium text-ink">Status breakdown</p>
          <p className="mt-0.5 text-xs text-muted">{statusTotal} appointments in range</p>

          <div className="mt-2 h-44 w-full">
            {pieData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted">
                No appointments in this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    stroke="var(--bg-surface)"
                    strokeWidth={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.status} fill={statusColors[entry.status]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid var(--border-default)',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-3 space-y-2">
            {report.statusCounts.map((item) => (
              <div key={item.status} className="flex items-center gap-2 text-xs">
                <span className={cn('h-2 w-2 rounded-full', statusBarColors[item.status])} />
                <span className="text-muted">{item.label}</span>
                <span className="ml-auto font-medium text-ink">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-surface p-5">
          <p className="text-base font-medium text-ink">Appointments per doctor</p>
          <p className="mt-0.5 text-xs text-muted">Top doctors by volume</p>

          <div className="mt-5 h-64 w-full">
            {report.perDoctor.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted">
                No appointments in this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={report.perDoctor}
                  layout="vertical"
                  margin={{ left: 8, right: 16 }}
                >
                  <CartesianGrid horizontal={false} stroke="var(--border-default)" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--bg-base)' }}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid var(--border-default)',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="total" name="Appointments" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-5">
          <p className="text-base font-medium text-ink">Busiest hours</p>
          <p className="mt-0.5 text-xs text-muted">Start times with at least one appointment</p>

          <div className="mt-5 h-64 w-full">
            {hourData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted">
                No appointments in this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourData}>
                  <CartesianGrid vertical={false} stroke="var(--border-default)" />
                  <XAxis
                    dataKey="hour"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    width={24}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--bg-base)' }}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid var(--border-default)',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="total" name="Appointments" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-2xl bg-surface p-5">
          <p className="text-base font-medium text-ink">By department</p>
          <p className="mt-0.5 text-xs text-muted">Share of appointments</p>

          <div className="mt-5 space-y-4">
            {report.perDepartment.length === 0 ? (
              <p className="rounded-xl bg-muted-soft px-3 py-6 text-center text-xs text-muted">
                No appointments in this range.
              </p>
            ) : (
              report.perDepartment.map((item) => {
                const percentage = Math.round((item.total / Math.max(report.total, 1)) * 100)
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink">{item.name}</span>
                      <span className="text-muted">
                        {item.total} {pluralize(item.total, 'visit')}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted-soft">
                      <div
                        className="h-full rounded-full bg-chart-1"
                        style={{ width: `${Math.max((item.total / maxDepartment) * 100, 6)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-muted">{percentage}% of all visits</p>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-medium text-ink">Doctor performance</p>
              <p className="mt-0.5 text-xs text-muted">Completion and cancellation by doctor</p>
            </div>
            <span className="text-xs text-muted">{report.perDoctor.length} doctors</span>
          </div>

          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Cancelled</TableHead>
                  <TableHead className="text-right">Completion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.perDoctor.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-xs text-muted">
                      No appointments in this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.perDoctor.map((doctor) => (
                    <TableRow key={doctor.name}>
                      <TableCell className="font-medium">{doctor.name}</TableCell>
                      <TableCell className="text-right">{doctor.total}</TableCell>
                      <TableCell className="text-right text-success">{doctor.completed}</TableCell>
                      <TableCell className="text-right text-muted">{doctor.cancelled}</TableCell>
                      <TableCell className="text-right">
                        {doctor.total === 0
                          ? '—'
                          : `${Math.round((doctor.completed / doctor.total) * 100)}%`}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
        </>
      ) : null}
    </div>
  )
}
