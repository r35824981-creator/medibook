// Creates a doctor account (auth user + profile + doctor row) with the service role.
//
// Only administrators may call this function. The service role key never
// leaves the Edge Function runtime. If any step fails the partial records are
// cleaned up so the email can be reused.

import { handleOptions, jsonResponse } from '../_shared/cors.ts'
import { adminClient, userClient } from '../_shared/supabase.ts'

type RequestBody = {
  fullName?: string
  email?: string
  password?: string
  departmentId?: string
  specialization?: string
  fees?: number | string
  bio?: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

    const userSupabase = userClient(jwt)
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser(jwt)

    if (userError || !user) {
      return jsonResponse({ error: 'Invalid session' }, 401)
    }

    const admin = adminClient()

    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return jsonResponse({ error: 'Only administrators can create doctors' }, 403)
    }

    const body = (await request.json().catch(() => ({}))) as RequestBody

    const fullName = body.fullName?.trim() ?? ''
    const email = body.email?.trim().toLowerCase() ?? ''
    const password = body.password ?? ''
    const departmentId = body.departmentId ?? ''
    const specialization = body.specialization?.trim() ?? ''
    const fees = Number(body.fees ?? 0)
    const bio = body.bio?.trim() ?? ''

    if (fullName.length < 2) return jsonResponse({ error: 'Enter the doctor name' }, 400)
    if (!emailPattern.test(email)) return jsonResponse({ error: 'Enter a valid email' }, 400)
    if (password.length < 8) {
      return jsonResponse({ error: 'Password must be at least 8 characters' }, 400)
    }
    if (!departmentId) return jsonResponse({ error: 'Choose a department' }, 400)
    if (specialization.length < 2) {
      return jsonResponse({ error: 'Enter a specialization' }, 400)
    }
    if (!Number.isFinite(fees) || fees < 0 || fees > 100000) {
      return jsonResponse({ error: 'Fees must be between 0 and 100000' }, 400)
    }

    const { data: department, error: departmentError } = await admin
      .from('departments')
      .select('id')
      .eq('id', departmentId)
      .maybeSingle()

    if (departmentError || !department) {
      return jsonResponse({ error: 'That department does not exist' }, 400)
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone: '' },
    })

    if (createError || !created.user) {
      console.error('[admin-create-doctor] Could not create auth user:', createError)
      return jsonResponse(
        { error: createError?.message ?? 'Could not create the account' },
        400,
      )
    }

    const profileId = created.user.id

    const { error: roleError } = await admin
      .from('profiles')
      .update({ role: 'doctor', full_name: fullName })
      .eq('id', profileId)

    if (roleError) {
      console.error('[admin-create-doctor] Could not promote profile:', roleError)
      await admin.auth.admin.deleteUser(profileId)
      return jsonResponse({ error: 'Could not promote the new account' }, 500)
    }

    const { data: doctor, error: doctorError } = await admin
      .from('doctors')
      .insert({
        profile_id: profileId,
        department_id: departmentId,
        specialization,
        fees: Math.round(fees),
        bio,
      })
      .select('id')
      .single()

    if (doctorError || !doctor) {
      console.error('[admin-create-doctor] Could not create doctor row:', doctorError)
      await admin.auth.admin.deleteUser(profileId)
      return jsonResponse({ error: 'Could not create the doctor profile' }, 500)
    }

    return jsonResponse({ profileId, doctorId: doctor.id }, 201)
  } catch (error) {
    console.error('[admin-create-doctor] Unexpected error:', error)
    return jsonResponse({ error: 'Unexpected error' }, 500)
  }
})
