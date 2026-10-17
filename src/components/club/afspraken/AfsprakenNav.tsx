import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Weergave } from '@/lib/club/afspraken/weergave'
import type { Tellers } from '@/lib/club/afspraken/weergave'
import type { Persoon } from './AfspraakFormulier'

// De navigatie boven de agenda: week of dag, vorige en volgende, de trainer
// en de tellers. Alles zijn gewone links: de keuze staat in de URL.

const KORT = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const LANG = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const kort = (d: string) => KORT.format(new Date(`${d}T12:00:00Z`))

interface Props {
  weergave: Weergave
  /** Week: de maandag. Dag: de dag. */
  periode: { begin: string; eind: string }
  href: (extra: Record<string, string | null>) => string
  vorige: string
  volgende: string
  isNu: boolean
  trainers: readonly Persoon[]
  filterTrainer: string | null
  tellers: Tellers
}

export function AfsprakenNav({ weergave, periode, href, vorige, volgende, isNu, trainers, filterTrainer, tellers }: Props) {
  const sleutel = weergave === 'week' ? 'week' : 'dag'
  return (
    <div className="club-afspraken-nav">
      <div className="club-afspraken-navrij">
        <nav className="club-segment" aria-label="Weergave">
          <Link href={href({ weergave: null, dag: null })} aria-current={weergave === 'week' ? 'page' : undefined}>Week</Link>
          <Link href={href({ weergave: 'dag', week: null })} aria-current={weergave === 'dag' ? 'page' : undefined}>Dag</Link>
        </nav>
        <nav className="club-afspraken-bladeren" aria-label={weergave === 'week' ? 'Week kiezen' : 'Dag kiezen'}>
          <Link className="club-knop club-knop--klein" href={href({ [sleutel]: vorige })} aria-label={weergave === 'week' ? 'Vorige week' : 'Vorige dag'}><ChevronLeft size={16} aria-hidden /></Link>
          <span className="club-afspraken-periode">
            {weergave === 'week' ? `${kort(periode.begin)} tot ${kort(periode.eind)}` : LANG.format(new Date(`${periode.begin}T12:00:00Z`))}
          </span>
          <Link className="club-knop club-knop--klein" href={href({ [sleutel]: volgende })} aria-label={weergave === 'week' ? 'Volgende week' : 'Volgende dag'}><ChevronRight size={16} aria-hidden /></Link>
          {isNu ? null : <Link className="club-knop club-knop--klein" href={href({ week: null, dag: null })}>{weergave === 'week' ? 'Deze week' : 'Vandaag'}</Link>}
        </nav>
      </div>
      {trainers.length > 1 ? (
        <nav className="club-afspraken-trainers" aria-label="Trainer kiezen">
          <Link href={href({ trainer: null })} aria-current={filterTrainer === null ? 'page' : undefined}>Alle trainers</Link>
          {trainers.map((t) => (
            <Link key={t.id} href={href({ trainer: t.id })} aria-current={filterTrainer === t.id ? 'page' : undefined}>{t.naam}</Link>
          ))}
        </nav>
      ) : null}
      <dl className="club-afspraken-tellers">
        <div><dt>Gepland</dt><dd>{tellers.gepland}</dd></div>
        <div><dt>Geweest</dt><dd>{tellers.geweest}</dd></div>
        <div><dt>Niet gekomen</dt><dd>{tellers.niet_gekomen}</dd></div>
        <div><dt>Opkomst</dt><dd>{tellers.opkomst === null ? 'nog niet' : `${tellers.opkomst}%`}</dd></div>
      </dl>
    </div>
  )
}
