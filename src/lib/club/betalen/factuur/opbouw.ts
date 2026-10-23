// ─── Club, betalen: factuurregels opbouwen (PUUR) ───────────────────────────
// Van contract, periode, kortingen en gezinskorting naar factuurregels met btw
// en totalen. Alle bedragen zijn inclusief btw (prijzen voor leden).
//
// Volgorde en regels:
// 1. Planregel: het periodebedrag, of pro rata per dag als `deel` gegeven is.
// 2. Kortingen in de gegeven volgorde, elk over wat er na de vorige korting
//    over is (stapelen, niet optellen). Een korting maakt de planregel nooit
//    negatief: een te grote korting wordt begrensd op wat er over is.
// 3. Gezinskorting als laatste, over wat er dan nog over is.
// 4. Extra regels (inschrijfkosten, losse diensten) met hun eigen tarief.
// Een korting krijgt het btw-tarief van de planregel. Btw per regel en de
// uitsplitsing per tarief komen uit geld/btw.ts.

import { formatEuro, kleinste, maalBreuk, min, negatief, NUL, plus, type Cent } from '../geld/cent'
import { btwPerTarief, btwTotalen, btwUitInclusief, type BtwTotalen, type BtwUitsplitsing } from '../geld/btw'
import type { BtwProcent } from '../geld/btw-tarieven'
import { delen, plusDagen, type Datum } from '../contract/datum'
import { proRata, type Periode } from '../contract/periodes'

export type Korting =
  /** Procent met hooguit twee decimalen (12,5 mag), tussen 0 en 100. */
  | { soort: 'procent'; procent: number; omschrijving: string }
  /** Vast bedrag inclusief btw (0 of meer). */
  | { soort: 'bedrag'; bedrag: Cent; omschrijving: string }

export interface ExtraRegel {
  omschrijving: string
  bedrag: Cent
  btwProcent: BtwProcent
}

export interface FactuurOpbouwInvoer {
  plan: { naam: string; bedrag: Cent; btwProcent: BtwProcent }
  periode: Periode
  /** Alleen dit deel van de periode factureren (pro rata per dag), of null voor de hele periode. */
  deel: Periode | null
  kortingen: readonly Korting[]
  /** Gezinskorting in procent (zelfde regels als een procentkorting), of null. */
  gezinskorting: { procent: number; omschrijving: string } | null
  extraRegels: readonly ExtraRegel[]
}

export type RegelSoort = 'plan' | 'korting' | 'gezinskorting' | 'extra'

export interface Factuurregel {
  soort: RegelSoort
  omschrijving: string
  /** Inclusief btw; negatief bij een korting. */
  bedrag: Cent
  btwProcent: BtwProcent
  grondslag: Cent
  btw: Cent
}

export interface FactuurOpbouw {
  regels: Factuurregel[]
  perTarief: BtwUitsplitsing[]
  totalen: BtwTotalen
}

/** Procent naar honderdsten van een procent (12,5 wordt 1250). Gooit bij meer dan twee decimalen of buiten 0 tot 100. */
export function procentInHonderdsten(procent: number): number {
  const h = Math.round(procent * 100)
  if (!Number.isFinite(procent) || Math.abs(h - procent * 100) > 1e-6 || h < 0 || h > 10000) {
    throw new RangeError(`Ongeldig kortingspercentage: ${String(procent)}`)
  }
  return h
}

function datumNl(d: Datum): string {
  const { jaar, maand, dag } = delen(d)
  return `${String(dag).padStart(2, '0')}-${String(maand).padStart(2, '0')}-${jaar}`
}

/** "01-03-2026 t/m 31-03-2026" voor een periode met exclusief einde. */
export function periodeTekst(p: Periode): string {
  return `${datumNl(p.van)} t/m ${datumNl(plusDagen(p.tot, -1))}`
}

function regel(soort: RegelSoort, omschrijving: string, bedrag: Cent, btwProcent: BtwProcent): Factuurregel {
  const b = btwUitInclusief(bedrag, btwProcent)
  return { soort, omschrijving, bedrag, btwProcent, grondslag: b.grondslag, btw: b.btw }
}

function kortingBedrag(k: Korting, over: Cent): Cent {
  const ruw = k.soort === 'procent' ? maalBreuk(over, procentInHonderdsten(k.procent), 10000) : k.bedrag
  if (ruw < 0) throw new RangeError('Een korting kan niet negatief zijn')
  return kleinste(ruw, over)
}

export function bouwFactuur(invoer: FactuurOpbouwInvoer): FactuurOpbouw {
  const { plan, periode, deel } = invoer
  if (plan.bedrag < 0) throw new RangeError('Het bedrag van een plan kan niet negatief zijn')
  const factuurPeriode = deel ?? periode
  const planBedrag = deel ? proRata(plan.bedrag, periode, deel) : plan.bedrag
  const proRataTekst = deel && (deel.van !== periode.van || deel.tot !== periode.tot) ? ` (naar rato van ${formatEuro(plan.bedrag)})` : ''
  const regels: Factuurregel[] = [regel('plan', `${plan.naam} ${periodeTekst(factuurPeriode)}${proRataTekst}`, planBedrag, plan.btwProcent)]

  let over = planBedrag
  const kortingen: { soort: RegelSoort; k: Korting }[] = [
    ...invoer.kortingen.map((k) => ({ soort: 'korting' as const, k })),
    ...(invoer.gezinskorting ? [{ soort: 'gezinskorting' as const, k: { soort: 'procent' as const, ...invoer.gezinskorting } }] : []),
  ]
  for (const { soort, k } of kortingen) {
    const bedrag = kortingBedrag(k, over)
    if (bedrag === NUL) continue
    regels.push(regel(soort, k.omschrijving, negatief(bedrag), plan.btwProcent))
    over = min(over, bedrag)
  }
  for (const e of invoer.extraRegels) {
    if (e.bedrag < 0) throw new RangeError('Een extra regel kan niet negatief zijn; gebruik een creditnota')
    regels.push(regel('extra', e.omschrijving, e.bedrag, e.btwProcent))
  }

  const perTarief = btwPerTarief(regels.map((r) => ({ bedrag: r.bedrag, procent: r.btwProcent })))
  const totalen = btwTotalen(perTarief)
  const somRegels = regels.reduce<Cent>((s, r) => plus(s, r.bedrag), NUL)
  if (somRegels !== totalen.totaal) throw new Error('Interne fout: factuurtotaal klopt niet met de regels')
  return { regels, perTarief, totalen }
}
