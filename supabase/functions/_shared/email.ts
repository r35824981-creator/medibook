// Email delivery through Resend.
//
// The API key lives only in the Edge Function secrets. When it is missing the
// function logs a warning and reports that the email was not sent, so the
// caller can decide whether to retry later. Nothing is logged to
// notifications_log unless the provider accepted the message.

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export type EmailResult = {
  sent: boolean
  reason?: string
}

export type EmailPayload = {
  to: string
  subject: string
  html: string
}

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('REMINDER_FROM_EMAIL') ?? 'MediBook <onboarding@resend.dev>'

  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY is not configured; skipping send to', payload.to)
    return { sent: false, reason: 'RESEND_API_KEY is not configured' }
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error('[email] Resend rejected the message:', response.status, detail)
      return { sent: false, reason: `Resend returned ${response.status}` }
    }

    return { sent: true }
  } catch (error) {
    console.error('[email] Resend request failed:', error)
    return { sent: false, reason: 'Could not reach Resend' }
  }
}

type AppointmentEmailInput = {
  patientName: string
  patientEmail: string
  doctorName: string
  specialization: string
  department: string
  date: string
  time: string
  reason: string
  notes?: string
  kind: 'booking' | 'confirmation' | 'cancellation' | 'reminder'
}

const titles: Record<AppointmentEmailInput['kind'], string> = {
  booking: 'Appointment request received',
  confirmation: 'Your appointment is confirmed',
  cancellation: 'Your appointment was cancelled',
  reminder: 'Reminder: your appointment is tomorrow',
}

const intros: Record<AppointmentEmailInput['kind'], string> = {
  booking:
    'We received your request. The doctor will confirm it shortly and you will get another email when they do.',
  confirmation:
    'The doctor confirmed your appointment. Please arrive 10 minutes early with any previous reports.',
  cancellation:
    'This appointment is no longer active. The slot has been released and you can book another time.',
  reminder:
    'Your appointment is in about 24 hours. If you can no longer attend, cancel it so another patient can use the slot.',
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function renderAppointmentEmail(input: AppointmentEmailInput): string {
  const rows: [string, string][] = [
    ['Doctor', `${input.doctorName} · ${input.specialization}`],
    ['Department', input.department || 'General'],
    ['Date', input.date],
    ['Time', input.time],
  ]

  if (input.reason) rows.push(['Reason', input.reason])
  if (input.notes) rows.push(['Doctor notes', input.notes])

  const tableRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 0;color:#6B7280;font-size:13px;width:110px;vertical-align:top;">${escapeHtml(
            label,
          )}</td>
          <td style="padding:8px 0;color:#0A0A0A;font-size:13px;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join('')

  return `<!doctype html>
<html>
  <body style="margin:0;background:#EDEDEF;font-family:Inter,Arial,sans-serif;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:16px;padding:28px;">
      <p style="margin:0;font-size:13px;font-weight:500;color:#0A0A0A;">MediBook</p>
      <p style="margin:2px 0 0;font-size:11px;color:#6B7280;">Hospital appointments</p>

      <h1 style="margin:24px 0 0;font-size:20px;font-weight:500;color:#0A0A0A;">
        ${escapeHtml(titles[input.kind])}
      </h1>
      <p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:#6B7280;">
        Hi ${escapeHtml(input.patientName)}, ${escapeHtml(intros[input.kind])}
      </p>

      <div style="margin-top:20px;border-top:1px solid #E5E7EB;border-bottom:1px solid #E5E7EB;">
        <table style="width:100%;border-collapse:collapse;">${tableRows}</table>
      </div>

      <p style="margin:20px 0 0;font-size:11px;line-height:1.6;color:#6B7280;">
        Appointment times are shown in Asia/Kolkata (IST). This message was sent by MediBook.
        Please do not reply to this email.
      </p>
    </div>
  </body>
</html>`
}
