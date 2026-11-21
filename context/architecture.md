# Architecture Context

## Stack

| Layer          | Technology                       | Role                                              |
| -------------- | -------------------------------- | ------------------------------------------------- |
| Framework      | React 18 + Vite + TypeScript     | Single-page frontend                              |
| UI             | Tailwind CSS + shadcn/ui         | Styling and accessible base components            |
| Routing        | React Router                     | Role-based routes and protected pages             |
| Data fetching  | TanStack Query + supabase-js     | Server state, caching, mutations                  |
| Forms          | React Hook Form + Zod            | Form handling and input validation                |
| Auth           | Supabase Auth                    | Email/password login and sessions                 |
| Database       | Supabase Postgres + RLS          | All application data and access rules             |
| Realtime       | Supabase Realtime                | Live slot availability updates                    |
| Scheduled jobs | pg_cron                          | Hourly job that finds appointments needing reminders |
| Server code    | Supabase Edge Functions (Deno)   | Sends emails, holds secrets                       |
| Email          | Resend                           | Transactional and reminder emails                 |
| Charts         | Recharts                         | Admin report charts                               |
| Dates          | date-fns                         | Slot generation and date formatting               |
| Hosting        | Vercel (frontend) + Supabase     | Deployment                                        |

## System Boundaries

- `src/pages/` owns route-level screens only: composes features, no business logic
- `src/features/` owns domain code, one folder each: `auth`, `doctors`, `availability`, `appointments`, `reports`. Each holds its components, hooks, queries and schemas
- `src/components/` owns shared UI: `ui/` (shadcn, generated) and `layout/` (sidebars, navbar, page shells)
- `src/lib/` owns the Supabase client, query client and small utilities
- `src/types/` owns shared TypeScript types, including generated database types
- `supabase/migrations/` owns the database schema, indexes and RLS policies as SQL files
- `supabase/functions/` owns Edge Functions, such as `send-reminders` and `send-appointment-email`

## Storage Model

- **Postgres database**: all application data
  - `profiles` (id, full_name, phone, role)
  - `departments` (id, name)
  - `doctors` (profile_id, department_id, specialization, fees, bio)
  - `doctor_availability` (id, doctor_id, weekday, start_time, end_time, slot_minutes)
  - `doctor_time_off` (id, doctor_id, date, reason)
  - `appointments` (id, patient_id, doctor_id, appointment_date, start_time, end_time, status, reason, doctor_notes, created_at)
  - `notifications_log` (id, appointment_id, type, sent_at)
- **Supabase Storage**: doctor profile photos only
- **Slots are not stored.** They are calculated from availability rules, time off and existing appointments

## Auth and Access Model

- Every user signs in through Supabase Auth; a trigger creates a `profiles` row on sign up with role `patient`
- Doctor accounts are created by an admin; the first admin is set manually in the database
- A patient owns their appointments; a doctor owns the appointments assigned to them
- Access control is enforced by Row Level Security:
  - Patients read and create their own appointments and cancel their own pending or confirmed ones
  - Doctors read appointments assigned to them and update their status and notes
  - Doctors manage only their own availability and time off
  - Admins can read everything and manage departments and doctors
  - Anyone signed in can read the list of doctors and departments

## Invariants

1. A doctor cannot have two active appointments in the same slot. A partial unique index on `(doctor_id, appointment_date, start_time)` where `status` is not `cancelled` or `rejected` enforces it
2. Authorization lives in RLS policies. The UI hiding a button is never the only protection
3. The Supabase service role key and the Resend API key never appear in frontend code or the repo. The frontend uses only the anon key
4. Users can never change their own `role`
5. Reminder emails are sent only from Edge Functions, and each is recorded in `notifications_log` so none is sent twice
6. Every schema change is a new migration file, never an edit made only in the dashboard
7. Appointment times are stored in a single timezone (Asia/Kolkata) and shown consistently
