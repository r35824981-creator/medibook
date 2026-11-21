import { useMemo } from 'react'
import { useAppointments } from '@/features/appointments/hooks'
import { buildReport } from '@/features/reports/aggregate'

export function useReportData(rangeDays: number) {
  const query = useAppointments()
  const report = useMemo(
    () => buildReport(query.data ?? [], rangeDays),
    [query.data, rangeDays],
  )

  return { ...query, report }
}
