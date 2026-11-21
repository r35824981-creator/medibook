import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDeleteAvailability, useUpsertAvailability } from '@/features/availability/hooks'
import { getErrorMessage } from '@/lib/errors'
import { timeToMinutes } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { DoctorAvailability } from '@/types'

const weekdays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const slotOptions = ['15', '20', '30', '45', '60']

export function AvailabilityDayRow({
  doctorId,
  weekday,
  rule,
}: {
  doctorId: string
  weekday: number
  rule?: DoctorAvailability
}) {
  const upsert = useUpsertAvailability()
  const remove = useDeleteAvailability()

  const [enabled, setEnabled] = useState(Boolean(rule))
  const [startTime, setStartTime] = useState(rule?.start_time.slice(0, 5) ?? '09:00')
  const [endTime, setEndTime] = useState(rule?.end_time.slice(0, 5) ?? '17:00')
  const [slotMinutes, setSlotMinutes] = useState(String(rule?.slot_minutes ?? 30))

  useEffect(() => {
    setEnabled(Boolean(rule))
    if (rule) {
      setStartTime(rule.start_time.slice(0, 5))
      setEndTime(rule.end_time.slice(0, 5))
      setSlotMinutes(String(rule.slot_minutes))
    }
  }, [rule])

  const isSaving = upsert.isPending || remove.isPending

  async function handleSave() {
    try {
      if (!enabled) {
        if (rule) {
          await remove.mutateAsync(rule.id)
          toast.success(`${weekdays[weekday]} removed from your schedule`)
        }
        return
      }

      if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
        toast.error('End time must be after the start time')
        return
      }

      await upsert.mutateAsync({
        doctorId,
        weekday,
        startTime,
        endTime,
        slotMinutes: Number(slotMinutes),
      })
      toast.success(`${weekdays[weekday]} availability saved`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div
      className={cn(
        'rounded-2xl p-4 transition-colors',
        enabled ? 'bg-surface' : 'bg-muted-soft',
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3 lg:w-48">
          <div>
            <p className="text-sm font-medium text-ink">{weekdays[weekday]}</p>
            <p className="text-[11px] text-muted">
              {enabled ? `${startTime} – ${endTime}` : 'Not available'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={`Toggle ${weekdays[weekday]}`}
            onClick={() => setEnabled((value) => !value)}
            className={cn(
              'relative h-6 w-11 shrink-0 rounded-full transition-colors',
              enabled ? 'bg-accent' : 'bg-line',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                enabled ? 'translate-x-[22px]' : 'translate-x-0.5',
              )}
            />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 lg:max-w-xl">
          <Input
            type="time"
            value={startTime}
            disabled={!enabled}
            onChange={(event) => setStartTime(event.target.value)}
            aria-label={`${weekdays[weekday]} start time`}
          />
          <Input
            type="time"
            value={endTime}
            disabled={!enabled}
            onChange={(event) => setEndTime(event.target.value)}
            aria-label={`${weekdays[weekday]} end time`}
          />
          <Select
            value={slotMinutes}
            onValueChange={setSlotMinutes}
            disabled={!enabled}
          >
            <SelectTrigger aria-label={`${weekdays[weekday]} slot length`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {slotOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option} min slots
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant={enabled ? 'secondary' : 'outline'}
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="lg:w-24"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
