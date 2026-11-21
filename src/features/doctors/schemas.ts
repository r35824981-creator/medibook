import { z } from 'zod'

export const doctorFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter the doctor name'),
  email: z.string().trim().email('Enter a valid email').or(z.literal('')),
  password: z.string().optional(),
  departmentId: z.string().uuid('Choose a department'),
  specialization: z.string().trim().min(2, 'Enter a specialization'),
  fees: z.coerce.number().min(0, 'Fees cannot be negative').max(100000),
  bio: z.string().trim().max(600, 'Keep the bio under 600 characters').optional(),
})

export type DoctorFormInput = z.infer<typeof doctorFormSchema>

export const doctorProfessionalSchema = z.object({
  specialization: z.string().trim().min(2, 'Enter a specialization'),
  fees: z.coerce.number().min(0, 'Fees cannot be negative').max(100000, 'Fees look too high'),
  bio: z.string().trim().max(600, 'Keep the bio under 600 characters').optional(),
})

export type DoctorProfessionalInput = z.infer<typeof doctorProfessionalSchema>

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name'),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, 'Enter a 10 digit phone number'),
})

export type ProfileInput = z.infer<typeof profileSchema>
