import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name'),
    email: z.string().trim().email('Enter a valid email address'),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9]{10}$/, 'Enter a 10 digit phone number'),
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export type RegisterInput = z.infer<typeof registerSchema>
