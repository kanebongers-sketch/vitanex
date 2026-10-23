// ─── Club, betalen: invoer van kortingen en gezinnen controleren (PUUR) ─────
// Een korting is een procent (1 tot 100) of een bedrag in centen per termijn,
// met een duur in termijnen, voor alle plannen of een plan, met een optionele
// code (uniek per sportschool, hoofdletters maken niet uit), een periode
// waarin hij geldt, een maximum aantal keer en aan of uit. De gezinskorting is
// een gezin plus een regel: vanaf het hoeveelste lid welke korting geldt. Het
// toepassen op facturen komt in een latere fase; hier alleen de instellingen.

import { isDatum } from '../contract/datum'
import { GRENS, type KortingSoort } from './model'
import { geheelTussen, goed, mis, object, schoneTekst, type Uitslag } from './invoer'

export const CODE_PATROON = /^[A-Za-z0-9_-]{3,30}$/

export interface KortingInvoer {
  naam: string
  code: string | null
  soort: KortingSoort
  waarde: number
  planId: string | null
  geldigVanaf: string | null
  geldigTot: string | null
  duurTermijnen: number | null
  maxGebruik: number | null
  vereistBewijs: boolean
  actief: boolean
}

/** Een code zoals de sportschool hem typt: spaties weg, hoofdletters (WELKOM2026). */
export function normaliseerCode(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const c = v.trim().toUpperCase()
  return c === '' ? null : c
}

/** Zijn twee codes dezelfde (de database vergelijkt zonder hoofdletters)? */
export function zelfdeCode(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

function leesWaarde(soort: unknown, waarde: unknown): Uitslag<{ soort: KortingSoort; waarde: number }> {
  if (soort === 'procent') {
    const n = geheelTussen(waarde, 1, GRENS.kortingProcentMax)
    return n === null ? mis('Een korting in procenten is een heel getal van 1 tot 100.') : goed({ soort, waarde: n })
  }
  if (soort === 'bedrag') {
    const n = geheelTussen(waarde, 1, GRENS.kortingBedragMax)
    return n === null ? mis('Een korting in euro is een bedrag van € 0,01 tot € 10.000,00 per termijn.') : goed({ soort, waarde: n })
  }
  return mis('Kies een korting in procenten of in euro.')
}

function leesPeriode(van: unknown, tot: unknown): Uitslag<{ van: string | null; tot: string | null }> {
  const v = van === null || van === undefined || van === '' ? null : van
  const t = tot === null || tot === undefined || tot === '' ? null : tot
  if (v !== null && !isDatum(v)) return mis('De begindatum klopt niet.')
  if (t !== null && !isDatum(t)) return mis('De einddatum klopt niet.')
  if (v !== null && t !== null && t < v) return mis('De einddatum ligt voor de begindatum.')
  return goed({ van: v, tot: t })
}

function optioneelGeheel(v: unknown, min: number, max: number, fout: string): Uitslag<number | null> {
  if (v === null || v === undefined || v === '') return goed(null)
  const n = geheelTussen(v, min, max)
  return n === null ? mis(fout) : goed(n)
}

/**
 * Lees en controleer een korting. `plannen` zijn de ids van de plannen van de
 * eigen sportschool; geldt de korting voor een plan, dan moet dat er een van zijn.
 */
export function leesKortingInvoer(body: unknown, plannen: readonly string[]): Uitslag<KortingInvoer> {
  const o = object(body)
  if (!o) return mis('Vul de korting in.')
  const naam = schoneTekst(o.naam)
  if (naam.length < GRENS.naamMin || naam.length > GRENS.naamMax) return mis(`Geef de korting een naam van ${GRENS.naamMin} tot ${GRENS.naamMax} tekens.`)
  const code = normaliseerCode(o.code)
  if (code !== null && !CODE_PATROON.test(code)) return mis('Een code is 3 tot 30 letters of cijfers (een koppelteken of liggend streepje mag), zonder spaties.')
  const waarde = leesWaarde(o.soort, o.waarde)
  if (!waarde.ok) return waarde
  const plan = o.planId === null || o.planId === undefined || o.planId === '' || o.planId === 'alle' ? null : o.planId
  if (plan !== null && (typeof plan !== 'string' || !plannen.includes(plan))) return mis('Dit plan hoort niet bij je sportschool.')
  const periode = leesPeriode(o.geldigVanaf, o.geldigTot)
  if (!periode.ok) return periode
  const duur = optioneelGeheel(o.duurTermijnen, 1, GRENS.kortingDuurMax, `De duur is 1 tot ${GRENS.kortingDuurMax} termijnen, of leeg voor de hele looptijd.`)
  if (!duur.ok) return duur
  const max = optioneelGeheel(o.maxGebruik, 1, GRENS.kortingGebruikMax, 'Het maximum aantal keer is een heel getal, of leeg voor onbeperkt.')
  if (!max.ok) return max
  return goed({
    naam,
    code,
    ...waarde.waarde,
    planId: plan,
    geldigVanaf: periode.waarde.van,
    geldigTot: periode.waarde.tot,
    duurTermijnen: duur.waarde,
    maxGebruik: max.waarde,
    vereistBewijs: o.vereistBewijs === true,
    actief: o.actief !== false,
  })
}

export function kortingRij(k: KortingInvoer): Record<string, unknown> {
  return {
    naam: k.naam,
    code: k.code,
    soort: k.soort,
    waarde: k.waarde,
    plan_id: k.planId,
    geldig_vanaf: k.geldigVanaf,
    geldig_tot: k.geldigTot,
    duur_termijnen: k.duurTermijnen,
    max_gebruik: k.maxGebruik,
    vereist_bewijs: k.vereistBewijs,
    actief: k.actief,
  }
}

// ─── Gezinnen ───────────────────────────────────────────────────────────────

export interface GezinInvoer {
  naam: string | null
  vanaf: number
  kortingId: string | null
}

/** Een gezin met zijn regel. `kortingen` zijn de ids van de kortingen van de eigen sportschool. */
export function leesGezinInvoer(body: unknown, kortingen: readonly string[]): Uitslag<GezinInvoer> {
  const o = object(body)
  if (!o) return mis('Vul het gezin in.')
  const naam = schoneTekst(o.naam)
  if (naam.length > GRENS.gezinNaamMax) return mis(`De naam is hooguit ${GRENS.gezinNaamMax} tekens.`)
  const vanaf = geheelTussen(o.vanaf ?? 2, GRENS.gezinVanafMin, GRENS.gezinVanafMax)
  if (vanaf === null) return mis(`De gezinskorting geldt vanaf het ${GRENS.gezinVanafMin}e tot het ${GRENS.gezinVanafMax}e lid.`)
  const korting = o.kortingId === null || o.kortingId === undefined || o.kortingId === '' ? null : o.kortingId
  if (korting !== null && (typeof korting !== 'string' || !kortingen.includes(korting))) return mis('Deze korting hoort niet bij je sportschool.')
  return goed({ naam: naam === '' ? null : naam, vanaf, kortingId: korting })
}

export function gezinRij(g: GezinInvoer): Record<string, unknown> {
  return { naam: g.naam, gezin_volgorde_vanaf: g.vanaf, korting_id: g.kortingId }
}

/** Krijgt het lid met dit volgnummer in het gezin (1 = het eerste) de gezinskorting? */
export function gezinsKortingGeldt(volgnummer: number, vanaf: number): boolean {
  return Number.isSafeInteger(volgnummer) && volgnummer >= vanaf
}
