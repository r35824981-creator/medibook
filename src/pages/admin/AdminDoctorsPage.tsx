import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pencil, Plus, Search, Stethoscope, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { AddDoctorDialog } from '@/features/doctors/components/AddDoctorDialog'
import { EditDoctorDialog } from '@/features/doctors/components/EditDoctorDialog'
import {
  useDoctors,
  usePatientProfiles,
  useUpdateDoctor,
} from '@/features/doctors/hooks'
import { useDepartments } from '@/features/departments/hooks'
import { getErrorMessage } from '@/lib/errors'
import { cn, formatInr, initials } from '@/lib/utils'
import type { DoctorListItem } from '@/types'

export function AdminDoctorsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const doctorsQuery = useDoctors({ includeInactive: true })
  const departmentsQuery = useDepartments()
  const patientsQuery = usePatientProfiles()
  const updateDoctor = useUpdateDoctor()

  const [search, setSearch] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<DoctorListItem | null>(null)

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setAddOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('new')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (doctorsQuery.data ?? []).filter((doctor) => {
      if (departmentId && doctor.department_id !== departmentId) return false
      if (!term) return true
      return [doctor.profile?.full_name, doctor.specialization, doctor.department?.name]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(term))
    })
  }, [doctorsQuery.data, departmentId, search])

  const activeCount = (doctorsQuery.data ?? []).filter((doctor) => doctor.is_active).length

  async function toggleActive(doctor: DoctorListItem) {
    try {
      await updateDoctor.mutateAsync({
        id: doctor.id,
        patch: { is_active: !doctor.is_active },
      })
      toast.success(
        doctor.is_active
          ? `${doctor.profile?.full_name ?? 'Doctor'} is no longer accepting patients`
          : `${doctor.profile?.full_name ?? 'Doctor'} is accepting patients again`,
      )
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Doctors"
        subtitle={
          doctorsQuery.data
            ? `${activeCount} active · ${
                doctorsQuery.data.length - activeCount
              } inactive. Deactivating keeps appointment history.`
            : 'Manage doctor accounts, departments and availability.'
        }
        actions={
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add doctor
          </Button>
        }
      />

      <div className="rounded-2xl bg-surface p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or specialization"
              className="pl-9"
              aria-label="Search doctors"
            />
          </div>

          <Select value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger className="md:w-56" aria-label="Filter by department">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              {(departmentsQuery.data ?? []).map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {doctorsQuery.isLoading ? <LoadingState rows={4} /> : null}

      {doctorsQuery.isError ? (
        <ErrorState
          message={getErrorMessage(doctorsQuery.error)}
          onRetry={() => void doctorsQuery.refetch()}
        />
      ) : null}

      {!doctorsQuery.isLoading && !doctorsQuery.isError ? (
        filtered.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No doctors match"
            description="Try another search, or add a doctor account to the directory."
            actionLabel="Add doctor"
            onAction={() => setAddOpen(true)}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl bg-surface">
            <div className="hidden grid-cols-[1.6fr_1fr_0.6fr_0.7fr_0.9fr] gap-4 border-b border-line px-5 py-3 text-[11px] font-medium text-muted lg:grid">
              <span>Doctor</span>
              <span>Department</span>
              <span>Fee</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="divide-y divide-line">
              {filtered.map((doctor) => {
                const name = doctor.profile?.full_name ?? 'Doctor'
                return (
                  <div
                    key={doctor.id}
                    className="flex flex-col gap-3 px-5 py-4 lg:grid lg:grid-cols-[1.6fr_1fr_0.6fr_0.7fr_0.9fr] lg:items-center lg:gap-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-xl">
                        {doctor.photo_url ? (
                          <AvatarImage src={doctor.photo_url} alt={name} />
                        ) : null}
                        <AvatarFallback className="rounded-xl">{initials(name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{name}</p>
                        <p className="truncate text-xs text-muted">{doctor.specialization}</p>
                      </div>
                    </div>

                    <div className="text-xs text-muted lg:text-sm lg:text-ink">
                      <span className="text-muted lg:hidden">Department · </span>
                      {doctor.department?.name ?? 'Unassigned'}
                    </div>

                    <div className="text-xs text-ink lg:text-sm">{formatInr(doctor.fees)}</div>

                    <div>
                      <Badge variant={doctor.is_active ? 'success' : 'default'}>
                        {doctor.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 lg:justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditTarget(doctor)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={doctor.is_active}
                        aria-label={`Toggle ${name}`}
                        onClick={() => void toggleActive(doctor)}
                        disabled={updateDoctor.isPending}
                        className={cn(
                          'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50',
                          doctor.is_active ? 'bg-accent' : 'bg-line',
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                            doctor.is_active ? 'translate-x-[22px]' : 'translate-x-0.5',
                          )}
                        />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      ) : null}

      <div className="rounded-2xl bg-muted-soft p-4">
        <div className="flex items-start gap-2">
          <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
          <p className="text-xs leading-relaxed text-muted">
            A doctor account is an existing user promoted to the doctor role, or a new account
            created through the admin Edge Function. Inactive doctors stay in reports but cannot be
            booked.
          </p>
        </div>
      </div>

      <AddDoctorDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        departments={departmentsQuery.data ?? []}
        patients={patientsQuery.data ?? []}
      />

      <EditDoctorDialog
        doctor={editTarget}
        departments={departmentsQuery.data ?? []}
        open={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
        }}
      />
    </div>
  )
}
