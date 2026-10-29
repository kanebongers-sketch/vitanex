import Link from 'next/link'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { TAKEN_WEERGAVEN, takenHref, weergaveLabel, type TakenWeergave } from '@/lib/club/taken/url'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { TAKEN } from '@/lib/aiyourgym/taal/woorden/club/taken'

// Kop van de takenpagina's: titel, de weergaven (Dag, Week, Overzicht, Beheer) en (waar het telt) bladeren per week.

interface KopProps {
  vestiging: Vestiging
  vestigingNaam: string
  weergave: TakenWeergave
  titel: ReactNode
  sub?: ReactNode
  /** Rechts in de kop: bladeren, afdrukken. */
  children?: ReactNode
}

export async function TakenKop({ vestiging, vestigingNaam, weergave, titel, sub, children }: KopProps) {
  const taal = await getTaal()
  const t = TAKEN[taal].pagina
  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.boventitel(vestigingNaam)}</p>
          <h1>{titel}</h1>
          {sub && <p>{sub}</p>}
        </div>
        {children && <div className="club-taken-kopacties club-taken-print-weg">{children}</div>}
      </header>
      <nav className="club-segment club-taken-weergaven club-taken-print-weg" aria-label={t.weergaven}>
        {TAKEN_WEERGAVEN.map((w) => (
          <Link key={w || 'dag'} href={takenHref(w, vestiging)} aria-current={w === weergave ? 'page' : undefined}>
            {weergaveLabel(w, taal)}
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

export async function WeekBladeren({ weergave, vestiging, vorige, volgende, isDezeWeek }: BladerProps) {
  const t = TAKEN[await getTaal()].pagina
  return (
    <nav className="club-taken-bladeren" aria-label={t.weekKiezen}>
      <Link href={takenHref(weergave, vestiging, vorige)} className="club-knop club-knop--klein" aria-label={t.vorigeWeek} scroll={false}>
        <ChevronLeft aria-hidden size={16} />
      </Link>
      <Link href={takenHref(weergave, vestiging)} className="club-knop club-knop--klein" aria-current={isDezeWeek ? 'page' : undefined} scroll={false}>
        {t.dezeWeek}
      </Link>
      <Link href={takenHref(weergave, vestiging, volgende)} className="club-knop club-knop--klein" aria-label={t.volgendeWeek} scroll={false}>
        <ChevronRight aria-hidden size={16} />
      </Link>
    </nav>
  )
}
