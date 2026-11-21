import { Link, Navigate } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck,
  Clock3,
  MailCheck,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { homePathForRole } from '@/features/auth/roles'
import { useAuth } from '@/features/auth/AuthProvider'

const departments = [
  'Cardiology',
  'Dermatology',
  'General Medicine',
  'Pediatrics',
  'Orthopedics',
  'Neurology',
]

const steps = [
  {
    title: 'Pick a doctor',
    description: 'Filter by department or search by specialization. Fees are shown up front.',
  },
  {
    title: 'Choose a free slot',
    description: "Slots come from the doctor's real schedule and disappear live when taken.",
  },
  {
    title: 'Get confirmed',
    description: 'The doctor confirms and you receive an email. No phone calls needed.',
  },
  {
    title: 'Arrive on time',
    description: 'A reminder lands 24 hours before the visit. Reschedule or cancel any time.',
  },
]

const features = [
  {
    icon: Search,
    title: 'Find the right doctor',
    description: 'Browse by department or specialization and see fees before you book.',
  },
  {
    icon: Clock3,
    title: 'Live slot availability',
    description: 'Free slots update in real time, so you never turn up for a taken appointment.',
  },
  {
    icon: MailCheck,
    title: 'Reminders that show up',
    description: 'A confirmation email and a reminder 24 hours before every confirmed visit.',
  },
]

export function LandingPage() {
  const { session, profile } = useAuth()

  if (session && profile) {
    return <Navigate to={homePathForRole(profile.role)} replace />
  }

  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-30 border-b border-line bg-page">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white">
              <Plus className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-medium leading-tight text-ink">MediBook</p>
              <p className="text-[11px] leading-tight text-muted">Hospital appointments</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <section className="grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              Built for small hospitals and clinics
            </span>

            <h1 className="mt-5 text-balance text-4xl font-medium leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]">
              Skip the queue.
              <br />
              Book your doctor in a minute.
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted">
              MediBook removes phone calls and waiting-room confusion. Patients book a real,
              available slot. Doctors manage their own schedule. Everyone gets a reminder before
              the visit.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/register">
                  Book an appointment
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-line pt-6">
              <div>
                <dt className="text-2xl font-medium text-ink">4</dt>
                <dd className="text-xs text-muted">steps to a booked slot</dd>
              </div>
              <div>
                <dt className="text-2xl font-medium text-ink">24h</dt>
                <dd className="text-xs text-muted">email reminder before</dd>
              </div>
              <div>
                <dt className="text-2xl font-medium text-ink">0</dt>
                <dd className="text-xs text-muted">double bookings allowed</dd>
              </div>
            </dl>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-base p-4 sm:p-6">
            <div aria-hidden className="absolute inset-0 bg-dots opacity-50" />
            <div className="relative rounded-2xl bg-surface p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Stethoscope className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">Dr. Arjun Mehta</p>
                    <p className="text-xs text-muted">Cardiology · ₹800</p>
                  </div>
                </div>
                <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success">
                  Available
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between text-xs text-muted">
                <span>Sat, 21 Nov</span>
                <span>30 min slots</span>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2">
                {['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'].map(
                  (slot, index) => (
                    <div
                      key={slot}
                      className={
                        index === 2
                          ? 'rounded-lg bg-accent px-2 py-2 text-center text-xs font-medium text-white'
                          : 'rounded-lg border border-line px-2 py-2 text-center text-xs text-ink'
                      }
                    >
                      {slot}
                    </div>
                  ),
                )}
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-xl bg-muted-soft px-3 py-2.5">
                <CalendarCheck className="h-4 w-4 text-success" />
                <p className="text-xs text-muted">
                  Slot locked the moment you confirm. No double booking, ever.
                </p>
              </div>
            </div>

            <div className="relative mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-surface p-4">
                <p className="text-xs text-muted">Pending approvals</p>
                <p className="mt-1 text-2xl font-medium text-ink">3</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-warning-soft">
                  <div className="h-full w-2/3 rounded-full bg-warning" />
                </div>
              </div>
              <div className="rounded-2xl bg-ink p-4 text-white">
                <p className="text-xs text-white/70">Today at the clinic</p>
                <p className="mt-1 text-2xl font-medium">18</p>
                <p className="mt-3 text-xs text-white/60">6 doctors on duty</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="rounded-2xl bg-surface p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-4 text-sm font-medium text-ink">{feature.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{feature.description}</p>
              </div>
            )
          })}
        </section>

        <section className="mt-4 rounded-2xl bg-surface p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Departments you can book</p>
              <p className="mt-1 text-xs text-muted">
                Every doctor is verified and added by the hospital administrator.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {departments.map((department) => (
                <span
                  key={department}
                  className="rounded-full bg-muted-soft px-3 py-1 text-xs text-muted"
                >
                  {department}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-3xl bg-base p-6 sm:p-8">
          <div className="max-w-xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
              How it works
            </p>
            <p className="mt-2 text-2xl font-medium tracking-tight text-ink">
              From search to reminder in four steps
            </p>
          </div>

          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-2xl bg-surface p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-medium text-white">
                  {index + 1}
                </span>
                <p className="mt-4 text-sm font-medium text-ink">{step.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="relative mt-4 overflow-hidden rounded-3xl bg-ink px-6 py-10 text-white sm:px-10 sm:py-12">
          <div aria-hidden className="absolute inset-0 bg-dots-light opacity-40" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="text-2xl font-medium tracking-tight sm:text-3xl">
                Ready to skip the queue?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Create a patient account in under a minute, or sign in to manage your clinic.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-ink hover:bg-white/90">
                <Link to="/register">
                  Create an account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="border border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>MediBook · Hospital and clinic appointment system</p>
          <p>Email reminders · Role-based access · Realtime slots</p>
        </div>
      </footer>
    </div>
  )
}
