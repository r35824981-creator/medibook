# Code Standards

## General

- Keep modules small and single-purpose
- Fix root causes, do not layer workarounds
- Do not mix unrelated concerns in one component or hook
- Prefer clear names over comments; comment only the "why"
- Remove unused code and console logs before finishing a unit

## TypeScript

- Strict mode is required throughout the project
- Avoid `any`; use explicit interfaces or narrowly scoped types
- Use the generated Supabase database types for all queries
- Validate all form input and unknown external data with Zod before trusting it
- Use string union types for statuses, e.g. `'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'`

## React

- Function components and hooks only
- One component per file; the file name matches the component name (PascalCase)
- Keep pages thin: they compose feature components and contain no data logic
- Put data access in custom hooks (e.g. `useAppointments`, `useDoctorSlots`) built on TanStack Query
- Do not call Supabase directly inside JSX components; go through feature hooks or query functions
- Handle loading, empty and error states for every data-driven view
- Use `React Router` loaders or a `ProtectedRoute` wrapper to guard role-specific routes

## Styling

- Use Tailwind with the CSS custom property tokens from `ui-context.md`; no hardcoded hex values
- Follow the border radius scale defined in `ui-context.md`
- Mobile first: every screen must work at 360px width
- Use shadcn/ui components before building custom ones

## Supabase and Data Access

- Validate and parse input before any query or mutation runs
- Enforce access in RLS policies; never rely on frontend checks alone
- Use only the anon key in the frontend; secrets live in Edge Function environment variables
- Return consistent shapes from query functions: `{ data, error }` handled in one place
- Use database constraints (unique index, foreign keys, check constraints) for rules that must never break
- Keep database logic that must be atomic (such as booking) in a single insert guarded by the unique index, and handle the conflict error with a friendly message

## Edge Functions

- One function per responsibility (`send-reminders`, `send-appointment-email`)
- Verify the caller (cron secret or user JWT) before doing any work
- Log every sent email to `notifications_log` and skip appointments already logged

## Data and Storage

- Application data belongs in Postgres
- Images belong in Supabase Storage, with only the file path stored in the database
- Do not store derived data that can be calculated (for example, free slots)

## File Organization

- `src/pages/`: route-level screens
- `src/features/<name>/`: components, hooks, queries and Zod schemas for one domain
- `src/components/ui/`: shadcn generated components
- `src/components/layout/`: sidebars, navbar, dashboard shell
- `src/lib/`: Supabase client, query client, shared utilities
- `src/types/`: shared and generated types
- `supabase/migrations/`: timestamped SQL migration files
- `supabase/functions/`: Edge Functions
