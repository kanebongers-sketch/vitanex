import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Weergave } from '@/lib/club/afspraken/weergave'
import type { Tellers } from '@/lib/club/afspraken/weergave'
import type { Persoon } from './AfspraakFormulier'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { AFSPRAKEN } from '@/lib/aiyourgym/taal/woorden/club/afspraken'

// De navigatie boven de agenda: week of dag, vorige en volgende, de trainer
// en de tellers. Alles zijn gewone links: de keuze staat in de URL.


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

export async function AfsprakenNav({ weergave, periode, href, vorige, volgende, isNu, trainers, filterTrainer, tellers }: Props) {
  const taal = await getTaal()
  const t = AFSPRAKEN[taal].nav
  const kort = (d: string) => formatDatum(`${d}T12:00:00Z`, taal, 'dagMaand')
  const sleutel = weergave === 'week' ? 'week' : 'dag'
  return (
    <div className="club-afspraken-nav">
      <div className="club-afspraken-navrij">
        <nav className="club-segment" aria-label={t.weergave}>
          <Link href={href({ weergave: null, dag: null })} aria-current={weergave === 'week' ? 'page' : undefined}>{t.week}</Link>
          <Link href={href({ weergave: 'dag', week: null })} aria-current={weergave === 'dag' ? 'page' : undefined}>{t.dag}</Link>
        </nav>
        <nav className="club-afspraken-bladeren" aria-label={weergave === 'week' ? t.weekKiezen : t.dagKiezen}>
          <Link className="club-knop club-knop--klein" href={href({ [sleutel]: vorige })} aria-label={weergave === 'week' ? t.vorigeWeek : t.vorigeDag}><ChevronLeft size={16} aria-hidden /></Link>
          <span className="club-afspraken-periode">
            {weergave === 'week' ? t.bereik(kort(periode.begin), kort(periode.eind)) : formatDatum(`${periode.begin}T12:00:00Z`, taal, 'dag')}
          </span>
          <Link className="club-knop club-knop--klein" href={href({ [sleutel]: volgende })} aria-label={weergave === 'week' ? t.volgendeWeek : t.volgendeDag}><ChevronRight size={16} aria-hidden /></Link>
          {isNu ? null : <Link className="club-knop club-knop--klein" href={href({ week: null, dag: null })}>{weergave === 'week' ? t.dezeWeek : t.vandaag}</Link>}
        </nav>
      </div>
      {trainers.length > 1 ? (
        <nav className="club-afspraken-trainers" aria-label={t.trainerKiezen}>
          <Link href={href({ trainer: null })} aria-current={filterTrainer === null ? 'page' : undefined}>{t.alleTrainers}</Link>
          {trainers.map((m) => (
            <Link key={m.id} href={href({ trainer: m.id })} aria-current={filterTrainer === m.id ? 'page' : undefined}>{m.naam}</Link>
          ))}
        </nav>
      ) : null}
      <dl className="club-afspraken-tellers">
        <div><dt>{t.gepland}</dt><dd>{tellers.gepland}</dd></div>
        <div><dt>{t.geweest}</dt><dd>{tellers.geweest}</dd></div>
        <div><dt>{t.nietGekomen}</dt><dd>{tellers.niet_gekomen}</dd></div>
        <div><dt>{t.opkomst}</dt><dd>{tellers.opkomst === null ? t.nogNiet : `${tellers.opkomst}%`}</dd></div>
      </dl>
    </div>
  )
}
