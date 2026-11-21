// Sends a transactional appointment email through Resend.
//
// Invoked from the frontend after booking, confirming or cancelling.
// The caller must own the appointment, be its doctor, or be an admin.
// A notifications_log row makes each (appointment, type) pair idempotent.

import { handleOptions, jsonResponse } from '../_shared/cors.ts'
import { renderAppointmentEmail, sendEmail } from '../_shared/email.ts'
import {
  adminClient,
  formatAppointmentDate,
  formatAppointmentTime,
  userClient,
} from '../_shared/supabase.ts'

const notificationTypes = ['booking', 'confirmation', 'cancellation', 'reminder'] as const
type NotificationType = (typeof notificationTypes)[number]

type RequestBody = {
  appointmentId?: string
  type?: NotificationType
}

type Relation<T> = T | T[] | null

function one<T>(value: Relation<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === 'string' && notificationTypes.includes(value as NotificationType)
}

Deno.serve(async (request) => {
  const options = handleOptions(request)
  if (options) return options

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const authHeader = request.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace(/^Bearer\s+/i, '')
    if (!jwt) return jsonResponse({ error: 'Missing authorization token' }, 401)

    const body = (await request.json().catch(() => ({}))) as RequestBody
    if (!body.appointmentId || !isNotificationType(body.type)) {
      return jsonResponse({ error: 'appointmentId and a valid type are required' }, 400)
    }

    const userSupabase = userClient(jwt)
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser(jwt)

    if (userError || !user) {
      return jsonResponse({ error: 'Invalid session' }, 401)
    }

    const admin = adminClient()

    const { data: appointment, error: appointmentError } = await admin
      .from('appointments')
      .select(
        `id, patient_id, appointment_date, start_time, end_time, status, reason, doctor_notes,
         doctor:doctors(id, profile_id, specialization, department:departments(name), profile:profiles(full_name)),
         patient:profiles(id, full_name)`,
      )
      .eq('id', body.appointmentId)
      .single()

    if (appointmentError || !appointment) {
      return jsonResponse({ error: 'Appointment not found' }, 404)
    }

    const doctor = one(appointment.doctor as Relation<Record<string, unknown>>)
    const patient = one(appointment.patient as Relation<Record<string, unknown>>)
    const doctorProfile = doctor ? one(doctor.profile as Relation<Record<string, unknown>>) : null
    const department = doctor ? one(doctor.department as Relation<Record<string, unknown>>) : null

    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isOwner = appointment.patient_id === user.id
    const isDoctor = doctor?.profile_id === user.id
    const isAdmin = callerProfile?.role === 'admin'

    if (!isOwner && !isDoctor && !isAdmin) {
      return jsonResponse({ error: 'You cannot send email for this appointment' }, 403)
    }

    const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(
      appointment.patient_id as string,
    )

    if (authUserError || !authUser.user?.email) {
      console.error('[send-appointment-email] Patient email unavailable:', authUserError)
      return jsonResponse({ sent: false, reason: 'Patient email is unavailable' })
    }

    const { data: logRow, error: logError } = await admin
      .from('notifications_log')
      .insert({ appointment_id: appointment.id, type: body.type })
      .select('id')
      .single()

    if (logError) {
      if (logError.code === '23505') {
        return jsonResponse({ sent: false, reason: 'Already sent' })
      }
      console.error('[send-appointment-email] Could not write notifications_log:', logError)
      return jsonResponse({ error: 'Could not record the notification' }, 500)
    }

    const result = await sendEmail({
      to: authUser.user.email,
      subject:
        body.type === 'booking'
          ? 'MediBook: appointment request received'
          : body.type === 'confirmation'
            ? 'MediBook: your appointment is confirmed'
            : body.type === 'cancellation'
              ? 'MediBook: appointment cancelled'
              : 'MediBook: appointment reminder',
      html: renderAppointmentEmail({
        kind: body.type,
        patientName: (patient?.full_name as string) || 'there',
        patientEmail: authUser.user.email,
        doctorName: (doctorProfile?.full_name as string) || 'Your doctor',
        specialization: (doctor?.specialization as string) || 'Consultation',
        department: (department?.name as string) || 'General',
        date: formatAppointmentDate(appointment.appointment_date as string),
        time: formatAppointmentTime(appointment.start_time as string),
        reason: (appointment.reason as string) || '',
        notes: (appointment.doctor_notes as string) || undefined,
      }),
    })

    if (!result.sent) {
      // Keep the log clean so the email can be retried after configuration.
      await admin.from('notifications_log').delete().eq('id', logRow.id)
      return jsonResponse({ sent: false, reason: result.reason })
    }

    return jsonResponse({ sent: true })
  } catch (error) {
    console.error('[send-appointment-email] Unexpected error:', error)
    return jsonResponse({ error: 'Unexpected error' }, 500)
  }
})
