import { z } from 'zod'

export const timeOffSchema = z.object({
  date: z.string().min(1, 'Choose a date'),
  reason: z.string().trim().max(200, 'Keep it under 200 characters').optional(),
})

export type TimeOffInput = z.infer<typeof timeOffSchema>
