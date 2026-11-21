# MediBook Edge Functions

All functions use the `medibook` schema. The service role key is only read from
the function runtime environment and is never sent to the browser.

| Function                 | Caller                          | Purpose                                                     |
| ------------------------ | ------------------------------- | ----------------------------------------------------------- |
| `send-appointment-email` | Signed-in patient/doctor/admin  | Booking, confirmation and cancellation emails through Resend |
| `send-reminders`         | pg_cron (secret) or service role| 24 hour reminder emails for confirmed appointments           |
| `admin-create-doctor`    | Admin                           | Creates an auth user, profile and doctor row                 |

## Secrets

```bash
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set REMINDER_FROM_EMAIL="MediBook <appointments@yourdomain.com>"
supabase secrets set CRON_SECRET=<long-random-value>
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are provided
by the Supabase runtime automatically.

## Deploy

```bash
supabase functions deploy send-appointment-email
supabase functions deploy send-reminders --no-verify-jwt
supabase functions deploy admin-create-doctor
```

`send-reminders` uses its own `x-cron-secret` check, so it is deployed with
`--no-verify-jwt` and must be scheduled from `supabase/cron/schedule_reminders.sql.example`.

## Behaviour without configuration

- No `RESEND_API_KEY`: the functions log a warning, send nothing and leave
  `notifications_log` untouched so the email can be sent after configuration.
- Frontend email calls are best effort. Booking, confirmation and cancellation
  never fail because an Edge Function is missing.
- `admin-create-doctor` is required only for creating a brand new doctor login.
  The admin UI can also promote an existing registered user to the doctor role.
