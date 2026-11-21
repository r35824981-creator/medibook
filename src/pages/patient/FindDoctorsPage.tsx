import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, Stethoscope, X } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { DoctorCard } from '@/features/doctors/components/DoctorCard'
import { useDoctors } from '@/features/doctors/hooks'
import { useDepartments } from '@/features/departments/hooks'
import { getErrorMessage } from '@/lib/errors'
import { pluralize } from '@/lib/utils'

export function FindDoctorsPage() {
  const doctorsQuery = useDoctors()
  const departmentsQuery = useDepartments()
  const [search, setSearch] = useState('')
  const [departmentId, setDepartmentId] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (doctorsQuery.data ?? []).filter((doctor) => {
      const matchesDepartment = departmentId ? doctor.department_id === departmentId : true
      if (!matchesDepartment) return false
      if (!term) return true
      return [doctor.profile?.full_name, doctor.specialization, doctor.department?.name]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(term))
    })
  }, [doctorsQuery.data, departmentId, search])

  const hasFilters = Boolean(search.trim() || departmentId)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Find a doctor"
        subtitle="Search by name, specialization or department, then pick a free slot."
      />

      <div className="rounded-2xl bg-surface p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search doctors or specializations"
              className="pl-9"
              aria-label="Search doctors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger className="w-full md:w-52" aria-label="Filter by department">
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-muted" />
                  <SelectValue placeholder="All departments" />
                </span>
              </SelectTrigger>
              <SelectContent>
                {(departmentsQuery.data ?? []).map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setDepartmentId('')
                }}
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          {filtered.length} {pluralize(filtered.length, 'doctor')} found
        </p>
      </div>

      {doctorsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl bg-surface p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="mt-4 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-4/5" />
            </div>
          ))}
        </div>
      ) : doctorsQuery.isError ? (
        <ErrorState
          message={getErrorMessage(doctorsQuery.error)}
          onRetry={() => void doctorsQuery.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors match your search"
          description="Try a different name, specialization or department."
          actionLabel="Clear filters"
          onAction={() => {
            setSearch('')
            setDepartmentId('')
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  )
}
