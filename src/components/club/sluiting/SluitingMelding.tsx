import { CalendarX2 } from 'lucide-react'
import type { KomendeAfwijking } from '@/lib/club/sluiting/regels'
import { soortTekst, wanneer } from '@/lib/club/sluiting/weergave'
import './sluiting.css'

// Een rustige melding als de vestiging vandaag of de komende dagen dicht is of
// andere tijden heeft. Geen regels = niets. Puur (props in, markup uit), dus
// bruikbaar op Club Vandaag en in de ledenapp. Voor de data: SluitingenBinnenkort.

export interface SluitingMeldingProps {
  lijst: readonly KomendeAfwijking[]
  vandaag: string
  /** 'club' voor het personeel, 'app' voor leden (kortere tekst). */
  variant?: 'club' | 'app'
}

function kopTekst(eerste: KomendeAfwijking, vandaag: string, variant: 'club' | 'app'): string {
  if (eerste.datum !== vandaag) return variant === 'app' ? 'Let op: andere openingstijden' : 'Binnenkort dicht of andere tijden'
  return eerste.sluiting.soort === 'gesloten' ? 'Vandaag gesloten' : `Vandaag ${soortTekst(eerste.sluiting).toLowerCase()}`
}

export function SluitingMelding({ lijst, vandaag, variant = 'club' }: SluitingMeldingProps) {
  if (lijst.length === 0) return null
  const [eerste] = lijst
  const vandaagDicht = eerste.datum === vandaag
  return (
    <aside className={`club-sluiting-melding club-sluiting-melding--${variant}${vandaagDicht ? ' is-vandaag' : ''}`} aria-label="Sluitingsdagen en andere openingstijden">
      <CalendarX2 size={18} aria-hidden className="club-sluiting-melding-icoon" />
      <div className="club-sluiting-melding-tekst">
        <p className="club-sluiting-melding-kop">{kopTekst(eerste, vandaag, variant)}</p>
        <ul>
          {lijst.map(({ datum, sluiting }) => (
            <li key={datum}>
              <strong>{wanneer(datum, vandaag)}</strong>
              <span>{soortTekst(sluiting)}</span>
              <span className="club-sluiting-melding-reden">{sluiting.reden}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
