import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { GRENS_RISICO } from '@/lib/club/leden/behoud'
import { RISICO_ZICHTBAAR } from '@/lib/club/cijfers/haal-vandaag'
import { aantal } from '@/lib/club/cijfers/opmaak'
import { wegTekst, type RisicoLid } from '@/lib/club/cijfers/risico'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { initialen } from '@/lib/club/kern/lid'

// Leden met risico: dezelfde lijst en hetzelfde aantal als de ledenlijst met
// het filter "risico" (behoudsscore onder 45, bezoek op alle vestigingen).
// Meest urgent bovenaan, met in een zin waarom, en een klik naar de ledenkaart.

interface Props {
  leden: RisicoLid[]
  laatsteOoit: ReadonlyMap<string, Date | null>
  vandaag: string
  vestiging: Vestiging
}

function redenZonderBezoek(weg: string, noShows: number): string {
  return noShows > 0 ? `${weg}. ${noShows}x niet gekomen bij een geboekte les` : weg
}

function Rij({ r, laatsteOoit, vandaag, vestiging }: { r: RisicoLid; laatsteOoit: ReadonlyMap<string, Date | null>; vandaag: string; vestiging: Vestiging }) {
  const { lid, behoud } = r
  const weg = wegTekst(behoud.dagenSinds, laatsteOoit.get(lid.id), lid.lidSinds, vandaag)
  // Zonder bezoek in 12 weken zegt "hoe lang weg" meer dan de standaardzin van de score.
  const reden = weg.getal === null && behoud.dagenSinds === null ? redenZonderBezoek(weg.tekst, behoud.noShows) : behoud.uitleg
  return (
    <li>
      <Link href={clubPad(`/leden/${lid.id}`, vestiging)} className="club-rij club-vandaag-rijlink club-vandaag-risicorij">
        <span className="club-avatar" aria-hidden>
          {initialen(lid)}
        </span>
        <span className="club-rij-hoofd">
          <span className="club-rij-titel">
            {lid.voornaam} {lid.achternaam}
          </span>
          <span className="club-vandaag-reden">{reden}.</span>
        </span>
        <span className="club-vandaag-weg">
          {weg.getal !== null && (
            <span>
              <strong className="club-getal">{weg.getal}</strong> {weg.tekst}
            </span>
          )}
          <span className="club-vandaag-score" title="Behoudsscore van 0 tot 100">
            score <span className="club-getal">{behoud.score}</span>
          </span>
        </span>
      </Link>
    </li>
  )
}

export function RisicoLeden({ leden, laatsteOoit, vandaag, vestiging }: Props) {
  const lijstPad = clubPad('/leden', vestiging, { risico: '1', sort: 'behoud' })
  const rest = leden.length - RISICO_ZICHTBAAR
  return (
    <section className="club-kaart club-vandaag-kaart" aria-labelledby="vandaag-risico">
      <header className="club-sectiekop club-vandaag-sectiekop">
        <h2 id="vandaag-risico">
          Leden met risico <span className="club-vandaag-telling club-getal">{leden.length}</span>
        </h2>
        <Link href={lijstPad} className="club-vandaag-meer">
          In de ledenlijst <ArrowUpRight aria-hidden size={14} />
        </Link>
      </header>
      <p className="club-hint club-vandaag-uitleg">
        Behoudsscore onder {GRENS_RISICO}: bezoek, trend en no-shows op alle vestigingen. Laagste score bovenaan.
      </p>
      {leden.length === 0 ? (
        <p className="club-leeg">Niemand heeft een behoudsscore onder {GRENS_RISICO}.</p>
      ) : (
        <ul className="club-lijst club-vandaag-lijst">
          {leden.slice(0, RISICO_ZICHTBAAR).map((r) => (
            <Rij key={r.lid.id} r={r} laatsteOoit={laatsteOoit} vandaag={vandaag} vestiging={vestiging} />
          ))}
        </ul>
      )}
      {rest > 0 && (
        <p className="club-vandaag-voet">
          <Link href={lijstPad} className="club-vandaag-meer">
            En nog {aantal(rest, 'lid', 'leden')} met risico <ArrowUpRight aria-hidden size={14} />
          </Link>
        </p>
      )}
    </section>
  )
}
