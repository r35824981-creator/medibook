import { formatTime, minutesToTime, nowMinutes, timeToMinutes, todayKey } from '@/lib/date'
import type { DoctorAvailability } from '@/types'

export type Slot = {
  startTime: string
  endTime: string
  label: string
}

type SlotRule = Pick<DoctorAvailability, 'start_time' | 'end_time' | 'slot_minutes'>

export function buildSlots(params: {
  dateKey: string
  availability: SlotRule | null
  hasTimeOff: boolean
  bookedStartTimes: string[]
}): Slot[] {
  const { availability } = params
  if (!availability || params.hasTimeOff) return []

  const start = timeToMinutes(availability.start_time)
  const end = timeToMinutes(availability.end_time)
  const duration = availability.slot_minutes
  const booked = new Set(params.bookedStartTimes.map((time) => time.slice(0, 5)))
  const isToday = params.dateKey === todayKey()
  const cutoff = isToday ? nowMinutes() : -1

  const slots: Slot[] = []

  for (let cursor = start; cursor + duration <= end; cursor += duration) {
    const startTime = minutesToTime(cursor)
    if (booked.has(startTime)) continue
    if (isToday && cursor <= cutoff) continue

    slots.push({
      startTime,
      endTime: minutesToTime(cursor + duration),
      label: formatTime(startTime),
    })
  }

  return slots
}
