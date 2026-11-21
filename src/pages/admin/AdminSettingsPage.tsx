import {
  BellRing,
  CheckCircle2,
  Database,
  Globe2,
  KeyRound,
  Mail,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/PageHeader'
import { useAuth } from '@/features/auth/AuthProvider'
import { roleLabels } from '@/features/auth/roles'
import { useDepartments } from '@/features/departments/hooks'
import { useDoctors } from '@/features/doctors/hooks'
import { APPOINTMENT_TIMEZONE, BOOKING_WINDOW_DAYS } from '@/lib/date'

function supabaseHost(): string {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  if (!url) return 'Not configured'
  try {
    return new URL(url).host
  } catch {
    return 'Not configured'
  }
}

export function AdminSettingsPage() {
  const { profile, user } = useAuth()
  const doctorsQuery = useDoctors({ includeInactive: true })
  const departmentsQuery = useDepartments()

  const checklist = [
    {
      title: 'Email delivery (Resend)',
      description:
        'Booking, confirmation and cancellation emails are sent by the send-appointment-email Edge Function. Add RESEND_API_KEY as a function secret to enable them.',
      done: false,
      icon: Mail,
    },
    {
      title: '24 hour reminders',
      description:
        'The send-reminders Edge Function is idempotent through notifications_log. Schedule it hourly with pg_cron to send reminders.',
      done: false,
      icon: BellRing,
    },
    {
      title: 'Double booking prevention',
      description:
        'A partial unique index on (doctor_id, appointment_date, start_time) blocks a second active appointment in the same slot.',
      done: true,
      icon: ShieldCheck,
    },
    {
      title: 'Role protection',
      description:
        'A database trigger rejects any role change unless the caller is an administrator. The UI never sends a role field.',
      done: true,
      icon: KeyRound,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        subtitle="Hospital-wide configuration and the state of the notification pipeline."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          <div className="rounded-2xl bg-surface p-5">
            <p className="text-sm font-medium text-ink">Signed in as</p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Name</span>
                <span className="truncate font-medium text-ink">{profile?.full_name}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Email</span>
                <span className="truncate font-medium text-ink">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Role</span>
                <Badge variant="accent">{profile ? roleLabels[profile.role] : '—'}</Badge>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-surface p-5">
            <p className="text-sm font-medium text-ink">Hospital</p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Name</span>
                <span className="font-medium text-ink">MediBook</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Departments</span>
                <span className="font-medium text-ink">{departmentsQuery.data?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Doctors</span>
                <span className="font-medium text-ink">{doctorsQuery.data?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Timezone</span>
                <span className="font-medium text-ink">{APPOINTMENT_TIMEZONE}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Booking window</span>
                <span className="font-medium text-ink">{BOOKING_WINDOW_DAYS} days</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-ink p-5 text-white">
            <Globe2 className="h-5 w-5 text-white/70" />
            <p className="mt-3 text-sm font-medium">Appointment policy</p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">
              Patients can cancel pending or confirmed appointments. Doctors confirm, reject,
              complete or cancel their own appointments. Admins can override any status. Every
              action is authorised by Row Level Security, not by the interface.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Notification pipeline</p>
                <p className="mt-0.5 text-xs text-muted">
                  Email is the only channel in scope. SMS is a stretch goal.
                </p>
              </div>
              <Badge variant="warning">Needs setup</Badge>
            </div>

            <div className="mt-4 space-y-3">
              {checklist.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="flex items-start gap-3 rounded-xl bg-base p-3">
                    <span
                      className={
                        item.done
                          ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success'
                          : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-warning'
                      }
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-ink">{item.title}</p>
                        {item.done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <TriangleAlert className="h-3.5 w-3.5 text-warning" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                        {item.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Environment</p>
                <p className="mt-0.5 text-xs text-muted">
                  The frontend uses only the anon key. Service role and Resend keys live in Edge
                  Function secrets.
                </p>
              </div>
              <Badge variant="success">Protected</Badge>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted">
                  <Database className="h-3.5 w-3.5" />
                  Supabase project
                </span>
                <span className="truncate font-mono text-[11px] text-ink">{supabaseHost()}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Database schema</span>
                <span className="font-mono text-[11px] text-ink">medibook</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Frontend key</span>
                <span className="font-mono text-[11px] text-ink">anon (public)</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Realtime</span>
                <span className="font-medium text-ink">appointments table</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-muted-soft p-3">
              <p className="text-[11px] leading-relaxed text-muted">
                To finish the notification setup: deploy <code className="font-mono">supabase
                functions deploy send-appointment-email</code> and{' '}
                <code className="font-mono">send-reminders</code>, set{' '}
                <code className="font-mono">RESEND_API_KEY</code> and{' '}
                <code className="font-mono">REMINDER_FROM_EMAIL</code>, then schedule the reminder
                function hourly with pg_cron.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
