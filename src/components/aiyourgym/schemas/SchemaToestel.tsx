import { Check, ChevronRight } from 'lucide-react'
import { Toestel } from '@/components/aiyourgym/mockups/kaders'
import type { VoorbeeldOefening } from '@/components/aiyourgym/inhoud/voorbeeldschema'

// Het schema zoals het lid het in de ledenapp ziet: dag A, de oefeningen met
// het voorschrift en de eerste twee kernpunten eronder (zoals in Club), en de
// knop om de training af te vinken. De gekozen oefening licht op.

interface SchemaToestelProps {
  oefeningen: readonly VoorbeeldOefening[]
  gekozen: number
  onKies?: (i: number) => void
}

export function SchemaToestel({ oefeningen, gekozen, onKies }: SchemaToestelProps) {
  return (
    <div className="ayg-cd-toestel">
      <div className="aygm">
        <Toestel tab="Schema">
          <div className="ayg-cd-app">
            <p className="ayg-cd-app-kop">Schema</p>
            <p className="ayg-cd-app-naam">
              <b>Full body · Spiermassa</b>
              <span>8 weken</span>
            </p>
            <span className="ayg-cd-app-dagen" aria-hidden>
              <i data-actief="">Dag A</i>
              <i>Dag B</i>
              <i>Dag C</i>
            </span>
            <ol className="ayg-cd-app-lijst">
              {oefeningen.map((o, i) => (
                <li key={o.naam}>
                  {onKies ? (
                    <button type="button" aria-pressed={i === gekozen} onClick={() => onKies(i)}>
                      <Regel o={o} i={i} />
                    </button>
                  ) : (
                    <span className="ayg-cd-app-rij" data-gekozen={i === gekozen ? '' : undefined}>
                      <Regel o={o} i={i} />
                    </span>
                  )}
                </li>
              ))}
            </ol>
            <span className="ayg-cd-app-klaar" aria-hidden>
              <Check size={14} /> Training dag A gedaan
            </span>
          </div>
        </Toestel>
      </div>
      <p className="ayg-cd-toestel-uitleg">In de ledenapp: de eerste twee kernpunten onder elke oefening, tik voor de beweging en alle coaching.</p>
    </div>
  )
}

function Regel({ o, i }: { o: VoorbeeldOefening; i: number }) {
  return (
    <>
      <span className="ayg-cd-app-nr" aria-hidden>
        {i + 1}
      </span>
      <img src={o.beeldStart} alt="" width={40} height={40} loading="lazy" decoding="async" />
      <span className="ayg-cd-app-tekst">
        <b>{o.naam}</b>
        <span>{o.voorschrift.split(',')[0]}</span>
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
