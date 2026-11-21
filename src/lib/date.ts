import { format, parseISO } from 'date-fns'

export const BOOKING_WINDOW_DAYS = 30
export const APPOINTMENT_TIMEZONE = 'Asia/Kolkata'

export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function fromDateKey(key: string): Date {
  return parseISO(key)
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function formatDateLong(value: Date | string): string {
  const date = typeof value === 'string' ? fromDateKey(value) : value
  return format(date, 'EEEE, d MMMM yyyy')
}

export function formatDateShort(value: Date | string): string {
  const date = typeof value === 'string' ? fromDateKey(value) : value
  return format(date, 'd MMM yyyy')
}

export function formatWeekday(value: Date | string): string {
  const date = typeof value === 'string' ? fromDateKey(value) : value
  return format(date, 'EEE')
}

export function formatDayNumber(value: Date | string): string {
  const date = typeof value === 'string' ? fromDateKey(value) : value
  return format(date, 'd')
}

export function formatMonth(value: Date | string): string {
  const date = typeof value === 'string' ? fromDateKey(value) : value
  return format(date, 'MMM')
}

export function formatTime(value: string): string {
  const [hours, minutes] = value.split(':').map(Number)
  const date = new Date()
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0)
  return format(date, 'h:mm a')
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

export function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return (hours ?? 0) * 60 + (minutes ?? 0)
}

export function minutesToTime(total: number): string {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function isSameDateKey(date: Date, key: string): boolean {
  return toDateKey(date) === key
}

export function nowMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}
