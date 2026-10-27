'use client'

import { Check, ChevronRight } from 'lucide-react'
import { Toestel } from '@/components/aiyourgym/mockups/kaders'
import type { VoorbeeldOefening } from '@/components/aiyourgym/inhoud/voorbeeldschema'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { SCHEMA_SCHERMEN } from '@/lib/aiyourgym/taal/woorden/website/schemas'

// Het schema zoals het lid het in de ledenapp ziet: dag A, de oefeningen met
// het voorschrift en de eerste twee kernpunten eronder (zoals in Club), en de
// knop om de training af te vinken. De gekozen oefening licht op.
// Een clientcomponent (useTekst), omdat CoachingDemo hem ook gebruikt. De
// kernpunten komen uit de bibliotheek van Club, in de taal van de pagina.

type Teksten = (typeof SCHEMA_SCHERMEN)['nl']

interface SchemaToestelProps {
  oefeningen: readonly VoorbeeldOefening[]
  gekozen: number
  onKies?: (i: number) => void
  /** De uitleg onder de telefoon; uit als de tekst ernaast al staat. */
  uitleg?: boolean
}

export function SchemaToestel({ oefeningen, gekozen, onKies, uitleg = true }: SchemaToestelProps) {
  const t = useTekst(SCHEMA_SCHERMEN)
  const a = t.app
  return (
    <div className="ayg-cd-toestel">
      <div className="aygm">
        <Toestel tab="Schema">
          <div className="ayg-cd-app">
            <p className="ayg-cd-app-kop">{a.schema}</p>
            <p className="ayg-cd-app-naam">
              <b>{a.naam}</b>
              <span>{a.weken(8)}</span>
            </p>
            <span className="ayg-cd-app-dagen" aria-hidden>
              {a.dagen.map((dag, i) => (
                <i key={dag} data-actief={i === 0 ? '' : undefined}>
                  {dag}
                </i>
              ))}
            </span>
            <ol className="ayg-cd-app-lijst">
              {oefeningen.map((o, i) => (
                <li key={o.naam}>
                  {onKies ? (
                    <button type="button" aria-pressed={i === gekozen} onClick={() => onKies(i)}>
                      <Regel o={o} i={i} t={t} />
                    </button>
                  ) : (
                    <span className="ayg-cd-app-rij" data-gekozen={i === gekozen ? '' : undefined}>
                      <Regel o={o} i={i} t={t} />
                    </span>
                  )}
                </li>
              ))}
            </ol>
            <span className="ayg-cd-app-klaar" aria-hidden>
              <Check size={14} /> {a.gedaan}
            </span>
          </div>
        </Toestel>
      </div>
      {uitleg && <p className="ayg-cd-toestel-uitleg">{a.uitleg}</p>}
    </div>
  )
}

function Regel({ o, i, t }: { o: VoorbeeldOefening; i: number; t: Teksten }) {
  return (
    <>
      <span className="ayg-cd-app-nr" aria-hidden>
        {i + 1}
      </span>
      <span className="ayg-cd-app-tekst">
        <b>{o.naam}</b>
        <span>{t.voorschrift(o.voorschrift).split(',')[0]}</span>
        <em>
          {o.coaching.kernpunten
            .slice(0, 2)
            .map((k, n) => `${n + 1}. ${k.punt}`)
            .join('  ')}
        </em>
      </span>
      <ChevronRight size={14} aria-hidden />
    </>
  )
}
