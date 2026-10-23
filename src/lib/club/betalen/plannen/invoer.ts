// ─── Club, betalen: invoer van een plan controleren (PUUR) ──────────────────
// Systeemgrens: alles van de pagina wordt hier gecontroleerd voordat het de
// database in gaat. Bedragen zijn hele centen binnen de grenzen van migratie
// 460, het btw-tarief komt uit het regelbestand (btw-tarieven.ts), looptijd,
// opzegtermijn en verlenging gaan langs de wetregels (contract/regels.ts) en
// vestigingen moeten bij de eigen sportschool horen.

import { controleerVoorwaarden } from '../contract/regels'
import { isBekendBtwProcent, type BtwProcent } from '../geld/btw-tarieven'
import { DOELGROEPEN, GRENS, INTERVALLEN, MAAND_INTERVALLEN, isDoelgroep, type Doelgroep, type Interval, type PlanVerlenging } from './model'

export type Uitslag<T> = { ok: true; waarde: T } | { ok: false; fout: string }

export function mis<T>(fout: string): Uitslag<T> {
  return { ok: false, fout }
}

export function goed<T>(waarde: T): Uitslag<T> {
  return { ok: true, waarde }
}

export function object(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

export function schoneTekst(v: unknown): string {
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : ''
}

/** Een geheel getal tussen min en max (ook als tekst "12"), of null als het niet klopt. */
export function geheelTussen(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : Number.NaN
  return Number.isSafeInteger(n) && n >= min && n <= max ? n : null
}

function leeg(v: unknown): boolean {
  return v === null || v === undefined || v === ''
}

export interface PlanInvoer {
  naam: string
  interval: Interval
  bedragCent: number
  btwProcent: BtwProcent
  contractMaanden: number | null
  opzegtermijnDagen: number
  verlenging: PlanVerlenging
  proefDagen: number
  inschrijfkostenCent: number
  vestigingen: string[] | null
  doelgroep: Doelgroep
  vereistBewijs: boolean
  factuurDag: number | null
  proRataEerste: boolean
  actief: boolean
  volgorde: number
}

/** Vestigingen: null of 'alle' = alle; anders alleen slugs van de eigen sportschool. Alles aangevinkt = alle. */
export function leesPlanVestigingen(v: unknown, eigen: readonly string[]): Uitslag<string[] | null> {
  if (leeg(v) || v === 'alle') return goed(null)
  if (!Array.isArray(v) || !v.every((s) => typeof s === 'string')) return mis('Kies de vestigingen.')
  const lijst = [...new Set(v)]
  if (lijst.length === 0) return mis('Kies minstens een vestiging, of alle vestigingen.')
  if (lijst.length > GRENS.vestigingenMax) return mis('Te veel vestigingen gekozen.')
  if (lijst.some((s) => !eigen.includes(s))) return mis('Een van de vestigingen hoort niet bij je sportschool.')
  return goed(lijst.length === new Set(eigen).size ? null : eigen.filter((s) => lijst.includes(s)))
}

function leesBedrag(v: unknown): Uitslag<number> {
  const n = geheelTussen(v, GRENS.bedragMin, GRENS.bedragMax)
  return n === null ? mis('De prijs is een bedrag van € 0,50 tot € 10.000,00 per termijn.') : goed(n)
}

function leesLooptijd(v: unknown): Uitslag<number | null> {
  if (leeg(v) || v === 0) return goed(null)
  const n = geheelTussen(v, 1, GRENS.looptijdMax)
  return n === null ? mis('De looptijd is een heel aantal maanden, of leeg voor flex.') : goed(n)
}

function leesFactuurDag(v: unknown, interval: Interval): Uitslag<number | null> {
  if (leeg(v)) return goed(null)
  const n = geheelTussen(v, 1, GRENS.factuurDagMax)
  if (n === null) return mis('De factuurdag is een dag van 1 tot en met 28, of leeg voor de startdag.')
  if (!MAAND_INTERVALLEN.has(interval)) return mis('Een vaste factuurdag kan alleen bij per maand, per kwartaal of per jaar.')
  return goed(n)
}

interface Contract {
  contractMaanden: number | null
  opzegtermijnDagen: number
  verlenging: PlanVerlenging
}

/** Looptijd, opzegtermijn en verlenging, langs de wet (Wet van Dam, zie contract/regels.ts). */
function leesContract(o: Record<string, unknown>): Uitslag<Contract> {
  const looptijd = leesLooptijd(o.contractMaanden)
  if (!looptijd.ok) return looptijd
  const opzeg = geheelTussen(o.opzegtermijnDagen ?? 30, 0, 90)
  if (opzeg === null) return mis('De opzegtermijn is een heel aantal dagen.')
  const verlenging = o.verlenging === undefined ? 'onbepaald' : o.verlenging
  if (verlenging !== 'onbepaald' && verlenging !== 'geen') return mis('Kies wat er gebeurt na de looptijd.')
  if (verlenging === 'geen' && looptijd.waarde === null) return mis('Een plan dat vanzelf stopt, heeft een looptijd nodig.')
  const fouten = controleerVoorwaarden({
    eersteLooptijdMaanden: looptijd.waarde,
    opzegtermijnDagen: opzeg,
    verlenging,
    // Club laat leden altijd online opzeggen in de ledenapp.
    onlineAfsluiten: true,
    onlineOpzeggen: true,
  })
  if (fouten.length > 0) return mis(fouten[0].melding)
  return goed({ contractMaanden: looptijd.waarde, opzegtermijnDagen: opzeg, verlenging })
}

function leesBasis(o: Record<string, unknown>): Uitslag<Pick<PlanInvoer, 'naam' | 'interval' | 'bedragCent' | 'btwProcent'>> {
  const naam = schoneTekst(o.naam)
  if (naam.length < GRENS.naamMin || naam.length > GRENS.naamMax) return mis(`Geef het plan een naam van ${GRENS.naamMin} tot ${GRENS.naamMax} tekens.`)
  const interval = o.interval
  if (typeof interval !== 'string' || !(INTERVALLEN as readonly string[]).includes(interval)) return mis('Kies hoe vaak er wordt betaald.')
  const bedrag = leesBedrag(o.bedragCent)
  if (!bedrag.ok) return bedrag
  const btw = typeof o.btwProcent === 'string' ? Number(o.btwProcent) : o.btwProcent
  if (!isBekendBtwProcent(btw)) return mis('Kies een btw-tarief.')
  return goed({ naam, interval: interval as Interval, bedragCent: bedrag.waarde, btwProcent: btw })
}

function leesExtra(o: Record<string, unknown>, interval: Interval): Uitslag<Pick<PlanInvoer, 'proefDagen' | 'inschrijfkostenCent' | 'doelgroep' | 'factuurDag' | 'volgorde'>> {
  const proef = geheelTussen(o.proefDagen ?? 0, 0, GRENS.proefMax)
  if (proef === null) return mis(`Proefdagen is een heel aantal van 0 tot ${GRENS.proefMax}.`)
  const inschrijf = geheelTussen(o.inschrijfkostenCent ?? 0, 0, GRENS.inschrijfMax)
  if (inschrijf === null) return mis('De inschrijfkosten zijn een bedrag van € 0,00 tot € 1.000,00.')
  const doelgroep = o.doelgroep ?? 'iedereen'
  if (!isDoelgroep(doelgroep)) return mis(`Kies een doelgroep: ${DOELGROEPEN.join(', ')}.`)
  const dag = leesFactuurDag(o.factuurDag, interval)
  if (!dag.ok) return dag
  const volgorde = geheelTussen(o.volgorde ?? 0, 0, 1000)
  if (volgorde === null) return mis('De volgorde is een heel getal.')
  return goed({ proefDagen: proef, inschrijfkostenCent: inschrijf, doelgroep, factuurDag: dag.waarde, volgorde })
}

/** Lees en controleer een heel plan. `vestigingen` zijn de slugs van de eigen sportschool. */
export function leesPlanInvoer(body: unknown, vestigingen: readonly string[]): Uitslag<PlanInvoer> {
  const o = object(body)
  if (!o) return mis('Vul het plan in.')
  const basis = leesBasis(o)
  if (!basis.ok) return basis
  const contract = leesContract(o)
  if (!contract.ok) return contract
  const extra = leesExtra(o, basis.waarde.interval)
  if (!extra.ok) return extra
  const vest = leesPlanVestigingen(o.vestigingen, vestigingen)
  if (!vest.ok) return vest
  return goed({
    ...basis.waarde,
    ...contract.waarde,
    ...extra.waarde,
    vestigingen: vest.waarde,
    vereistBewijs: o.vereistBewijs === true,
    proRataEerste: o.proRataEerste !== false,
    actief: o.actief !== false,
  })
}

/** De rij voor club_betalen_plannen (zonder user_id en vorm_id). */
export function planRij(p: PlanInvoer): Record<string, unknown> {
  return {
    naam: p.naam,
    interval_soort: p.interval,
    bedrag_cent: p.bedragCent,
    btw_procent: p.btwProcent,
    contract_maanden: p.contractMaanden,
    opzegtermijn_dagen: p.opzegtermijnDagen,
    verlenging: p.verlenging,
    proef_dagen: p.proefDagen,
    inschrijfkosten_cent: p.inschrijfkostenCent,
    vestigingen: p.vestigingen,
    doelgroep: p.doelgroep,
    vereist_bewijs: p.vereistBewijs,
    factuur_dag: p.factuurDag,
    pro_rata_eerste: p.proRataEerste,
    actief: p.actief,
    volgorde: p.volgorde,
  }
}
