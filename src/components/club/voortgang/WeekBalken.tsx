import type { WeekTelling } from '@/lib/club/voortgang/frequentie'
import { datumKort } from './weergave'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { VOORTGANG } from '@/lib/aiyourgym/taal/woorden/club/voortgang'

interface WeekBalkenProps {
  weken: readonly WeekTelling[]
  /** Kleinere variant voor de ledenapp. */
  compact?: boolean
}

/** Trainingen per week als staafjes; de lopende week is gestreept (nog niet af). */
export function WeekBalken({ weken, compact = false }: WeekBalkenProps) {
  const taal = useTaal()
  const t = useTekst(VOORTGANG).weken
  const hoogste = Math.max(3, ...weken.map((w) => w.aantal))
  const samenvatting = weken.map((w) => t.weekVanKort(datumKort(w.week, taal), w.aantal)).join(', ')
  return (
    <div className={`club-voortgang-weken${compact ? ' club-voortgang-weken--compact' : ''}`} role="img" aria-label={t.label(samenvatting)}>
      {weken.map((w, i) => {
        const nu = i === weken.length - 1
        return (
          <div key={w.week} className="club-voortgang-week" aria-hidden title={t.weekVan(datumKort(w.week, taal), w.aantal)}>
            <span className="club-voortgang-week-getal">{w.aantal || ''}</span>
            <span className="club-voortgang-week-baan">
              <span
                className={`club-voortgang-week-staaf${nu ? ' club-voortgang-week-staaf--nu' : ''}${w.aantal === 0 ? ' club-voortgang-week-staaf--leeg' : ''}`}
                style={{ transform: `scaleY(${w.aantal === 0 ? 0.04 : w.aantal / hoogste})` }}
              />
            </span>
          </div>
        )
      })}
    </div>
  )
}
