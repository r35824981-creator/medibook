import { supabase } from '@/lib/supabase'
import type { DoctorListItem, Profile } from '@/types'

const DOCTOR_SELECT = `
  id,
  profile_id,
  department_id,
  specialization,
  fees,
  bio,
  photo_url,
  is_active,
  created_at,
  updated_at,
  profile:profiles(full_name),
  department:departments(id, name)
`

export async function fetchDoctors(options?: {
  includeInactive?: boolean
}): Promise<DoctorListItem[]> {
  let query = supabase
    .from('doctors')
    .select(DOCTOR_SELECT)
    .order('created_at', { ascending: true })

  if (!options?.includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as DoctorListItem[]
}

export async function fetchDoctor(id: string): Promise<DoctorListItem> {
  const { data, error } = await supabase
    .from('doctors')
    .select(DOCTOR_SELECT)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as unknown as DoctorListItem
}

export async function fetchMyDoctor(profileId: string): Promise<DoctorListItem | null> {
  const { data, error } = await supabase
    .from('doctors')
    .select(DOCTOR_SELECT)
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) throw error
  return data as unknown as DoctorListItem | null
}

export type DoctorInput = {
  profileId: string
  departmentId: string | null
  specialization: string
  fees: number
  bio: string
  photoUrl?: string | null
  isActive?: boolean
}

export async function createDoctor(input: DoctorInput): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('doctors')
    .insert({
      profile_id: input.profileId,
      department_id: input.departmentId,
      specialization: input.specialization,
      fees: input.fees,
      bio: input.bio,
      photo_url: input.photoUrl ?? null,
      is_active: input.isActive ?? true,
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}

export type DoctorPatch = {
  department_id?: string | null
  specialization?: string
  fees?: number
  bio?: string
  photo_url?: string | null
  is_active?: boolean
}

export async function updateDoctor(id: string, patch: DoctorPatch): Promise<void> {
  const { error } = await supabase.from('doctors').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteDoctor(id: string): Promise<void> {
  const { error } = await supabase.from('doctors').delete().eq('id', id)
  if (error) throw error
}

export async function promoteToDoctor(profileId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'doctor' })
    .eq('id', profileId)

  if (error) throw error
}

export async function fetchPatientProfiles(): Promise<
  Pick<Profile, 'id' | 'full_name' | 'phone' | 'role'>[]
> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, role')
    .eq('role', 'patient')
    .order('full_name')

  if (error) throw error
  return (data ?? []) as unknown as Pick<Profile, 'id' | 'full_name' | 'phone' | 'role'>[]
}

export async function updateProfile(
  id: string,
  patch: { full_name?: string; phone?: string },
): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', id)
  if (error) throw error
}

export async function uploadDoctorPhoto(
  doctorId: string,
  file: File,
): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${doctorId}/${Date.now()}.${extension}`

  const { error } = await supabase.storage.from('doctor-photos').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  })

  if (error) throw error

  const { data } = supabase.storage.from('doctor-photos').getPublicUrl(path)
  return data.publicUrl
}
