import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { isoWeek, plusDagen, weekParam } from '@/lib/club/rooster/tijd'
import { personeelHref, TAB_LABEL, TABBLADEN, zonderPaneel, type PersoneelStaat } from '@/lib/club/personeel/url'
import { dagMaandLang } from './weergave'

// Kop van het personeelsrooster: titel, tabbladen en (bij het weekrooster en
// mijn diensten) bladeren per week.

interface Props {
  staat: PersoneelStaat
  vestigingNaam: string
  maandag: string
  vandaag: string
  /** Toon het tabblad Uren (alleen voor wie uren beheert). */
  metUren: boolean
}

function weekLabel(maandag: string): string {
  const zondag = plusDagen(maandag, 6)
  return `${dagMaandLang(maandag)} tot ${dagMaandLang(zondag)} ${zondag.slice(0, 4)}`
}

export function PersoneelKop({ staat, vestigingNaam, maandag, vandaag, metUren }: Props) {
  const basis = zonderPaneel(staat)
  const toontWeek = staat.tab === 'week'
  const isDezeWeek = vandaag >= maandag && vandaag <= plusDagen(maandag, 6)
  return (
    <header className="club-personeel-kop">
      <div className="club-paginakop">
        <div>
          <p className="club-boventitel">{vestigingNaam} · Fitnesspersoneel</p>
          <h1>
            Personeel {toontWeek && <span className="club-personeel-weeknr">Week {isoWeek(maandag).week}</span>}
          </h1>
          {toontWeek && <p>{weekLabel(maandag)}</p>}
        </div>
        {toontWeek && (
          <nav className="club-personeel-bladeren" aria-label="Week kiezen">
            <Link href={personeelHref(basis, { week: weekParam(plusDagen(maandag, -7)) })} className="club-knop club-knop--klein" aria-label="Vorige week" scroll={false}>
              <ChevronLeft aria-hidden size={16} />
            </Link>
            <Link href={personeelHref(basis, { week: null })} className="club-knop club-knop--klein" aria-current={isDezeWeek ? 'page' : undefined} scroll={false}>
              Deze week
            </Link>
            <Link href={personeelHref(basis, { week: weekParam(plusDagen(maandag, 7)) })} className="club-knop club-knop--klein" aria-label="Volgende week" scroll={false}>
              <ChevronRight aria-hidden size={16} />
            </Link>
          </nav>
        )}
      </div>
      <nav className="club-segment club-personeel-tabs" aria-label="Onderdeel van personeel">
        {TABBLADEN.filter((tab) => metUren || tab !== 'uren').map((tab) => (
          <Link key={tab} href={personeelHref(basis, { tab, mw: null })} aria-current={staat.tab === tab ? 'page' : undefined} scroll={false}>
            {TAB_LABEL[tab]}
          </Link>
        ))}
      </nav>
    </header>
  )
}
