import { supabase } from '@/lib/supabase'
import type { Department } from '@/types'

export async function fetchDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as Department[]
}

export async function createDepartment(input: {
  name: string
  description: string
}): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('departments')
    .insert({ name: input.name, description: input.description })
    .select('id')
    .single()

  if (error) throw error
  return data
}

export async function updateDepartment(
  id: string,
  patch: { name?: string; description?: string },
): Promise<void> {
  const { error } = await supabase.from('departments').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteDepartment(id: string): Promise<void> {
  const { error } = await supabase.from('departments').delete().eq('id', id)
  if (error) throw error
}
