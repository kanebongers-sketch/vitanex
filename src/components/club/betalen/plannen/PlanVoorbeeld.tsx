import { datum } from '@/lib/club/betalen/contract/datum'
import { WET } from '@/lib/club/betalen/contract/regels'
import { euroTekst } from '@/lib/club/betalen/plannen/tekst'
import { datumTekst, opzegTekst, planVoorbeeld, type VoorbeeldPlan } from '@/lib/club/betalen/plannen/voorbeeld'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import type { BetalenTekst } from '@/lib/aiyourgym/taal/woorden/club/betalen'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { BETALEN } from '@/lib/aiyourgym/taal/woorden/club/betalen'

// Het live voorbeeld bij een plan: voor een lid dat vandaag begint, wanneer de
// eerste incasso valt en hoeveel, en wanneer opzeggen kan. Rekent met dezelfde
// pure regels als de cyclus straks. Een voorbeeld, geen incasso.

interface Props {
  plan: VoorbeeldPlan
  /** Vandaag in Nederland (jjjj-mm-dd). */
  vandaag: string
  /** Toon ook de uitleg over de wet. */
  metWet?: boolean
}

function opzeggen(plan: VoorbeeldPlan, v: ReturnType<typeof planVoorbeeld>, t: BetalenTekst['voorbeeld'], taal: Taal): string {
  const termijn = opzegTekst(plan.opzegtermijnDagen, taal)
  if (v.stoptVanzelf && v.vastTot) return t.stoptVanzelf(datumTekst(v.vastTot, taal))
  if (v.vastTot) return t.vastTot(datumTekst(v.vastTot, taal), termijn, datumTekst(v.vroegsteLaatsteDag, taal))
  return t.flex(termijn, datumTekst(v.vroegsteLaatsteDag, taal))
}

export function PlanVoorbeeld({ plan, vandaag, metWet = false }: Props) {
  const taal = useTaal()
  const tb = useTekst(BETALEN)
  const t = tb.voorbeeld
  const v = planVoorbeeld(plan, datum(vandaag))
  const e = v.eersteIncasso
  const delen = [
    e.proRata ? t.totFactuurdag(euroTekst(e.termijn, taal)) : t.eersteTermijn(euroTekst(e.termijn, taal)),
    e.inschrijfkosten > 0 ? t.inschrijfkosten(euroTekst(e.inschrijfkosten, taal)) : null,
  ].filter((d): d is string => d !== null)

  return (
    <div className="club-plan-voorbeeld" aria-live="polite">
      <p className="club-plan-voorbeeld-kop">{t.kop}</p>
      <dl>
        {plan.proefDagen > 0 && (
          <div>
            <dt>{t.proef}</dt>
            <dd>{t.proefTekst(plan.proefDagen, datumTekst(v.betaaltVanaf, taal))}</dd>
          </div>
        )}
        <div>
          <dt>{t.eerste}</dt>
          <dd>
            <strong>{euroTekst(e.bedrag, taal)}</strong>{t.op(datumTekst(e.op, taal))}
            <span className="club-plan-voorbeeld-klein">
              {t.waarvanBtw(delen.join(t.plus), euroTekst(e.btw, taal))}
            </span>
            {v.gratisTot && <span className="club-plan-voorbeeld-klein">{t.gratisTot(datumTekst(v.gratisTot, taal))}</span>}
          </dd>
        </div>
        <div>
          <dt>{t.daarna}</dt>
          <dd>
            {t.daarnaTekst(euroTekst(v.volgendeIncasso.bedrag, taal), tb.intervalKort[plan.interval], datumTekst(v.volgendeIncasso.op, taal))}
          </dd>
        </div>
        <div>
          <dt>{t.opzeggen}</dt>
          <dd>{opzeggen(plan, v, t, taal)}</dd>
        </div>
      </dl>
      {metWet && (
        <p className="club-plan-wet">
          {t.wet(WET.maxEersteLooptijdMaanden.waarde)}
        </p>
      )}
    </div>
  )
}
