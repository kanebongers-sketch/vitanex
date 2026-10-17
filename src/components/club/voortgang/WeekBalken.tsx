import type { WeekTelling } from '@/lib/club/voortgang/frequentie'
import { datumKort } from './weergave'

interface WeekBalkenProps {
  weken: readonly WeekTelling[]
  /** Kleinere variant voor de ledenapp. */
  compact?: boolean
}

/** Trainingen per week als staafjes; de lopende week is gestreept (nog niet af). */
export function WeekBalken({ weken, compact = false }: WeekBalkenProps) {
  const hoogste = Math.max(3, ...weken.map((w) => w.aantal))
  const samenvatting = weken.map((w) => `week van ${datumKort(w.week)}: ${w.aantal}`).join(', ')
  return (
    <div className={`club-voortgang-weken${compact ? ' club-voortgang-weken--compact' : ''}`} role="img" aria-label={`Trainingen per week, ${samenvatting}`}>
      {weken.map((w, i) => {
        const nu = i === weken.length - 1
        return (
          <div key={w.week} className="club-voortgang-week" aria-hidden title={`Week van ${datumKort(w.week)}: ${w.aantal}`}>
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
