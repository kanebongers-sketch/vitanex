import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { WeekCijfers } from '@/lib/club/rooster/raster'
import { roosterHref, type RoosterStaat } from '@/lib/club/rooster/url'
import { CijferStrook, CijferTegel } from '@/components/club/ontwerp/CijferTegel'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { ONTWERP } from '@/lib/aiyourgym/taal/woorden/club/ontwerp'

// Kop van het rooster: de week, bladeren, en de vier cijfers die ertoe doen.

interface KopProps {
  vestigingNaam: string
  weekNummer: number
  weekLabel: string
  vorige: string
  volgende: string
  isDezeWeek: boolean
  staat: RoosterStaat
}

export function RoosterKop({ vestigingNaam, weekNummer, weekLabel, vorige, volgende, isDezeWeek, staat }: KopProps) {
  return (
    <header className="club-paginakop">
      <div>
        <p className="club-boventitel">{vestigingNaam} · Groepslessen</p>
        <h1>
          Rooster <span className="club-rooster-weeknr">Week {weekNummer}</span>
        </h1>
        <p>{weekLabel}</p>
      </div>
      <nav className="club-rooster-bladeren" aria-label="Week kiezen">
        <Link href={roosterHref(staat, { week: vorige, les: null })} className="club-knop club-knop--klein" aria-label="Vorige week" scroll={false}>
          <ChevronLeft aria-hidden size={16} />
        </Link>
        <Link
          href={roosterHref(staat, { week: null, les: null })}
          className="club-knop club-knop--klein"
          aria-current={isDezeWeek ? 'page' : undefined}
          scroll={false}
        >
          Deze week
        </Link>
        <Link href={roosterHref(staat, { week: volgende, les: null })} className="club-knop club-knop--klein" aria-label="Volgende week" scroll={false}>
          <ChevronRight aria-hidden size={16} />
        </Link>
      </nav>
    </header>
  )
}

export async function RoosterTegels({ cijfers }: { cijfers: WeekCijfers }) {
  const w = (await clubTekst(ONTWERP)).rooster
  const bezetting = cijfers.gemiddeldeBezetting
  return (
    <CijferStrook label="Deze week in cijfers">
      <CijferTegel label="Lessen" waarde={String(cijfers.lessen)} sub={cijfers.geannuleerd > 0 ? `${cijfers.geannuleerd} gaan niet door` : 'Alles gaat door'} />
      <CijferTegel
        label="Gem. bezetting"
        waarde={bezetting === null ? '' : `${Math.round(bezetting * 100)}`}
        eenheid="%"
        leeg={bezetting === null}
        meter={bezetting === null ? null : { deel: bezetting, label: w.bezettingLabel }}
        sub="Geboekte plekken van de capaciteit"
      />
      <CijferTegel
        label="Wachtlijst"
        waarde={String(cijfers.wachtlijst)}
        verschil={cijfers.wachtlijst > 0 ? { tekst: 'Vraag groter dan aanbod', oordeel: 'slechter' } : null}
        sub={cijfers.wachtlijst > 0 ? undefined : 'Niemand wacht'}
      />
      <CijferTegel label="No-shows" waarde={String(cijfers.noShows)} sub="Afgevinkt als niet gekomen" />
    </CijferStrook>
  )
}
