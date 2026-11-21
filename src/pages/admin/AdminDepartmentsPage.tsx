import { useMemo, useState } from 'react'
import { Building2, Pencil, Plus, Stethoscope, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DepartmentDialog } from '@/features/departments/components/DepartmentDialog'
import { useDeleteDepartment, useDepartments } from '@/features/departments/hooks'
import { useDoctors } from '@/features/doctors/hooks'
import { getErrorMessage } from '@/lib/errors'
import { pluralize } from '@/lib/utils'
import type { Department } from '@/types'

export function AdminDepartmentsPage() {
  const departmentsQuery = useDepartments()
  const doctorsQuery = useDoctors({ includeInactive: true })
  const deleteDepartment = useDeleteDepartment()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Department | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null)

  const counts = useMemo(() => {
    const map = new Map<string, { total: number; active: number }>()
    for (const doctor of doctorsQuery.data ?? []) {
      if (!doctor.department_id) continue
      const current = map.get(doctor.department_id) ?? { total: 0, active: 0 }
      current.total += 1
      if (doctor.is_active) current.active += 1
      map.set(doctor.department_id, current)
    }
    return map
  }, [doctorsQuery.data])

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteDepartment.mutateAsync(deleteTarget.id)
      toast.success('Department removed')
      setDeleteTarget(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Departments"
        subtitle="Departments group doctors and drive patient search and reports."
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditTarget(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            New department
          </Button>
        }
      />

      {departmentsQuery.isLoading ? <LoadingState rows={3} /> : null}

      {departmentsQuery.isError ? (
        <ErrorState
          message={getErrorMessage(departmentsQuery.error)}
          onRetry={() => void departmentsQuery.refetch()}
        />
      ) : null}

      {!departmentsQuery.isLoading && !departmentsQuery.isError ? (
        (departmentsQuery.data ?? []).length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No departments yet"
            description="Create your first department, then assign doctors to it."
            actionLabel="New department"
            onAction={() => {
              setEditTarget(null)
              setDialogOpen(true)
            }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(departmentsQuery.data ?? []).map((department) => {
              const count = counts.get(department.id) ?? { total: 0, active: 0 }
              return (
                <div key={department.id} className="flex flex-col rounded-2xl bg-surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <Badge variant={count.total > 0 ? 'accent' : 'default'}>
                      {count.total} {pluralize(count.total, 'doctor')}
                    </Badge>
                  </div>

                  <p className="mt-4 text-sm font-medium text-ink">{department.name}</p>
                  <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-muted">
                    {department.description || 'No description added yet.'}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                      <Stethoscope className="h-3.5 w-3.5" />
                      {count.active} active
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Edit ${department.name}`}
                        onClick={() => {
                          setEditTarget(department)
                          setDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-muted hover:bg-error-soft hover:text-error"
                        aria-label={`Delete ${department.name}`}
                        onClick={() => setDeleteTarget(department)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : null}

      <DepartmentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditTarget(null)
        }}
        department={editTarget}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={`Delete ${deleteTarget?.name ?? 'this department'}?`}
        description="Doctors in this department stay in the directory but become unassigned. This cannot be undone."
        confirmLabel="Delete department"
        cancelLabel="Keep it"
        destructive
        isLoading={deleteDepartment.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
