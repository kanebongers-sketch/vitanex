// ─── Club, betalen: voorbeeld van een plan (PUUR) ───────────────────────────
// Voor de eigenaar bij het maken van een plan: wanneer de eerste incasso valt,
// hoeveel die is, en wanneer en hoe een lid kan opzeggen. Alles uit de pure
// rekenregels (contract/periodes.ts, contract/regels.ts, geld/), dus precies
// wat de cyclus straks ook rekent. Een voorbeeld is geen belofte van een
// incasso: in schaduwmodus wordt er niets geincasseerd.

import { cent, plus, type Cent } from '../geld/cent'
import { btwUitInclusief } from '../geld/btw'
import type { BtwProcent } from '../geld/btw-tarieven'
import { delen, plusDagen, vanDelen, dagenInMaand, type Datum } from '../contract/datum'
import { periodeStart, proRata, type Interval } from '../contract/periodes'
import { eindeEersteLooptijd, laatsteContractdag, vroegsteEinde } from '../contract/regels'
import { MAAND_INTERVALLEN, type PlanVerlenging } from './model'

export interface VoorbeeldPlan {
  interval: Interval
  bedragCent: number
  btwProcent: BtwProcent
  contractMaanden: number | null
  opzegtermijnDagen: number
  verlenging: PlanVerlenging
  proefDagen: number
  inschrijfkostenCent: number
  factuurDag: number | null
  proRataEerste: boolean
}

export interface Voorbeeld {
  /** Eerste dag waarvoor betaald wordt (na de proefdagen). */
  betaaltVanaf: Datum
  eersteIncasso: { op: Datum; bedrag: Cent; btw: Cent; termijn: Cent; inschrijfkosten: Cent; proRata: boolean }
  /** Daarna elke termijn het volle bedrag, vanaf deze dag. */
  volgendeIncasso: { op: Datum; bedrag: Cent }
  /** Dagen tussen de start van de betaling en de factuurdag die niets kosten (zonder pro rata). */
  gratisTot: Datum | null
  /** Laatste dag van de eerste looptijd, of null bij flex. */
  vastTot: Datum | null
  /** Laatste contractdag als iemand op de startdag opzegt (het vroegst mogelijke einde). */
  vroegsteLaatsteDag: Datum
  /** Stopt het contract vanzelf na de looptijd? */
  stoptVanzelf: boolean
}

/** De eerste dag op of na `d` met dagnummer `dag` (1 tot en met 28). */
export function eersteFactuurdag(d: Datum, dag: number): Datum {
  const { jaar, maand, dag: nu } = delen(d)
  if (nu <= dag) return vanDelen(jaar, maand, Math.min(dag, dagenInMaand(jaar, maand)))
  const volgende = maand === 12 ? { jaar: jaar + 1, maand: 1 } : { jaar, maand: maand + 1 }
  return vanDelen(volgende.jaar, volgende.maand, dag)
}

function eerste(plan: VoorbeeldPlan, betaaltVanaf: Datum): Pick<Voorbeeld, 'eersteIncasso' | 'volgendeIncasso' | 'gratisTot'> {
  const termijn = cent(plan.bedragCent)
  const inschrijf = cent(plan.inschrijfkostenCent)
  const metDag = plan.factuurDag !== null && MAAND_INTERVALLEN.has(plan.interval)
  const anker = metDag && plan.factuurDag !== null ? eersteFactuurdag(betaaltVanaf, plan.factuurDag) : betaaltVanaf
  const maak = (op: Datum, bedragTermijn: Cent, isProRata: boolean, volgendeOp: Datum) => {
    const bedrag = plus(bedragTermijn, inschrijf)
    return {
      eersteIncasso: { op, bedrag, btw: btwUitInclusief(bedrag, plan.btwProcent).btw, termijn: bedragTermijn, inschrijfkosten: inschrijf, proRata: isProRata },
      volgendeIncasso: { op: volgendeOp, bedrag: termijn },
    }
  }
  if (anker === betaaltVanaf) return { ...maak(betaaltVanaf, termijn, false, periodeStart(anker, plan.interval, 1)), gratisTot: null }
  if (plan.proRataEerste) {
    const deel = proRata(termijn, { van: periodeStart(anker, plan.interval, -1), tot: anker }, { van: betaaltVanaf, tot: anker })
    return { ...maak(betaaltVanaf, deel, true, anker), gratisTot: null }
  }
  // Zonder pro rata: de dagen tot de factuurdag kosten niets, de eerste termijn valt op de factuurdag.
  return { ...maak(anker, termijn, false, periodeStart(anker, plan.interval, 1)), gratisTot: plusDagen(anker, -1) }
}

/** Het voorbeeld voor een lid dat op `start` begint. */
export function planVoorbeeld(plan: VoorbeeldPlan, start: Datum): Voorbeeld {
  const betaaltVanaf = plusDagen(start, plan.proefDagen)
  const voorwaarden = { eersteLooptijdMaanden: plan.contractMaanden, opzegtermijnDagen: plan.opzegtermijnDagen }
  const eindeLooptijd = eindeEersteLooptijd(start, voorwaarden)
  const vroegst = vroegsteEinde({ start, voorwaarden, opzegdatum: start })
  return {
    betaaltVanaf,
    ...eerste(plan, betaaltVanaf),
    vastTot: eindeLooptijd ? laatsteContractdag(eindeLooptijd) : null,
    vroegsteLaatsteDag: laatsteContractdag(vroegst),
    stoptVanzelf: plan.verlenging === 'geen' && eindeLooptijd !== null,
  }
}

const DAG = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/** "3 november 2026". */
export function datumTekst(d: Datum): string {
  return DAG.format(new Date(`${d}T12:00:00Z`))
}

/** "30 dagen", "1 dag" of "geen opzegtermijn". */
export function opzegTekst(dagen: number): string {
  if (dagen === 0) return 'zonder opzegtermijn'
  return `${dagen} ${dagen === 1 ? 'dag' : 'dagen'} opzegtermijn`
}

/** "12 maanden", "1 maand" of "flex". */
export function looptijdTekst(maanden: number | null): string {
  if (maanden === null) return 'Flex, maandelijks opzegbaar'
  return `${maanden} ${maanden === 1 ? 'maand' : 'maanden'}`
}
