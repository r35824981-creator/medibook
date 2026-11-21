import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Stethoscope,
  Users,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { MetricCard } from '@/components/shared/MetricCard'
import { AlertCard } from '@/components/shared/AlertCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import {
  useAppointmentRealtime,
  useAppointments,
  useUpdateAppointment,
} from '@/features/appointments/hooks'
import { useDoctors } from '@/features/doctors/hooks'
import { useDepartments } from '@/features/departments/hooks'
import { buildReport } from '@/features/reports/aggregate'
import { formatDateLong, formatDateShort, formatTime, todayKey } from '@/lib/date'
import { getErrorMessage } from '@/lib/errors'
import { cn, formatInr } from '@/lib/utils'
import type { AppointmentStatus } from '@/types'

const statusBarColors: Record<AppointmentStatus, string> = {
  pending: 'bg-warning',
  confirmed: 'bg-accent',
  completed: 'bg-success',
  cancelled: 'bg-line',
  rejected: 'bg-critical',
}

export function AdminHomePage() {
  const appointmentsQuery = useAppointments()
  const doctorsQuery = useDoctors({ includeInactive: true })
  const departmentsQuery = useDepartments()
  const updateAppointment = useUpdateAppointment()
  useAppointmentRealtime()

  const appointments = appointmentsQuery.data ?? []
  const report = useMemo(() => buildReport(appointments, 7), [appointments])
  const today = todayKey()

  const todayAppointments = appointments
    .filter((appointment) => appointment.appointment_date === today)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  const pending = appointments
    .filter(
      (appointment) => appointment.status === 'pending' && appointment.appointment_date >= today,
    )
    .sort(
      (a, b) =>
        a.appointment_date.localeCompare(b.appointment_date) ||
        a.start_time.localeCompare(b.start_time),
    )

  const activeDoctors = (doctorsQuery.data ?? []).filter((doctor) => doctor.is_active).length
  const revenueToday = todayAppointments
    .filter((appointment) => appointment.status !== 'cancelled' && appointment.status !== 'rejected')
    .reduce((total, appointment) => total + (appointment.doctor?.fees ?? 0), 0)

  async function confirmAppointment(id: string) {
    try {
      await updateAppointment.mutateAsync({ id, patch: { status: 'confirmed' } })
      toast.success('Appointment confirmed')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const chartData = report.perDay.map((day) => ({
    day: day.label,
    total: day.total,
    completed: day.completed,
  }))

  const statusTotal = report.statusCounts.reduce((total, item) => total + item.count, 0)

  const isLoading =
    appointmentsQuery.isLoading || doctorsQuery.isLoading || departmentsQuery.isLoading

  return (
    <div className="space-y-5">
      <PageHeader
        title="Hospital overview"
        subtitle={`${formatDateLong(new Date())}${
          departmentsQuery.data ? ` · ${departmentsQuery.data.length} departments` : ''
        }`}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/reports">
              <BarChart3 className="h-3.5 w-3.5" />
              Open reports
            </Link>
          </Button>
        }
      />

      {isLoading ? <LoadingState rows={6} /> : null}

      {appointmentsQuery.isError ? (
        <ErrorState
          message={getErrorMessage(appointmentsQuery.error)}
          onRetry={() => void appointmentsQuery.refetch()}
        />
      ) : null}

      {!isLoading && !appointmentsQuery.isError ? (
        <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Appointments today"
          value={todayAppointments.length}
          icon={CalendarDays}
          tone="accent"
          hint={`${todayAppointments.filter((a) => a.status === 'confirmed').length} confirmed`}
          sparkline={report.perDay.map((day) => day.total)}
        />
        <MetricCard
          label="Pending approvals"
          value={pending.length}
          icon={Clock3}
          tone="warning"
          hint="Waiting for a doctor or admin"
        />
        <MetricCard
          label="Active doctors"
          value={activeDoctors}
          icon={Stethoscope}
          tone="success"
          hint={`${(doctorsQuery.data?.length ?? 0) - activeDoctors} inactive`}
        />
        <MetricCard
          label="Cancellation rate"
          value={`${report.cancellationRate}%`}
          icon={XCircle}
          tone="critical"
          hint="Last 7 days"
        />
      </div>

      {pending.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {pending.slice(0, 2).map((appointment) => (
            <AlertCard
              key={appointment.id}
              level="high"
              icon={Clock3}
              title={`${appointment.patient?.full_name ?? 'Patient'} · ${
                appointment.doctor?.profile?.full_name ?? 'Doctor'
              }`}
              subtitle={`${formatDateShort(appointment.appointment_date)} · ${formatTime(
                appointment.start_time,
              )}`}
              detail={appointment.reason}
              meta={formatInr(appointment.doctor?.fees ?? 0)}
              action={
                <Button
                  size="sm"
                  className="bg-white/20 text-white hover:bg-white/30"
                  onClick={() => void confirmAppointment(appointment.id)}
                  disabled={updateAppointment.isPending}
                >
                  Confirm
                </Button>
              }
            />
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl bg-surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-medium text-ink">Appointments this week</p>
              <p className="mt-0.5 text-xs text-muted">Booked vs completed, last 7 days</p>
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

          <div className="mt-5 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid vertical={false} stroke="var(--border-default)" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
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

        <div className="space-y-4">
          <div className="rounded-2xl bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-base font-medium text-ink">Status mix</p>
              <span className="text-xs text-muted">{statusTotal} appointments</span>
            </div>

            <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-muted-soft">
              {report.statusCounts.map((item) =>
                item.count > 0 ? (
                  <div
                    key={item.status}
                    className={statusBarColors[item.status]}
                    style={{ width: `${(item.count / Math.max(statusTotal, 1)) * 100}%` }}
                    title={`${item.label}: ${item.count}`}
                  />
                ) : null,
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {report.statusCounts.map((item) => (
                <div key={item.status} className="flex items-center gap-2 text-xs">
                  <span
                    className={cn('h-2 w-2 rounded-full', statusBarColors[item.status])}
                  />
                  <span className="text-muted">{item.label}</span>
                  <span className="ml-auto font-medium text-ink">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-base font-medium text-ink">Today&apos;s schedule</p>
              <span className="text-xs text-muted">
                {formatInr(revenueToday)} expected
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {todayAppointments.length === 0 ? (
                <p className="rounded-xl bg-muted-soft px-3 py-6 text-center text-xs text-muted">
                  No appointments booked for today.
                </p>
              ) : (
                todayAppointments.slice(0, 5).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-base px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-ink">
                        {appointment.patient?.full_name ?? 'Patient'}
                      </p>
                      <p className="truncate text-[11px] text-muted">
                        {formatTime(appointment.start_time)} ·{' '}
                        {appointment.doctor?.profile?.full_name ?? 'Doctor'}
                      </p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-surface p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Building2 className="h-4 w-4" />
          </span>
          <p className="mt-4 text-sm font-medium text-ink">Departments</p>
          <p className="mt-1 text-2xl font-medium text-ink">
            {departmentsQuery.data?.length ?? 0}
          </p>
          <Link
            to="/admin/departments"
            className="mt-3 inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            Manage departments
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-2xl bg-surface p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success-soft text-success">
            <Users className="h-4 w-4" />
          </span>
          <p className="mt-4 text-sm font-medium text-ink">Busiest hour</p>
          <p className="mt-1 text-2xl font-medium text-ink">{report.busiestHour}</p>
          <p className="mt-3 text-xs text-muted">Across the last 7 days</p>
        </div>

        <div className="rounded-2xl bg-ink p-5 text-white">
          <CheckCircle2 className="h-5 w-5 text-white/70" />
          <p className="mt-3 text-sm font-medium">Double booking is impossible</p>
          <p className="mt-1 text-xs leading-relaxed text-white/60">
            A partial unique index on the database rejects a second active appointment in the same
            slot, even when two patients click at the same moment.
          </p>
        </div>
      </div>

      {appointments.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No appointments yet"
          description="Once patients start booking, the hospital overview will fill with live data."
        />
      ) : null}
        </>
      ) : null}
    </div>
  )
}
