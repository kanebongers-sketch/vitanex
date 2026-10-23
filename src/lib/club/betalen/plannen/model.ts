// ─── Club, betalen: plannen, prijsversies, kortingen en gezinnen (PUUR) ─────
// Het aanbod van lidgeld (migratie 460): per lidmaatschapsvorm een of meer
// plannen met prijs en contract ("12 maanden", "Flex"), prijsversies met een
// ingangsdatum, kortingen en acties, en gezinnen voor de gezinskorting.
// Bedragen zijn hele centen inclusief btw. Datums zijn kalenderdagen in
// Nederland ("jjjj-mm-dd"). Alles wat uit de database komt gaat door de
// *UitRij-functies (systeemgrens).

import { INTERVALLEN, type Interval } from '../contract/periodes'
import { isDatum } from '../contract/datum'
import { isBekendBtwProcent, type BtwProcent } from '../geld/btw-tarieven'

export { INTERVALLEN, type Interval }

export const INTERVAL_LABEL: Record<Interval, string> = {
  week: 'Per week',
  vier_weken: 'Per vier weken',
  maand: 'Per maand',
  kwartaal: 'Per kwartaal',
  jaar: 'Per jaar',
}

/** Kort, achter een bedrag: "€ 39,95 per maand". */
export const INTERVAL_KORT: Record<Interval, string> = {
  week: 'per week',
  vier_weken: 'per vier weken',
  maand: 'per maand',
  kwartaal: 'per kwartaal',
  jaar: 'per jaar',
}

/** Intervallen die op een dag van de maand kunnen worden gefactureerd. */
export const MAAND_INTERVALLEN: ReadonlySet<Interval> = new Set(['maand', 'kwartaal', 'jaar'])

export const DOELGROEPEN = ['iedereen', 'student', 'jeugd', 'senior', 'bedrijf'] as const
export type Doelgroep = (typeof DOELGROEPEN)[number]

export const DOELGROEP_LABEL: Record<Doelgroep, string> = {
  iedereen: 'Iedereen',
  student: 'Studenten',
  jeugd: 'Jeugd',
  senior: 'Senioren',
  bedrijf: 'Bedrijven',
}

/** Wat de database toestaat bij verlengen (de wet staat alleen onbepaald toe, zie contract/regels.ts). */
export const PLAN_VERLENGINGEN = ['onbepaald', 'geen'] as const
export type PlanVerlenging = (typeof PLAN_VERLENGINGEN)[number]

/** Grenzen, gelijk aan de check-regels van migratie 460. */
export const GRENS = {
  naamMin: 2,
  naamMax: 80,
  /** Stripe rekent minimaal 50 cent af. */
  bedragMin: 50,
  bedragMax: 1_000_000,
  inschrijfMax: 100_000,
  proefMax: 60,
  /** De database staat 36 toe; de wet (contract/regels.ts) begrenst verder. */
  looptijdMax: 36,
  factuurDagMax: 28,
  vestigingenMax: 60,
  kortingProcentMax: 100,
  kortingBedragMax: 1_000_000,
  kortingDuurMax: 60,
  kortingGebruikMax: 100_000,
  gezinVanafMin: 2,
  gezinVanafMax: 10,
  gezinNaamMax: 80,
  /** Een prijswijziging mag hooguit zo ver vooruit worden gepland. */
  prijsVooruitDagen: 366,
} as const

export interface Plan {
  id: string
  vormId: string
  naam: string
  actief: boolean
  interval: Interval
  /** Prijs per termijn in centen, inclusief btw (de prijs van de plan-rij zelf). */
  bedragCent: number
  btwProcent: BtwProcent
  /** null = meteen onbepaalde tijd (flex). */
  contractMaanden: number | null
  opzegtermijnDagen: number
  verlenging: PlanVerlenging
  proefDagen: number
  inschrijfkostenCent: number
  /** null = alle vestigingen. */
  vestigingen: string[] | null
  doelgroep: Doelgroep
  vereistBewijs: boolean
  /** null = de startdag van het contract. */
  factuurDag: number | null
  proRataEerste: boolean
  volgorde: number
}

export interface PlanPrijs {
  id: string
  planId: string
  bedragCent: number
  btwProcent: BtwProcent
  geldigVanaf: string
  aangekondigdOp: string | null
}

export const KORTING_SOORTEN = ['procent', 'bedrag'] as const
export type KortingSoort = (typeof KORTING_SOORTEN)[number]

export interface Korting {
  id: string
  naam: string
  /** null = zonder code (de sportschool kent hem zelf toe). */
  code: string | null
  soort: KortingSoort
  /** Procent (1 tot 100) of centen per termijn. */
  waarde: number
  /** null = voor alle plannen. */
  planId: string | null
  geldigVanaf: string | null
  geldigTot: string | null
  /** Aantal termijnen; null = de hele looptijd. */
  duurTermijnen: number | null
  maxGebruik: number | null
  gebruikt: number
  vereistBewijs: boolean
  actief: boolean
}

export interface Gezin {
  id: string
  naam: string | null
  hoofdLidId: string | null
  /** De gezinskorting geldt vanaf dit hoeveelste lid (2 = vanaf het tweede). */
  vanaf: number
  kortingId: string | null
}

export const PLAN_KOLOMMEN =
  'id, vorm_id, naam, actief, interval_soort, bedrag_cent, btw_procent, contract_maanden, opzegtermijn_dagen, verlenging, proef_dagen, inschrijfkosten_cent, vestigingen, doelgroep, vereist_bewijs, factuur_dag, pro_rata_eerste, volgorde'
