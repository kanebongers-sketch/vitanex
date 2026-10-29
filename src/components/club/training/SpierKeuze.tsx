'use client'

import { SPIER_GROEPEN, spierenInGroep, spierStaat, volgendeStaat, type Spier } from '@/lib/club/training/spieren'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'
import { TRAINING_LABELS } from '@/lib/aiyourgym/taal/woorden/club/training-labels'
import { Spierkaart } from './Spierkaart'

interface SpierKeuzeProps {
  naam: string
  primair: readonly Spier[]
  secundair: readonly Spier[]
  onWijzig: (spieren: { primair: Spier[]; secundair: Spier[] }) => void
}

/**
 * Spieren kiezen: een knop per spier, gegroepeerd. Een tik zet hem op "vooral",
 * nog een tik op "werkt mee", dan weer uit. Zo kan een spier nooit in beide lijsten staan.
 */
export function SpierKeuze({ naam, primair, secundair, onWijzig }: SpierKeuzeProps) {
  const t = useTekst(CLUB_TRAINING).spieren
  const l = useTekst(TRAINING_LABELS)
  return (
    <fieldset className="club-training-fieldset">
      <legend className="club-label">{t.keuzeLegend}</legend>
      <div className="club-training-spierkeuze-voorbeeld">
        <Spierkaart naam={naam || t.dezeOefening} primair={primair} secundair={secundair} formaat="klein" decoratief />
        <p className="club-hint" aria-live="polite">
          {primair.length === 0 ? t.kiesMinstens : t.telling(primair.length, secundair.length)}
        </p>
      </div>
      <div className="club-training-spierkeuze">
        {SPIER_GROEPEN.map((g) => (
          <div key={g} className="club-training-spierkeuze-groep" role="group" aria-label={l.spierGroep[g]}>
            <h4>{l.spierGroep[g]}</h4>
            <div className="club-training-chips">
              {spierenInGroep(g).map((s) => {
                const staat = spierStaat(s, primair, secundair)
                const info = { naam: l.spier[s], ook: l.spierOok[s] }
                return (
                  <button
                    key={s}
                    type="button"
                    className="club-training-spierknop"
                    data-staat={staat}
                    title={info.ook}
                    aria-label={t.knopLabel(info.naam, info.ook, staat === 'rust' ? t.nietGekozen : t.stand[staat])}
                    onClick={() => onWijzig(volgendeStaat(s, primair, secundair))}
                  >
                    {info.naam}
                    {staat !== 'rust' && <span className="club-training-spierknop-stand" aria-hidden>{t.stand[staat]}</span>}
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
