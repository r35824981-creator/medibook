import { Link } from 'react-router-dom'
import { CalendarPlus, Stethoscope } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { initials, formatInr } from '@/lib/utils'
import type { DoctorListItem } from '@/types'

export function DoctorCard({ doctor }: { doctor: DoctorListItem }) {
  const name = doctor.profile?.full_name ?? 'Doctor'

  return (
    <div className="flex flex-col rounded-2xl bg-surface p-5">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 rounded-xl">
          {doctor.photo_url ? <AvatarImage src={doctor.photo_url} alt={name} /> : null}
          <AvatarFallback className="rounded-xl">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{name}</p>
          <p className="truncate text-xs text-muted">{doctor.specialization}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted">
            {doctor.department?.name ?? 'General'}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
          {formatInr(doctor.fees)}
        </span>
      </div>

      <p className="mt-4 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-muted">
        {doctor.bio || 'Available for consultation at the hospital.'}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <Stethoscope className="h-3.5 w-3.5" />
          {doctor.is_active ? 'Accepting patients' : 'Not available'}
        </span>
        <Button asChild size="sm" disabled={!doctor.is_active}>
          <Link to={`/patient/book/${doctor.id}`}>
            <CalendarPlus className="h-3.5 w-3.5" />
            Book
          </Link>
        </Button>
      </div>
    </div>
  )
}
