import type { Behoud } from '@/lib/club/leden/behoud'
import { behoudOnderdelen } from '@/lib/club/leden/onderdelen'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { BEHOUD_DATA } from '@/lib/aiyourgym/taal/woorden/club/behoud-data'

// Waarom een lid op de risicolijst staat: de vijf onderdelen van de
// behoudsscore als korte balkjes met tekst. Een vaste rekenregel
// (src/lib/club/leden/behoud.ts), geen voorspelmodel.

interface BehoudOpbouwProps {
  behoud: Behoud
  taal: Taal
}

export function BehoudOpbouw({ behoud, taal }: BehoudOpbouwProps) {
  const t = BEHOUD_DATA[taal].opbouw
  return (
    <span className="club-vandaag-opbouw" role="list" aria-label={t.label}>
      {behoudOnderdelen(behoud, taal).map((o) => {
        const deel = o.max > 0 ? o.punten / o.max : 0
        return (
          <span key={o.label} role="listitem" className="club-vandaag-opbouw-deel" data-laag={deel < 0.5 || undefined} title={o.uitleg}>
            <span className="club-vandaag-opbouw-kop">
              <span>{o.label}</span>
              <span className="club-getal" aria-hidden>{o.punten}/{o.max}</span>
            </span>
            <span className="club-vandaag-opbouw-balk" aria-hidden><span style={{ transform: `scaleX(${deel})` }} /></span>
            <span className="club-sr">{t.punten(o.punten, o.max)}. {o.uitleg}.</span>
          </span>
        )
      })}
    </span>
  )
}
