import Link from 'next/link'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { TAKEN_WEERGAVEN, WEERGAVE_LABEL, takenHref, type TakenWeergave } from '@/lib/club/taken/url'

// Kop van de takenpagina's: titel, de vier weergaven en (waar het telt) bladeren per week.

interface KopProps {
  vestiging: Vestiging
  vestigingNaam: string
  weergave: TakenWeergave
  titel: ReactNode
  sub?: ReactNode
  /** Rechts in de kop: bladeren, afdrukken. */
  children?: ReactNode
}

export function TakenKop({ vestiging, vestigingNaam, weergave, titel, sub, children }: KopProps) {
  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{vestigingNaam} · Taken en poetslijsten</p>
          <h1>{titel}</h1>
          {sub && <p>{sub}</p>}
        </div>
        {children && <div className="club-taken-kopacties club-taken-print-weg">{children}</div>}
      </header>
      <nav className="club-segment club-taken-weergaven club-taken-print-weg" aria-label="Weergave van de taken">
        {TAKEN_WEERGAVEN.map((w) => (
          <Link key={w || 'week'} href={takenHref(w, vestiging)} aria-current={w === weergave ? 'page' : undefined}>
            {WEERGAVE_LABEL[w]}
          </Link>
        ))}
      </nav>
    </>
  )
}

interface BladerProps {
  weergave: TakenWeergave
  vestiging: Vestiging
  vorige: string
  volgende: string
  isDezeWeek: boolean
}

export function WeekBladeren({ weergave, vestiging, vorige, volgende, isDezeWeek }: BladerProps) {
  return (
    <nav className="club-taken-bladeren" aria-label="Week kiezen">
      <Link href={takenHref(weergave, vestiging, vorige)} className="club-knop club-knop--klein" aria-label="Vorige week" scroll={false}>
        <ChevronLeft aria-hidden size={16} />
      </Link>
      <Link href={takenHref(weergave, vestiging)} className="club-knop club-knop--klein" aria-current={isDezeWeek ? 'page' : undefined} scroll={false}>
        Deze week
      </Link>
      <Link href={takenHref(weergave, vestiging, volgende)} className="club-knop club-knop--klein" aria-label="Volgende week" scroll={false}>
        <ChevronRight aria-hidden size={16} />
      </Link>
    </nav>
  )
}
