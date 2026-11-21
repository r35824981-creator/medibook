import { z } from 'zod'

export const bookingSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Tell the doctor why you are visiting')
    .max(300, 'Keep it under 300 characters'),
})

export type BookingInput = z.infer<typeof bookingSchema>

export const notesSchema = z.object({
  doctorNotes: z
    .string()
    .trim()
    .min(2, 'Add a short note for the patient')
    .max(500, 'Keep it under 500 characters'),
})

export type NotesInput = z.infer<typeof notesSchema>
