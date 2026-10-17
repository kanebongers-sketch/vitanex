import { gemiddeldPerWeek, perWeek, wekenOpRij } from '@/lib/club/voortgang/frequentie'
import { WeekBalken } from './WeekBalken'
import { getal } from './weergave'

interface TrainingStrookProps {
  trainingen: readonly string[]
  totaal: number
  nu: string
}

/** Trainingen per week (laatste 12 weken) met gemiddelde, reeks en totaal. */
export function TrainingStrook({ trainingen, totaal, nu }: TrainingStrookProps) {
  const datum = new Date(nu)
  const weken = perWeek(trainingen, datum, 12)
  const opRij = wekenOpRij(trainingen, datum)
  return (
    <section className="club-voortgang-training" aria-labelledby="voortgang-training-kop">
      <div className="club-voortgang-training-tekst">
        <h3 id="voortgang-training-kop">Trainingen per week</h3>
        <dl className="club-voortgang-feiten">
          <div>
            <dt>Gemiddeld</dt>
            <dd>{getal(gemiddeldPerWeek(weken))}</dd>
          </div>
          <div>
            <dt>Weken op rij</dt>
            <dd>{opRij}</dd>
          </div>
          <div>
            <dt>Totaal</dt>
            <dd>{totaal}</dd>
          </div>
        </dl>
        <p className="club-hint">Telt wat het lid in de app afvinkt. De lopende week telt nog niet mee in het gemiddelde.</p>
      </div>
      <WeekBalken weken={weken} />
    </section>
  )
}
