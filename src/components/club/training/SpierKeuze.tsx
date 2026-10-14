'use client'

import {
  SPIER_GROEP_LABEL, SPIER_GROEPEN, SPIER_INFO, spierenInGroep, spierStaat, volgendeStaat, type Spier,
} from '@/lib/club/training/spieren'
import { Spierkaart } from './Spierkaart'

interface SpierKeuzeProps {
  naam: string
  primair: readonly Spier[]
  secundair: readonly Spier[]
  onWijzig: (spieren: { primair: Spier[]; secundair: Spier[] }) => void
}

const STAND = { primair: 'vooral', secundair: 'werkt mee', rust: '' } as const

/**
 * Spieren kiezen: een knop per spier, gegroepeerd. Een tik zet hem op "vooral",
 * nog een tik op "werkt mee", dan weer uit. Zo kan een spier nooit in beide lijsten staan.
 */
export function SpierKeuze({ naam, primair, secundair, onWijzig }: SpierKeuzeProps) {
  return (
    <fieldset className="club-training-fieldset">
      <legend className="club-label">Spieren: tik een keer voor vooral, twee keer voor werkt mee</legend>
      <div className="club-training-spierkeuze-voorbeeld">
        <Spierkaart naam={naam || 'deze oefening'} primair={primair} secundair={secundair} formaat="klein" decoratief />
        <p className="club-hint" aria-live="polite">
          {primair.length === 0 ? 'Kies minstens een spier waar de oefening vooral op werkt.' : `${primair.length} vooral, ${secundair.length} werkt mee.`}
        </p>
      </div>
      <div className="club-training-spierkeuze">
        {SPIER_GROEPEN.map((g) => (
          <div key={g} className="club-training-spierkeuze-groep" role="group" aria-label={SPIER_GROEP_LABEL[g]}>
            <h4>{SPIER_GROEP_LABEL[g]}</h4>
            <div className="club-training-chips">
              {spierenInGroep(g).map((s) => {
                const staat = spierStaat(s, primair, secundair)
                const info = SPIER_INFO[s]
                return (
                  <button
                    key={s}
                    type="button"
                    className="club-training-spierknop"
                    data-staat={staat}
                    title={info.ook}
                    aria-label={`${info.naam} (${info.ook}): ${staat === 'rust' ? 'niet gekozen' : STAND[staat]}`}
                    onClick={() => onWijzig(volgendeStaat(s, primair, secundair))}
                  >
                    {info.naam}
                    {staat !== 'rust' && <span className="club-training-spierknop-stand" aria-hidden>{STAND[staat]}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  )
}
