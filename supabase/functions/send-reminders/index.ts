// Sends 24 hour reminders for confirmed appointments.
//
// Schedule hourly with pg_cron (see supabase/cron/schedule_reminders.sql.example).
// Every send is recorded in notifications_log, so re-running the function
// never sends the same reminder twice.

import { handleOptions, jsonResponse } from '../_shared/cors.ts'
import { renderAppointmentEmail, sendEmail } from '../_shared/email.ts'
import {
  adminClient,
  formatAppointmentDate,
  formatAppointmentTime,
  tomorrowInKolkata,
} from '../_shared/supabase.ts'

type Relation<T> = T | T[] | null

function one<T>(value: Relation<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

function isAuthorized(request: Request): boolean {
  const cronSecret = Deno.env.get('CRON_SECRET')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const providedSecret = request.headers.get('x-cron-secret')
  const authHeader = request.headers.get('Authorization') ?? ''
  const bearer = authHeader.replace(/^Bearer\s+/i, '')

  if (cronSecret && providedSecret && providedSecret === cronSecret) return true
  if (serviceRoleKey && bearer && bearer === serviceRoleKey) return true

  return false
}

Deno.serve(async (request) => {
  const options = handleOptions(request)
  if (options) return options

  if (!isAuthorized(request)) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  try {
    const admin = adminClient()
    const reminderDate = tomorrowInKolkata()

    const { data: appointments, error } = await admin
      .from('appointments')
      .select(
        `id, patient_id, appointment_date, start_time, end_time, status, reason,
         doctor:doctors(id, profile_id, specialization, department:departments(name), profile:profiles(full_name)),
         patient:profiles(id, full_name)`,
      )
      .eq('status', 'confirmed')
      .eq('appointment_date', reminderDate)
      .order('start_time', { ascending: true })

    if (error) {
      console.error('[send-reminders] Could not load appointments:', error)
      return jsonResponse({ error: 'Could not load appointments' }, 500)
    }

    let sent = 0
    let skipped = 0
    let failed = 0

    for (const appointment of appointments ?? []) {
      const doctor = one(appointment.doctor as Relation<Record<string, unknown>>)
      const patient = one(appointment.patient as Relation<Record<string, unknown>>)
      const doctorProfile = doctor ? one(doctor.profile as Relation<Record<string, unknown>>) : null
      const department = doctor ? one(doctor.department as Relation<Record<string, unknown>>) : null

      const { data: logRow, error: logError } = await admin
        .from('notifications_log')
        .insert({ appointment_id: appointment.id, type: 'reminder' })
        .select('id')
        .single()

      if (logError) {
        if (logError.code === '23505') {
          skipped += 1
          continue
        }
        console.error('[send-reminders] Could not claim reminder:', logError)
        failed += 1
        continue
      }

      const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(
        appointment.patient_id as string,
      )

      if (authUserError || !authUser.user?.email) {
        console.error('[send-reminders] Patient email unavailable:', authUserError)
        await admin.from('notifications_log').delete().eq('id', logRow.id)
        failed += 1
        continue
      }

      const result = await sendEmail({
        to: authUser.user.email,
        subject: 'MediBook: your appointment is tomorrow',
        html: renderAppointmentEmail({
          kind: 'reminder',
          patientName: (patient?.full_name as string) || 'there',
          patientEmail: authUser.user.email,
          doctorName: (doctorProfile?.full_name as string) || 'Your doctor',
          specialization: (doctor?.specialization as string) || 'Consultation',
          department: (department?.name as string) || 'General',
          date: formatAppointmentDate(appointment.appointment_date as string),
          time: formatAppointmentTime(appointment.start_time as string),
          reason: (appointment.reason as string) || '',
        }),
      })

      if (result.sent) {
        sent += 1
      } else {
        await admin.from('notifications_log').delete().eq('id', logRow.id)
        failed += 1
      }
    }

    return jsonResponse({
      date: reminderDate,
      candidates: appointments?.length ?? 0,
      sent,
      skipped,
      failed,
    })
  } catch (error) {
    console.error('[send-reminders] Unexpected error:', error)
    return jsonResponse({ error: 'Unexpected error' }, 500)
  }
})
