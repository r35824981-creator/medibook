import { z } from 'zod'

export const departmentSchema = z.object({
  name: z.string().trim().min(2, 'Enter a department name').max(60),
  description: z.string().trim().max(240, 'Keep it under 240 characters').optional(),
})

export type DepartmentInput = z.infer<typeof departmentSchema>
