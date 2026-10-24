'use client'

import { Check, Timer, Wind, X } from 'lucide-react'
import { useCoaching } from '@/components/club/training/coaching/useCoaching'

// De coaching direct onder de rep-speler, zoals een trainer naast je staat: de
// genummerde kernpunten, de fouten die je echt ziet met de correctie, en
// ademhaling en tempo. Volledige uitleg (opstelling, stappen) blijft achter
// "Meer uitleg". Zolang de coaching laadt of als die er niet is: de kernpunten
// uit het schema, anders de aandachtspunten uit de bibliotheek.

interface RepCoachingProps {
  naam: string
  /** Kernpunten die al binnen zijn (voor het hele schema opgehaald). */
  kernpunten: readonly string[] | undefined
  aandachtspunten: string | null
}

function Punten({ punten }: { punten: readonly { punt: string; uitleg?: string }[] }) {
  return (
    <ol className="club-repc-kern" aria-label="Kernpunten">
      {punten.slice(0, 5).map((k, i) => (
        <li key={i}>
          <b aria-hidden>{i + 1}</b>
          <span>
            <strong>{k.punt}</strong>
            {k.uitleg ? <small>{k.uitleg}</small> : null}
          </span>
        </li>
      ))}
    </ol>
  )
}

export function RepCoaching({ naam, kernpunten, aandachtspunten }: RepCoachingProps) {
  const staat = useCoaching(naam)
  const c = staat.status === 'klaar' ? staat.coaching : null
  if (!c) {
    if (kernpunten && kernpunten.length > 0) return <div className="club-repc"><Punten punten={kernpunten.map((punt) => ({ punt }))} /></div>
    return aandachtspunten ? <p className="club-repc-tekst">{aandachtspunten}</p> : null
  }
  return (
    <div className="club-repc">
      <Punten punten={c.kernpunten} />
      {c.fouten.length > 0 && (
        <section>
          <h3 className="club-repc-kop">Let op</h3>
          <ul className="club-repc-fouten">
            {c.fouten.slice(0, 3).map((f, i) => (
              <li key={i}>
                <span className="club-repc-fout"><X aria-hidden size={15} /><span><span className="club-sr">Fout: </span>{f.fout}</span></span>
                <span className="club-repc-beter"><Check aria-hidden size={15} /><span><span className="club-sr">Beter: </span>{f.beter}</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <dl className="club-repc-tegels">
        <div>
          <dt><Wind aria-hidden size={14} /> Ademhaling</dt>
          <dd>{c.ademhaling}</dd>
        </div>
        <div>
          <dt><Timer aria-hidden size={14} /> Tempo</dt>
          <dd>{c.tempo}</dd>
        </div>
      </dl>
    </div>
  )
}
