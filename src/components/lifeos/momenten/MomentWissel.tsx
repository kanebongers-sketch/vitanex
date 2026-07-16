'use client'

import { useState, useSyncExternalStore } from 'react'
import { Sunrise, Zap, Moon, type LucideIcon } from 'lucide-react'
import {
  MOMENTEN,
  momentDef,
  momentVoorUur,
  groetVoorUur,
  type MomentKey,
} from '@/lib/lifeos/momenten/momenten'

// Klein client-eiland: alleen dit stukje heeft de klok van de gebruiker nodig.
// De rest van de pagina blijft Server Component. Het moment server-side bepalen
// zou de tijdzone van de server gebruiken — dan zit je om 07:00 in de "avond".

const ICONEN: Record<string, LucideIcon> = { Sunrise, Zap, Moon }

// ─── De klok als extern systeem ────────────────────────────────────────────
// De klok is geen React-state: hij verandert buiten React om. Dat is precies
// waar useSyncExternalStore voor bestaat. De vorige versie las hem in een
// useEffect en deed daar setState — dat is een render, dan een effect, dan nog
// een render (react-hooks/set-state-in-effect). Zo is het één render.
//
// Module-scope: de referenties moeten stabiel zijn over renders heen, anders
// her-abonneert React elke keer.

function abonneerOpKlok(herlees: () => void): () => void {
  const id = setInterval(herlees, 60_000)
  return () => clearInterval(id)
}

/**
 * Het úúr, niet de Date. Een primitief dat React met Object.is vergelijkt, dus
 * de tick van elke minuut leidt alleen tot een render als het uur écht
 * verandert — hooguit één keer per uur, in plaats van 60 keer.
 */
function leesUur(): number {
  return new Date().getHours()
}

/**
 * De server kent de tijdzone van de gebruiker niet, dus heeft hij geen antwoord.
 * null → de placeholder, en de client hydrateert met exact dezelfde output.
 * Geen mismatch, geen gok op de servertijd.
 */
function leesUurOpServer(): null {
  return null
}

interface MomentWisselProps {
  // Slots i.p.v. een render-functie: dit component is een client-eiland, en een
  // functie is niet serialiseerbaar over de Server/Client-grens. JSX wél — dus
  // de Server Component rendert de drie panelen en geeft ze hier als props door.
  ochtend: React.ReactNode
  nu: React.ReactNode
  avond: React.ReactNode
}

export function MomentWissel({ ochtend, nu, avond }: MomentWisselProps) {
  // null tot de client-klok gelezen is: server en client moeten hetzelfde
  // renderen, anders krijg je een hydration-mismatch.
  const uur = useSyncExternalStore(abonneerOpKlok, leesUur, leesUurOpServer)

  // Alleen de handmatige keuze is echte state. De rest leiden we af.
  const [keuze, setKeuze] = useState<MomentKey | null>(null)

  if (uur === null) {
    // Rustige, stabiele placeholder — geen spinner-spektakel.
    return <div style={{ minHeight: 320 }} aria-hidden="true" />
  }

  // De klok tikt door, maar een handmatige keuze wint altijd — anders gooit de
  // pagina onder je handen om terwijl je aan het lezen bent. Dat is hier geen
  // vlag die we bijhouden maar een gevolg van de vorm: zodra `keuze` gezet is,
  // kan geen enkele tick er nog langs.
  const moment = keuze ?? momentVoorUur(uur)
  const def = momentDef(moment)

  return (
    <>
      <div className="os-kop">
        <header>
          <p className="os-kop__datum">
            {new Date().toLocaleDateString('nl-NL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <h1 className="os-kop__groet">{groetVoorUur(uur)}, Kane</h1>
          <p className="os-kop__vraag">{def.vraag}</p>
        </header>

        <nav aria-label="Moment kiezen" className="os-kiezer">
          <ul className="os-kiezer__lijst">
            {MOMENTEN.map((m) => {
              const actief = m.key === moment
              const Icoon = ICONEN[m.icoon] ?? Zap
              return (
                <li key={m.key}>
                  <button
                    type="button"
                    onClick={() => setKeuze(m.key)}
                    // aria-current stuurt óók de actieve styling aan (CSS leest
                    // het attribuut). Eén bron van waarheid: wat de screenreader
                    // hoort en wat je ziet kunnen niet uit elkaar lopen.
                    aria-current={actief ? 'true' : undefined}
                    className="os-kiezer__knop"
                  >
                    <Icoon size={15} strokeWidth={2.2} aria-hidden="true" />
                    {m.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {moment === 'ochtend' ? ochtend : moment === 'avond' ? avond : nu}
    </>
  )
}
