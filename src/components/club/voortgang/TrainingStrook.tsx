import { gemiddeldPerWeek, perWeek, wekenOpRij } from '@/lib/club/voortgang/frequentie'
import { WeekBalken } from './WeekBalken'
import { getal } from './weergave'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { VOORTGANG } from '@/lib/aiyourgym/taal/woorden/club/voortgang'

interface TrainingStrookProps {
  trainingen: readonly string[]
  totaal: number
  nu: string
}

/** Trainingen per week (laatste 12 weken) met gemiddelde, reeks en totaal. */
export function TrainingStrook({ trainingen, totaal, nu }: TrainingStrookProps) {
  const taal = useTaal()
  const t = useTekst(VOORTGANG).strook
  const datum = new Date(nu)
  const weken = perWeek(trainingen, datum, 12)
  const opRij = wekenOpRij(trainingen, datum)
  return (
    <section className="club-voortgang-training" aria-labelledby="voortgang-training-kop">
      <div className="club-voortgang-training-tekst">
        <h3 id="voortgang-training-kop">{t.titel}</h3>
        <dl className="club-voortgang-feiten">
          <div>
            <dt>{t.gemiddeld}</dt>
            <dd>{getal(gemiddeldPerWeek(weken), taal)}</dd>
          </div>
          <div>
            <dt>{t.opRij}</dt>
            <dd>{opRij}</dd>
          </div>
          <div>
            <dt>{t.totaal}</dt>
            <dd>{totaal}</dd>
          </div>
        </dl>
        <p className="club-hint">{t.hint}</p>
      </div>
      <WeekBalken weken={weken} />
    </section>
  )
}
