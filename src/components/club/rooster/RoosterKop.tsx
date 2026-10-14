import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { WeekCijfers } from '@/lib/club/rooster/raster'
import { roosterHref, type RoosterStaat } from '@/lib/club/rooster/url'

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

export function RoosterTegels({ cijfers }: { cijfers: WeekCijfers }) {
  const bezetting = cijfers.gemiddeldeBezetting === null ? 'n.v.t.' : `${Math.round(cijfers.gemiddeldeBezetting * 100)}%`
  return (
    <section className="club-tegels" aria-label="Deze week in cijfers">
      <div className="club-tegel">
        <span className="club-tegel-label">Lessen</span>
        <span className="club-tegel-getal">{cijfers.lessen}</span>
        <span className="club-tegel-sub">{cijfers.geannuleerd > 0 ? `${cijfers.geannuleerd} gaan niet door` : 'Alles gaat door'}</span>
      </div>
      <div className="club-tegel">
        <span className="club-tegel-label">Gem. bezetting</span>
        <span className="club-tegel-getal">{bezetting}</span>
        <span className="club-tegel-sub">Geboekte plekken van de capaciteit</span>
      </div>
      <div className="club-tegel">
        <span className="club-tegel-label">Wachtlijst</span>
        <span className="club-tegel-getal">{cijfers.wachtlijst}</span>
        <span className="club-tegel-sub">{cijfers.wachtlijst > 0 ? <span className="club-min">Vraag groter dan aanbod</span> : 'Niemand wacht'}</span>
      </div>
      <div className="club-tegel">
        <span className="club-tegel-label">No-shows</span>
        <span className="club-tegel-getal">{cijfers.noShows}</span>
        <span className="club-tegel-sub">Afgevinkt als niet gekomen</span>
      </div>
    </section>
  )
}
