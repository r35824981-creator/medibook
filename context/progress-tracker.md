# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Feature complete on the core product (plan items 1–13). Remaining: automated tests, project report and production deployment.

## Current Goal

- Prepare the deliverables around a finished app: automated tests for the pure logic, project report, and deployment.

## Completed

1. **Project setup**: Vite + React 18 + TypeScript, Tailwind, shadcn/ui components, React Router, TanStack Query, Supabase client, env configuration.
2. **Database foundation**: `medibook` schema with `profiles` (role + sign-up trigger), departments, doctors, availability, time off, appointments and notifications log; 24 RLS policies; storage bucket; realtime publication; seed departments.
3. **Auth**: register, login, logout, session handling, protected routes per role. Patient role is the sign-up default; role can never be changed by the user.
4. **Departments and doctors**: admin CRUD for both, doctor creation via the `admin-create-doctor` Edge Function or by promoting an existing user; patient-facing doctor listing, department filter and search.
5. **Availability and time off**: doctors manage weekly availability (weekday, start/end, slot length) and blocked dates.
6. **Slot generation and booking**: slots calculated from availability minus time off and existing appointments; booking page with date strip, slot picker, reason field; double booking blocked by the partial unique index.
7. **Patient dashboard**: upcoming/past/all tabs, cancel, profile editing.
8. **Doctor dashboard**: pending/confirmed/completed tabs, confirm, reject, cancel, complete, doctor notes, profile editing with photo upload.
9. **Realtime slot updates**: subscriptions on all dashboards and the booking page invalidate appointments and slot queries; a slot picked by someone else is cleared with an explanation.
10. **Email notifications**: booking, confirmation and cancellation through `send-appointment-email` (Resend), gated by `VITE_ENABLE_EMAILS` and best effort so email never blocks booking.
11. **Reminder job**: `send-reminders` Edge Function with cron secret and idempotency through `notifications_log`; pg_cron schedule example in `supabase/cron/`.
12. **Admin reports**: appointments per day/doctor/department, busiest hour, cancellation rate, charts and table view.
13. **Responsive polish and states**: loading skeletons, empty and error states across pages, mobile layouts; all three roles exercised manually.

## In Progress

- None. Last verification: `npm run typecheck` and `npm run build` pass (build warns about the single ~1.3 MB bundle).

## Next Up

1. Automated tests for the pure logic (`features/availability/slots.ts`, `features/reports/aggregate.ts`) and for the double-booking invariant.
2. Project report and final ER diagram (a Mermaid ER diagram now lives in the root `README.md`).
3. Deployment: Supabase migrations and Edge Functions, then the frontend on Vercel; set `VITE_ENABLE_EMAILS=true` and the Resend secrets.
4. Optional polish: code-split the admin/report routes to address the bundle-size warning.

## Open Questions

- ~~Fixed slot duration per doctor or per appointment type?~~ **Resolved**: per doctor (`doctor_availability.slot_minutes`, 5–240, default 30).
- ~~Does a doctor account need email verification, or does admin creation suffice?~~ **Resolved**: admin creation through the service-role Edge Function; no doctor self sign-up.
- ~~How far ahead can patients book?~~ **Resolved**: 30 days (`BOOKING_WINDOW_DAYS` in `src/lib/date.ts`).
- **Open**: cancellation cutoff. Patients can currently cancel any pending or confirmed appointment regardless of how close it is to the start time.
- ~~Is SMS in scope?~~ **Resolved**: email only; SMS remains a stretch goal.
- **Open**: the Resend free tier needs a verified domain to email arbitrary recipients; confirm the demo plan.

## Architecture Decisions

- **Supabase instead of Laravel**: removes the need for a separate backend; Auth, Postgres, Realtime and Edge Functions cover every requirement
- **Slots are calculated, not stored**: avoids generating and cleaning up thousands of rows; availability rules plus existing appointments are the source of truth
- **Double booking prevented by a partial unique index**: the database guarantees correctness even if two users book at once
- **Authorization in RLS**: the rules apply no matter how the API is called
- **React + Vite + TypeScript**: matches existing React experience and the typed, spec-driven workflow
- **Email first, SMS later**: SMS in India needs DLT registration, which can block progress
- **Dedicated `medibook` schema**: keeps application tables separate from `public`; PostgREST is told to expose it

## Session Notes

- Project name: MediBook (can be renamed)
- Stack and boundaries are defined in `architecture.md`; follow it
- Setup, function deployment and the ER diagram are documented in the root `README.md`
- This tracker was previously out of date (it still said "Not started" after the app was built); keep it updated from now on
