import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { GRENS_RISICO, behoudUitleg } from '@/lib/club/leden/behoud'
import { RISICO_ZICHTBAAR } from '@/lib/club/cijfers/haal-vandaag'
import { wegTekst, type RisicoLid } from '@/lib/club/cijfers/risico'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { lidKaartPad } from '@/lib/club/leden/hub/tabs'
import { initialen } from '@/lib/club/kern/lid'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { VANDAAG } from '@/lib/aiyourgym/taal/woorden/club/vandaag-scherm'
import { Avatar } from '@/components/club/ontwerp/Avatar'
import { BehoudOpbouw } from './BehoudOpbouw'

// Leden met risico: dezelfde lijst en hetzelfde aantal als de ledenlijst met
// het filter "risico" (behoudsscore onder 45, bezoek op alle vestigingen).
// Meest urgent bovenaan, met in een zin waarom, de opbouw van de score als
// korte balkjes (vaste rekenregel, geen AI) en een klik naar de ledenkaart.

interface Props {
  leden: RisicoLid[]
  laatsteOoit: ReadonlyMap<string, Date | null>
  vandaag: string
  vestiging: Vestiging
}

function redenZonderBezoek(weg: string, noShows: number, taal: Taal): string {
  return noShows > 0 ? `${weg}. ${VANDAAG[taal].risico.noShows(noShows)}` : weg
}

function Rij({ r, laatsteOoit, vandaag, vestiging, taal }: { r: RisicoLid; laatsteOoit: ReadonlyMap<string, Date | null>; vandaag: string; vestiging: Vestiging; taal: Taal }) {
  const { lid, behoud } = r
  const t = VANDAAG[taal].risico
  const weg = wegTekst(behoud.dagenSinds, laatsteOoit.get(lid.id), lid.lidSinds, vandaag, taal)
  // Zonder bezoek in 12 weken zegt "hoe lang weg" meer dan de standaardzin van de score.
  const reden = weg.getal === null && behoud.dagenSinds === null ? redenZonderBezoek(weg.tekst, behoud.noShows, taal) : behoudUitleg(behoud, taal)
  return (
    <li>
      <Link href={lidKaartPad(lid.id, vestiging)} className="club-rij club-vandaag-rijlink club-vandaag-risicorij">
        <Avatar naam={`${lid.voornaam} ${lid.achternaam}`} initialen={initialen(lid)} foto={{ soort: 'lid', id: lid.id, versie: lid.foto }} />
        <span className="club-rij-hoofd">
          <span className="club-rij-titel">
            {lid.voornaam} {lid.achternaam}
          </span>
          <span className="club-vandaag-reden">{reden}.</span>
          <BehoudOpbouw behoud={behoud} taal={taal} />
        </span>
        <span className="club-vandaag-weg">
          {weg.getal !== null && (
            <span>
              <strong className="club-getal">{weg.getal}</strong> {weg.tekst}
            </span>
          )}
          <span className="club-vandaag-score" title={t.scoreUitleg}>
            {t.score} <span className="club-getal">{behoud.score}</span>
          </span>
        </span>
      </Link>
    </li>
  )
}

export async function RisicoLeden({ leden, laatsteOoit, vandaag, vestiging }: Props) {
  const taal = await getTaal()
  const t = VANDAAG[taal].risico
  const lijstPad = clubPad('/leden', vestiging, { risico: '1', sort: 'behoud' })
  const rest = leden.length - RISICO_ZICHTBAAR
  return (
    <section className="club-kaart club-vandaag-kaart" aria-labelledby="vandaag-risico">
      <header className="club-sectiekop club-vandaag-sectiekop">
        <h2 id="vandaag-risico">
          {t.titel} <span className="club-vandaag-telling club-getal">{leden.length}</span>
        </h2>
        <Link href={lijstPad} className="club-vandaag-meer">
          {t.inLijst} <ArrowUpRight aria-hidden size={14} />
        </Link>
      </header>
      <p className="club-hint club-vandaag-uitleg">
        {t.uitleg(GRENS_RISICO)}
      </p>
      {leden.length === 0 ? (
        <p className="club-leeg">{t.leeg(GRENS_RISICO)}</p>
      ) : (
        <ul className="club-lijst club-vandaag-lijst">
          {leden.slice(0, RISICO_ZICHTBAAR).map((r) => (
            <Rij key={r.lid.id} r={r} laatsteOoit={laatsteOoit} vandaag={vandaag} vestiging={vestiging} taal={taal} />
          ))}
        </ul>
      )}
      {rest > 0 && (
        <p className="club-vandaag-voet">
          <Link href={lijstPad} className="club-vandaag-meer">
            {t.enNog(rest)} <ArrowUpRight aria-hidden size={14} />
          </Link>
        </p>
      )}
    </section>
  )
}
