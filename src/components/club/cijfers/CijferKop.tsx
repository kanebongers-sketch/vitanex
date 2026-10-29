import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Bereik } from '@/lib/club/cijfers/periode'
import { maandenReeks, maandNaam, maandVan, plusMaanden, vensterNaam, VROEGSTE_MAAND, type Maand, type MaandVenster } from '@/lib/club/cijfers/maand'
import { dagLang } from '@/lib/club/cijfers/tijd'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { CIJFERS } from '@/lib/aiyourgym/taal/woorden/club/cijfers'
import { MaandKiezer, type MaandOptie } from './MaandKiezer'

// Kop van Cijfers: de gekozen kalendermaand groot, vorige en volgende maand,
// een keuzelijst en het bereik. Alles staat in de URL (?maand=2026-10).

interface Props {
  vestiging: Vestiging
  vestigingNaam: string
  /** Hoeveel vestigingen de sportschool heeft (voor "Alle 8 vestigingen"). */
  aantalVestigingen: number
  maand: Maand
  bereik: Bereik
  venster: MaandVenster
  vandaag: string
  taal: Taal
}

/** Zoveel maanden terug staan in de keuzelijst. */
const KEUZE_MAANDEN = 36

function hoofdletter(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export function CijferKop({ vestiging, vestigingNaam, aantalVestigingen, maand, bereik, venster, vandaag, taal }: Props) {
  const t = CIJFERS[taal].kop
  const nu = maandVan(vandaag)
  const pad = (m: Maand, b: Bereik) => clubPad('/cijfers', vestiging, { maand: m, ...(b === 'alle' ? { bereik: 'alle' } : {}) })
  const vorige = plusMaanden(maand, -1)
  const volgende = plusMaanden(maand, 1)
  const reeks = maandenReeks(nu, KEUZE_MAANDEN).filter((m) => m >= VROEGSTE_MAAND)
  const maanden = reeks.includes(maand) ? reeks : [maand, ...reeks]
  const opties: MaandOptie[] = [...maanden].sort().reverse().map((m) => ({ maand: m, label: hoofdletter(maandNaam(m, taal)), href: pad(m, bereik) }))
  const boven = bereik === 'alle' ? (aantalVestigingen === 1 ? t.deVestiging : t.alleN(aantalVestigingen)) : vestigingNaam
  return (
    <header className="club-cijfers-kop">
      <div>
        <p className="club-boventitel">{`${boven} · ${t.maandrapport}`}</p>
        <h1 className="club-cijfers-titel">{maandNaam(maand, taal)}</h1>
        <p className="club-cijfers-periode">
          {venster.lopend ? (
            <>
              <span className="club-chip club-chip--merk">{t.lopend}</span> {t.totVandaag(vensterNaam(venster, taal), dagLang(vandaag, taal))}
            </>
          ) : (
            t.heleMaand(venster.maandDagen, maandNaam(maand, taal))
          )}
        </p>
      </div>
      <nav className="club-cijfers-keuzes" aria-label={t.keuzes}>
        <div className="club-cijfers-maandnav" role="group" aria-label={t.maand}>
          {vorige >= VROEGSTE_MAAND ? (
            <Link className="club-knop club-knop--stil" href={pad(vorige, bereik)} scroll={false} aria-label={t.vorige(maandNaam(vorige, taal))}>
              <ChevronLeft aria-hidden size={18} />
            </Link>
          ) : null}
          <MaandKiezer opties={opties} gekozen={maand} label={t.kiesMaand} />
          {volgende <= nu ? (
            <Link className="club-knop club-knop--stil" href={pad(volgende, bereik)} scroll={false} aria-label={t.volgende(maandNaam(volgende, taal))}>
              <ChevronRight aria-hidden size={18} />
            </Link>
          ) : (
            <span className="club-knop club-knop--stil club-cijfers-uit" aria-hidden>
              <ChevronRight size={18} />
            </span>
          )}
          {maand !== nu && (
            <Link className="club-knop club-knop--stil club-knop--klein" href={pad(nu, bereik)} scroll={false}>
              {t.dezeMaand}
            </Link>
          )}
        </div>
        <div className="club-segment" role="group" aria-label={t.bereik}>
          <Link href={pad(maand, 'vestiging')} aria-current={bereik === 'vestiging' ? 'page' : undefined} scroll={false}>
            {vestigingNaam}
          </Link>
          <Link href={pad(maand, 'alle')} aria-current={bereik === 'alle' ? 'page' : undefined} scroll={false}>
            {t.alleVestigingen}
          </Link>
        </div>
      </nav>
    </header>
  )
}
