import { Check } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { AANMELD_FORMULIER } from '@/lib/aiyourgym/taal/woorden/website/aanmelden'
import { STAPPEN } from './stappen'

// Waar ben je in het formulier? Een genummerde lijst; afgeronde stappen zijn
// aanklikbaar om terug te gaan, verder vooruit springen kan niet.

interface VoortgangProps {
  huidig: number
  verste: number
  onKies: (stap: number) => void
}

export function Voortgang({ huidig, verste, onKies }: VoortgangProps) {
  const t = useTekst(AANMELD_FORMULIER)
  return (
    <nav aria-label={t.voortgangLabel}>
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
                  <span className="ayg-sr">{t.stapSr(i + 1)}</span>
                  {t.stappen[s.sleutel].titel}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
