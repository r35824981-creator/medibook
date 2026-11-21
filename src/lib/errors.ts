import type { PostgrestError } from '@supabase/supabase-js'

type ErrorLike = {
  code?: string
  message?: string
  error_description?: string
  details?: string | null
}

export function getErrorMessage(error: unknown): string {
  if (!error) return 'Something went wrong. Please try again.'

  const err = error as ErrorLike & Partial<PostgrestError>

  if (err.code === '23505') {
    return 'That slot was just booked by someone else. Please choose another time.'
  }

  if (err.code === '42501') {
    return 'You do not have permission to do that.'
  }

  if (err.code === 'P0001' && err.message) {
    return err.message
  }

  if (err.code === 'PGRST301' || err.message?.includes('JWT')) {
    return 'Your session has expired. Please sign in again.'
  }

  if (err.message?.includes('duplicate key')) {
    return 'That record already exists.'
  }

  if (err.message?.includes('Failed to fetch')) {
    return 'Could not reach the server. Check your connection and try again.'
  }

  return err.message || err.error_description || 'Something went wrong. Please try again.'
}
