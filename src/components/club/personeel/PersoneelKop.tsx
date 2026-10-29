import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { isoWeek, plusDagen, weekParam } from '@/lib/club/rooster/tijd'
import { personeelHref, TABBLADEN, zonderPaneel, type PersoneelStaat } from '@/lib/club/personeel/url'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'
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

function weekLabel(maandag: string, taal: Taal): string {
  const zondag = plusDagen(maandag, 6)
  return PERSONEEL[taal].kop.weekBereik(dagMaandLang(maandag, taal), dagMaandLang(zondag, taal), zondag.slice(0, 4))
}

export async function PersoneelKop({ staat, vestigingNaam, maandag, vandaag, metUren }: Props) {
  const taal = await getTaal()
  const tk = await clubTekst(PERSONEEL)
  const basis = zonderPaneel(staat)
  const toontWeek = staat.tab === 'week'
  const isDezeWeek = vandaag >= maandag && vandaag <= plusDagen(maandag, 6)
  return (
    <header className="club-personeel-kop">
      <div className="club-paginakop">
        <div>
          <p className="club-boventitel">{tk.kop.boventitel(vestigingNaam)}</p>
          <h1>
            {tk.kop.titel} {toontWeek && <span className="club-personeel-weeknr">{tk.kop.week(isoWeek(maandag).week)}</span>}
          </h1>
          {toontWeek && <p>{weekLabel(maandag, taal)}</p>}
        </div>
        {toontWeek && (
          <nav className="club-personeel-bladeren" aria-label={tk.kop.weekKiezen}>
            <Link href={personeelHref(basis, { week: weekParam(plusDagen(maandag, -7)) })} className="club-knop club-knop--klein" aria-label={tk.kop.vorigeWeek} scroll={false}>
              <ChevronLeft aria-hidden size={16} />
            </Link>
            <Link href={personeelHref(basis, { week: null })} className="club-knop club-knop--klein" aria-current={isDezeWeek ? 'page' : undefined} scroll={false}>
              {tk.kop.dezeWeek}
            </Link>
            <Link href={personeelHref(basis, { week: weekParam(plusDagen(maandag, 7)) })} className="club-knop club-knop--klein" aria-label={tk.kop.volgendeWeek} scroll={false}>
              <ChevronRight aria-hidden size={16} />
            </Link>
          </nav>
        )}
      </div>
      <nav className="club-segment club-personeel-tabs" aria-label={tk.kop.tabs}>
        {TABBLADEN.filter((tab) => metUren || tab !== 'uren').map((tab) => (
          <Link key={tab} href={personeelHref(basis, { tab, mw: null })} aria-current={staat.tab === tab ? 'page' : undefined} scroll={false}>
            {tk.labels.tab[tab]}
          </Link>
        ))}
      </nav>
    </header>
  )
}
