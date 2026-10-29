import { CalendarX2 } from 'lucide-react'
import type { KomendeAfwijking } from '@/lib/club/sluiting/regels'
import { soortTekst, wanneer } from '@/lib/club/sluiting/weergave'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { SLUITING_MELDING } from '@/lib/aiyourgym/taal/woorden/club/opvolgen'
import './sluiting.css'

// Een rustige melding als de vestiging vandaag of de komende dagen dicht is of
// andere tijden heeft. Geen regels = niets. Puur (props in, markup uit), dus
// bruikbaar op Club Vandaag en in de ledenapp. Voor de data: SluitingenBinnenkort.

export interface SluitingMeldingProps {
  lijst: readonly KomendeAfwijking[]
  vandaag: string
  /** 'club' voor het personeel, 'app' voor leden (kortere tekst). */
  variant?: 'club' | 'app'
  /** Taal van de teksten (standaard Nederlands). */
  taal?: Taal
}

function kopTekst(eerste: KomendeAfwijking, vandaag: string, variant: 'club' | 'app', taal: Taal): string {
  const t = SLUITING_MELDING[taal]
  if (eerste.datum !== vandaag) return variant === 'app' ? t.binnenkortApp : t.binnenkortClub
  const s = eerste.sluiting
  return s.soort === 'gesloten' || !s.van || !s.tot ? t.vandaagGesloten : t.vandaagOpen(s.van, s.tot)
}

export function SluitingMelding({ lijst, vandaag, variant = 'club', taal = 'nl' }: SluitingMeldingProps) {
  if (lijst.length === 0) return null
  const [eerste] = lijst
  const vandaagDicht = eerste.datum === vandaag
  return (
    <aside className={`club-sluiting-melding club-sluiting-melding--${variant}${vandaagDicht ? ' is-vandaag' : ''}`} aria-label={SLUITING_MELDING[taal].label}>
      <CalendarX2 size={18} aria-hidden className="club-sluiting-melding-icoon" />
      <div className="club-sluiting-melding-tekst">
        <p className="club-sluiting-melding-kop">{kopTekst(eerste, vandaag, variant, taal)}</p>
        <ul>
          {lijst.map(({ datum, sluiting }) => (
            <li key={datum}>
              <strong>{wanneer(datum, vandaag, taal)}</strong>
              <span>{soortTekst(sluiting, taal)}</span>
              <span className="club-sluiting-melding-reden">{sluiting.reden}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
