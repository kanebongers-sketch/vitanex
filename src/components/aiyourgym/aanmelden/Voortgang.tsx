import { Check } from 'lucide-react'
import { STAPPEN } from './stappen'

// Waar ben je in het formulier? Een genummerde lijst; afgeronde stappen zijn
// aanklikbaar om terug te gaan, verder vooruit springen kan niet.

interface VoortgangProps {
  huidig: number
  verste: number
  onKies: (stap: number) => void
}

export function Voortgang({ huidig, verste, onKies }: VoortgangProps) {
  return (
    <nav aria-label="Stappen van het aanmelden">
      <ol className="aan-voortgang">
        {STAPPEN.map((s, i) => {
          const staat = i === huidig ? 'nu' : i < huidig || i <= verste ? 'klaar' : 'later'
          return (
            <li key={s.sleutel} data-staat={staat}>
              <button type="button" onClick={() => onKies(i)} disabled={i > verste} aria-current={i === huidig ? 'step' : undefined}>
                <span className="aan-voortgang-nr" aria-hidden="true">
                  {staat === 'klaar' && i !== huidig ? <Check size={14} strokeWidth={3} /> : i + 1}
                </span>
                <span className="aan-voortgang-titel">
                  <span className="ayg-sr">Stap {i + 1}: </span>
                  {s.titel}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