export const PRIJS_KOLOMMEN = 'id, plan_id, bedrag_cent, btw_procent, geldig_vanaf, aangekondigd_op'
export const KORTING_KOLOMMEN =
  'id, naam, code, soort, waarde, plan_id, geldig_vanaf, geldig_tot, duur_termijnen, max_gebruik, gebruikt, vereist_bewijs, actief'
export const GEZIN_KOLOMMEN = 'id, naam, hoofd_lid_id, gezin_volgorde_vanaf, korting_id'

type Rij = Record<string, unknown>

function rij(v: unknown): Rij | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Rij) : null
}

function tekst(v: unknown): string | null {
  return typeof v === 'string' && v !== '' ? v : null
}

function geheel(v: unknown): number | null {
  return typeof v === 'number' && Number.isSafeInteger(v) ? v : null
}

function datumOfNull(v: unknown): string | null {
  return isDatum(v) ? v : null
}

function lijst(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null
  const l = v.filter((x): x is string => typeof x === 'string' && x !== '')
  return l.length > 0 ? l : null
}

function isInterval(v: unknown): v is Interval {
  return typeof v === 'string' && (INTERVALLEN as readonly string[]).includes(v)
}

export function isDoelgroep(v: unknown): v is Doelgroep {
  return typeof v === 'string' && (DOELGROEPEN as readonly string[]).includes(v)
}

export function planUitRij(ruw: unknown): Plan | null {
  const r = rij(ruw)
  const id = tekst(r?.id)
  const vormId = tekst(r?.vorm_id)
  const naam = tekst(r?.naam)
  const bedrag = geheel(r?.bedrag_cent)
  if (!r || !id || !vormId || !naam || bedrag === null || !isInterval(r.interval_soort) || !isBekendBtwProcent(r.btw_procent)) return null
  return {
    id,
    vormId,
    naam,
    actief: r.actief !== false,
    interval: r.interval_soort,
    bedragCent: bedrag,
    btwProcent: r.btw_procent,
    contractMaanden: geheel(r.contract_maanden),
    opzegtermijnDagen: geheel(r.opzegtermijn_dagen) ?? 30,
    verlenging: r.verlenging === 'geen' ? 'geen' : 'onbepaald',
    proefDagen: geheel(r.proef_dagen) ?? 0,
    inschrijfkostenCent: geheel(r.inschrijfkosten_cent) ?? 0,
    vestigingen: lijst(r.vestigingen),
    doelgroep: isDoelgroep(r.doelgroep) ? r.doelgroep : 'iedereen',
    vereistBewijs: r.vereist_bewijs === true,
    factuurDag: geheel(r.factuur_dag),
    proRataEerste: r.pro_rata_eerste !== false,
    volgorde: geheel(r.volgorde) ?? 0,
  }
}

export function prijsUitRij(ruw: unknown): PlanPrijs | null {
  const r = rij(ruw)
  const id = tekst(r?.id)
  const planId = tekst(r?.plan_id)
  const bedrag = geheel(r?.bedrag_cent)
  const vanaf = datumOfNull(r?.geldig_vanaf)
  if (!r || !id || !planId || bedrag === null || !vanaf || !isBekendBtwProcent(r.btw_procent)) return null
  return { id, planId, bedragCent: bedrag, btwProcent: r.btw_procent, geldigVanaf: vanaf, aangekondigdOp: tekst(r.aangekondigd_op) }
}

export function kortingUitRij(ruw: unknown): Korting | null {
  const r = rij(ruw)
  const id = tekst(r?.id)
  const naam = tekst(r?.naam)
  const waarde = geheel(r?.waarde)
  if (!r || !id || !naam || waarde === null || (r.soort !== 'procent' && r.soort !== 'bedrag')) return null
  return {
    id,
    naam,
    code: tekst(r.code),
    soort: r.soort,
    waarde,
    planId: tekst(r.plan_id),
    geldigVanaf: datumOfNull(r.geldig_vanaf),
    geldigTot: datumOfNull(r.geldig_tot),
    duurTermijnen: geheel(r.duur_termijnen),
    maxGebruik: geheel(r.max_gebruik),
    gebruikt: geheel(r.gebruikt) ?? 0,
    vereistBewijs: r.vereist_bewijs === true,
    actief: r.actief !== false,
  }
}

export function gezinUitRij(ruw: unknown): Gezin | null {
  const r = rij(ruw)
  const id = tekst(r?.id)
  if (!r || !id) return null
  return { id, naam: tekst(r.naam), hoofdLidId: tekst(r.hoofd_lid_id), vanaf: geheel(r.gezin_volgorde_vanaf) ?? 2, kortingId: tekst(r.korting_id) }
}

export function rijenNaar<T>(rijen: readonly unknown[] | null | undefined, naar: (r: unknown) => T | null): T[] {
  return (rijen ?? []).flatMap((r) => {
    const x = naar(r)
    return x ? [x] : []
  })
}

/** Actieve plannen eerst, dan op volgorde en naam. */
export function sorteerPlannen(lijstIn: readonly Plan[]): Plan[] {
  const nl = new Intl.Collator('nl', { sensitivity: 'base', numeric: true })
  return [...lijstIn].sort((a, b) => {
    if (a.actief !== b.actief) return a.actief ? -1 : 1
    return a.volgorde - b.volgorde || nl.compare(a.naam, b.naam)
  })
}
