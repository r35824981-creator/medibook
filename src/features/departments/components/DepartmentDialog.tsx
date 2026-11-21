import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/shared/Field'
import {
  useCreateDepartment,
  useUpdateDepartment,
} from '@/features/departments/hooks'
import { departmentSchema, type DepartmentInput } from '@/features/departments/schemas'
import { getErrorMessage } from '@/lib/errors'
import type { Department } from '@/types'

export function DepartmentDialog({
  open,
  onOpenChange,
  department,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: Department | null
}) {
  const createDepartment = useCreateDepartment()
  const updateDepartment = useUpdateDepartment()
  const [error, setError] = useState('')

  const form = useForm<DepartmentInput>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: '', description: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: department?.name ?? '',
        description: department?.description ?? '',
      })
      setError('')
    }
  }, [open, department, form])

  const onSubmit = form.handleSubmit(async (values) => {
    setError('')
    try {
      if (department) {
        await updateDepartment.mutateAsync({
          id: department.id,
          patch: { name: values.name, description: values.description ?? '' },
        })
        toast.success('Department updated')
      } else {
        await createDepartment.mutateAsync({
          name: values.name,
          description: values.description ?? '',
        })
        toast.success('Department created')
      }
      onOpenChange(false)
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    }
  })

  const isSaving = createDepartment.isPending || updateDepartment.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{department ? 'Edit department' : 'New department'}</DialogTitle>
          <DialogDescription>
            Departments group doctors and appear in patient search and reports.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
          <Field label="Name" htmlFor="department-name" error={form.formState.errors.name?.message}>
            <Input id="department-name" placeholder="Cardiology" {...form.register('name')} />
          </Field>

          <Field
            label="Description"
            htmlFor="department-description"
            error={form.formState.errors.description?.message}
          >
            <Textarea
              id="department-description"
              placeholder="Heart and vascular care"
              {...form.register('description')}
            />
          </Field>

          {error ? (
            <p className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">{error}</p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : department ? 'Save changes' : 'Create department'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
