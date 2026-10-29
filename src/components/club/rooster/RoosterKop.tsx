import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { WeekCijfers } from '@/lib/club/rooster/raster'
import { roosterHref, type RoosterStaat } from '@/lib/club/rooster/url'
import { CijferStrook, CijferTegel } from '@/components/club/ontwerp/CijferTegel'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { ONTWERP } from '@/lib/aiyourgym/taal/woorden/club/ontwerp'
import { ROOSTER } from '@/lib/aiyourgym/taal/woorden/club/rooster'

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

export async function RoosterKop({ vestigingNaam, weekNummer, weekLabel, vorige, volgende, isDezeWeek, staat }: KopProps) {
  const t = await clubTekst(ROOSTER)
  return (
    <header className="club-paginakop">
      <div>
        <p className="club-boventitel">{t.boventitel(vestigingNaam)}</p>
        <h1>
          {t.titel} <span className="club-rooster-weeknr">{t.week(weekNummer)}</span>
        </h1>
        <p>{weekLabel}</p>
      </div>
      <nav className="club-rooster-bladeren" aria-label={t.weekKiezen}>
        <Link href={roosterHref(staat, { week: vorige, les: null })} className="club-knop club-knop--klein" aria-label={t.vorigeWeek} scroll={false}>
          <ChevronLeft aria-hidden size={16} />
        </Link>
        <Link
          href={roosterHref(staat, { week: null, les: null })}
          className="club-knop club-knop--klein"
          aria-current={isDezeWeek ? 'page' : undefined}
          scroll={false}
        >
          {t.dezeWeek}
        </Link>
        <Link href={roosterHref(staat, { week: volgende, les: null })} className="club-knop club-knop--klein" aria-label={t.volgendeWeek} scroll={false}>
          <ChevronRight aria-hidden size={16} />
        </Link>
      </nav>
    </header>
  )
}

export async function RoosterTegels({ cijfers }: { cijfers: WeekCijfers }) {
  const w = (await clubTekst(ONTWERP)).rooster
  const t = (await clubTekst(ROOSTER)).tegels
  const bezetting = cijfers.gemiddeldeBezetting
  return (
    <CijferStrook label={t.label}>
      <CijferTegel label={t.lessen} waarde={String(cijfers.lessen)} sub={cijfers.geannuleerd > 0 ? t.nietDoor(cijfers.geannuleerd) : t.allesDoor} />
      <CijferTegel
        label={t.bezetting}
        waarde={bezetting === null ? '' : `${Math.round(bezetting * 100)}`}
        eenheid="%"
        leeg={bezetting === null}
        meter={bezetting === null ? null : { deel: bezetting, label: w.bezettingLabel }}
        sub={t.bezettingSub}
      />
      <CijferTegel
        label={t.wachtlijst}
        waarde={String(cijfers.wachtlijst)}
        verschil={cijfers.wachtlijst > 0 ? { tekst: t.vraagGroter, oordeel: 'slechter' } : null}
        sub={cijfers.wachtlijst > 0 ? undefined : t.niemandWacht}
      />
      <CijferTegel label={t.noShows} waarde={String(cijfers.noShows)} sub={t.noShowsSub} />
    </CijferStrook>
  )
}
