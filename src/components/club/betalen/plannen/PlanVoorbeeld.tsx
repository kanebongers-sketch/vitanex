import { datum } from '@/lib/club/betalen/contract/datum'
import { WET } from '@/lib/club/betalen/contract/regels'
import { INTERVAL_KORT } from '@/lib/club/betalen/plannen/model'
import { euroTekst } from '@/lib/club/betalen/plannen/tekst'
import { datumTekst, opzegTekst, planVoorbeeld, type VoorbeeldPlan } from '@/lib/club/betalen/plannen/voorbeeld'

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

function opzeggen(plan: VoorbeeldPlan, v: ReturnType<typeof planVoorbeeld>): string {
  const termijn = opzegTekst(plan.opzegtermijnDagen)
  if (v.stoptVanzelf && v.vastTot) return `Het contract stopt vanzelf na ${datumTekst(v.vastTot)}. Eerder opzeggen kan niet.`
  if (v.vastTot) return `Vast tot en met ${datumTekst(v.vastTot)}. Daarna loopt het door en is het elke dag op te zeggen, met ${termijn}. Wie meteen opzegt, is op zijn vroegst klaar na ${datumTekst(v.vroegsteLaatsteDag)}.`
  return `Flex: opzeggen kan elke dag, met ${termijn}. Wie meteen opzegt, is klaar na ${datumTekst(v.vroegsteLaatsteDag)}.`
}

export function PlanVoorbeeld({ plan, vandaag, metWet = false }: Props) {
  const v = planVoorbeeld(plan, datum(vandaag))
  const e = v.eersteIncasso
  const delen = [
    e.proRata ? `${euroTekst(e.termijn)} voor de dagen tot de factuurdag` : `${euroTekst(e.termijn)} voor de eerste termijn`,
    e.inschrijfkosten > 0 ? `${euroTekst(e.inschrijfkosten)} inschrijfkosten` : null,
  ].filter((d): d is string => d !== null)

  return (
    <div className="club-plan-voorbeeld" aria-live="polite">
      <p className="club-plan-voorbeeld-kop">Voorbeeld voor een lid dat vandaag begint</p>
      <dl>
        {plan.proefDagen > 0 && (
          <div>
            <dt>Proefperiode</dt>
            <dd>{plan.proefDagen} {plan.proefDagen === 1 ? 'dag' : 'dagen'} gratis, betalen vanaf {datumTekst(v.betaaltVanaf)}</dd>
          </div>
        )}
        <div>
          <dt>Eerste incasso</dt>
          <dd>
            <strong>{euroTekst(e.bedrag)}</strong> op {datumTekst(e.op)}
            <span className="club-plan-voorbeeld-klein">
              {delen.join(' plus ')}, waarvan {euroTekst(e.btw)} btw
            </span>
            {v.gratisTot && <span className="club-plan-voorbeeld-klein">De dagen tot en met {datumTekst(v.gratisTot)} kosten niets.</span>}
          </dd>
        </div>
        <div>
          <dt>Daarna</dt>
          <dd>
            {euroTekst(v.volgendeIncasso.bedrag)} {INTERVAL_KORT[plan.interval]}, eerst op {datumTekst(v.volgendeIncasso.op)}
          </dd>
        </div>
        <div>
          <dt>Opzeggen</dt>
          <dd>{opzeggen(plan, v)}</dd>
        </div>
      </dl>
      {metWet && (
        <p className="club-plan-wet">
          De wet (Wet van Dam) zegt: een eerste looptijd van hooguit {WET.maxEersteLooptijdMaanden.waarde} maanden. Daarna loopt een abonnement alleen door
          voor onbepaalde tijd en kan het lid elke maand opzeggen. De opzegtermijn is nooit langer dan een maand. Wie online afsluit, kan ook online
          opzeggen; dat kan in de ledenapp. Club houdt deze grenzen vast. Dit is geen juridisch advies.
        </p>
      )}
    </div>
  )
}
