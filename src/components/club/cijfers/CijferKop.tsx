import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Bereik } from '@/lib/club/cijfers/periode'
import { maandenReeks, maandNaam, maandVan, plusMaanden, vensterNaam, VROEGSTE_MAAND, type Maand, type MaandVenster } from '@/lib/club/cijfers/maand'
import { dagLang } from '@/lib/club/cijfers/tijd'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
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
}

/** Zoveel maanden terug staan in de keuzelijst. */
const KEUZE_MAANDEN = 36

function hoofdletter(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export function CijferKop({ vestiging, vestigingNaam, aantalVestigingen, maand, bereik, venster, vandaag }: Props) {
  const nu = maandVan(vandaag)
  const pad = (m: Maand, b: Bereik) => clubPad('/cijfers', vestiging, { maand: m, ...(b === 'alle' ? { bereik: 'alle' } : {}) })
  const vorige = plusMaanden(maand, -1)
  const volgende = plusMaanden(maand, 1)
  const reeks = maandenReeks(nu, KEUZE_MAANDEN).filter((m) => m >= VROEGSTE_MAAND)
  const maanden = reeks.includes(maand) ? reeks : [maand, ...reeks]
  const opties: MaandOptie[] = [...maanden].sort().reverse().map((m) => ({ maand: m, label: hoofdletter(maandNaam(m)), href: pad(m, bereik) }))
  return (
    <header className="club-cijfers-kop">
      <div>
        <p className="club-boventitel">{bereik === 'alle' ? (aantalVestigingen === 1 ? 'De vestiging' : `Alle ${aantalVestigingen} vestigingen`) : vestigingNaam} · maandrapport</p>
        <h1 className="club-cijfers-titel">{maandNaam(maand)}</h1>
        <p className="club-cijfers-periode">
          {venster.lopend ? (
            <>
              <span className="club-chip club-chip--merk">Lopende maand</span> {vensterNaam(venster)}, tot en met vandaag ({dagLang(vandaag)})
            </>
          ) : (
            <>Hele maand: 1 tot en met {venster.maandDagen} {maandNaam(maand)}</>
          )}
        </p>
      </div>
      <nav className="club-cijfers-keuzes" aria-label="Maand en bereik">
        <div className="club-cijfers-maandnav" role="group" aria-label="Maand">
          {vorige >= VROEGSTE_MAAND ? (
            <Link className="club-knop club-knop--stil" href={pad(vorige, bereik)} scroll={false} aria-label={`Vorige maand: ${maandNaam(vorige)}`}>
              <ChevronLeft aria-hidden size={18} />
            </Link>
          ) : null}
          <MaandKiezer opties={opties} gekozen={maand} />
          {volgende <= nu ? (
            <Link className="club-knop club-knop--stil" href={pad(volgende, bereik)} scroll={false} aria-label={`Volgende maand: ${maandNaam(volgende)}`}>
              <ChevronRight aria-hidden size={18} />
            </Link>
          ) : (
            <span className="club-knop club-knop--stil club-cijfers-uit" aria-hidden>
              <ChevronRight size={18} />
            </span>
          )}
          {maand !== nu && (
            <Link className="club-knop club-knop--stil club-knop--klein" href={pad(nu, bereik)} scroll={false}>
              Deze maand
            </Link>
          )}
        </div>
        <div className="club-segment" role="group" aria-label="Bereik">
          <Link href={pad(maand, 'vestiging')} aria-current={bereik === 'vestiging' ? 'page' : undefined} scroll={false}>
            {vestigingNaam}
          </Link>
          <Link href={pad(maand, 'alle')} aria-current={bereik === 'alle' ? 'page' : undefined} scroll={false}>
            Alle vestigingen
          </Link>
        </div>
      </nav>
    </header>
  )
}
