// ─── AI Your Gym: een pakket erbij nemen of opzeggen (PUUR) ─────────────────
// Besluit Kane (29-10-2026): een sportschool neemt losse pakketten af en kan er
// in Club (Abonnement) een bij nemen of een opzeggen. Eerlijk:
//   - Erbij met een lopend Stripe-abonnement en een prijs voor dat pakket: een
//     nieuwe regel op het abonnement (Stripe rekent zelf naar rato). De webhook
//     zet daarna precies de afgenomen pakketten; wij zetten hem ook meteen.
//   - Erbij zonder Stripe (testbetaling, besluit Kane 23-10-2026): meteen aan,
//     er wordt niets afgeschreven.
//   - Anders, en opzeggen bij een echt (Stripe-)contract: een aanvraag. Het
//     contract is een jaarcontract; Kane verwerkt het volgens dat contract.
//   - Het master account (Kane) zet pakketten direct, voor elke sportschool.
//   - Opzeggen bij een echt contract is altijd een aanvraag volgens het
//     jaarcontract: Kane verwerkt die.
//   - Staffels (besluit Kane 31-10-2026): elke vestiging heeft een eigen
//     abonnement; een pakket erbij komt op elk abonnement, met de hoeveelheid
//     (actieve leden) van dat abonnement. Geen bundel meer.
// Basis met add-ons (besluit Kane 31-10-2026): de basis (Ledenadministratie)
// is niet op te zeggen zolang het abonnement loopt, ook niet door het master
// account; alleen add-ons gaan erbij of eraf. Helemaal stoppen is het
// abonnement opzeggen (Stripe Customer Portal). Elke lijst houdt de basis (metBasis).

import { isBasis, isPakketSleutel, metBasis, type PakketSleutel } from './pakketten'
import { pakketVanPrijs } from './config'

export const PAKKET_ACTIES = ['erbij', 'opzeggen'] as const
export type PakketActie = (typeof PAKKET_ACTIES)[number]

export interface PakketVerzoek {
  pakket: PakketSleutel
  actie: PakketActie
}

export type VerzoekUitslag = { ok: true; waarde: PakketVerzoek } | { ok: false; fout: 'onbekend' | 'al' | 'niet' | 'basis' | 'laatste' }

/** Systeemgrens: { pakket, actie } van de pagina, getoetst aan wat er nu is afgenomen. */
export function leesPakketVerzoek(body: unknown, afgenomen: readonly PakketSleutel[]): VerzoekUitslag {
  const b = typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
  if (!isPakketSleutel(b.pakket) || !(PAKKET_ACTIES as readonly unknown[]).includes(b.actie)) return { ok: false, fout: 'onbekend' }
  const pakket = b.pakket
  const actie = b.actie as PakketActie
  if (actie === 'opzeggen' && isBasis(pakket)) return { ok: false, fout: 'basis' }
  if (actie === 'erbij' && afgenomen.includes(pakket)) return { ok: false, fout: 'al' }
  if (actie === 'opzeggen' && !afgenomen.includes(pakket)) return { ok: false, fout: 'niet' }
  if (actie === 'opzeggen' && afgenomen.length <= 1) return { ok: false, fout: 'laatste' }
  return { ok: true, waarde: { pakket, actie } }
}

/** Hoe een wijziging loopt: via Stripe, meteen (testbetaling of master account), of als aanvraag. */
export type PakketWeg = 'stripe' | 'test' | 'direct' | 'aanvraag'

export interface WegInvoer {
  actie: PakketActie
  /** Het master account (Kane) zet pakketten direct. */
  platformEigenaar: boolean
  /** Heeft de sportschool een lopend Stripe-abonnement? */
  stripeAbonnement: boolean
  /** Kan de nieuwe set pakketten via Stripe (sleutel en een prijs per pakket)? */
  afsluitbaar: boolean
  /** Staat de testbetaling aan voor dit pakket (testbetalen)? */
  testbetalen: boolean
}

export function pakketWeg(i: WegInvoer): PakketWeg {
  if (i.platformEigenaar) return 'direct'
  // Opzeggen bij een echt contract is altijd een aanvraag (jaarcontract).
  if (i.stripeAbonnement) return i.actie === 'erbij' && i.afsluitbaar ? 'stripe' : 'aanvraag'
  return i.testbetalen ? 'test' : 'aanvraag'
}

/** De nieuwe lijst na een wijziging (nooit in place); de basis blijft altijd. */
export function naWijziging(afgenomen: readonly PakketSleutel[], v: PakketVerzoek): PakketSleutel[] {
  return metBasis(v.actie === 'erbij' ? [...afgenomen, v.pakket] : afgenomen.filter((p) => p !== v.pakket || isBasis(p)))
}

/**
 * De pakketten achter de prijzen van een Stripe-abonnement, of null als er een
 * prijs bij zit die we niet kennen (dan veranderen we niets: liever niets dan fout).
 * De basis staat er altijd in (besluit Kane 31-10-2026), ook als Stripe hem mist.
 */
export function pakkettenVanPrijzen(prijzen: readonly string[], env: Record<string, string | undefined> = process.env): PakketSleutel[] | null {
  if (prijzen.length === 0) return null
  const pakketten = prijzen.map((p) => pakketVanPrijs(p, env))
  if (pakketten.some((p) => p === null)) return null
  return metBasis(pakketten as PakketSleutel[])
}

/** Een regel van een lopend Stripe-abonnement (subscription item). */
export interface AbonnementRegel {
  /** si_... */
  id: string
  prijsId: string
  aantal: number | null
}

/** De regels van een Stripe-abonnement (ruwe JSON van GET /v1/subscriptions/:id), of null. */
export function leesAbonnementRegels(json: unknown): AbonnementRegel[] | null {
  const s = typeof json === 'object' && json !== null ? (json as Record<string, unknown>) : null
  const data = (s?.items as { data?: unknown } | undefined)?.data
  if (typeof s?.id !== 'string' || !Array.isArray(data)) return null
  return data.flatMap((ruw) => {
    const r = typeof ruw === 'object' && ruw !== null ? (ruw as Record<string, unknown>) : {}
    const prijs = r.price
    const prijsId = typeof prijs === 'string' ? prijs : typeof prijs === 'object' && prijs !== null ? (prijs as { id?: unknown }).id : null
    if (typeof r.id !== 'string' || !r.id.startsWith('si_') || typeof prijsId !== 'string' || !prijsId.startsWith('price_')) return []
    return [{ id: r.id, prijsId, aantal: typeof r.quantity === 'number' && Number.isInteger(r.quantity) && r.quantity > 0 ? r.quantity : null }]
  })
}

/** Wat er op het abonnement verandert: regels (si_...) weg en prijzen erbij. */
export interface RegelWissel {
  weg: string[]
  erbij: string[]
}

/**
 * Van de regels nu naar de doelprijzen (PUUR). Alleen regels met een prijs van
 * ons (eigenPrijzen) gaan weg; iets anders op het abonnement blijft staan. Een
 * prijs die er al staat komt er niet nog eens bij. Leeg = er hoeft niets
 * (idempotent: nog een keer klikken doet niets).
 */
export function regelWissel(huidig: readonly AbonnementRegel[], doel: readonly string[], eigen: readonly string[]): RegelWissel {
  return {
    weg: huidig.filter((r) => eigen.includes(r.prijsId) && !doel.includes(r.prijsId)).map((r) => r.id),
    erbij: doel.filter((p) => !huidig.some((r) => r.prijsId === p)),
  }
}

export function wisselLeeg(w: RegelWissel): boolean {
  return w.weg.length === 0 && w.erbij.length === 0
}

/** De hoeveelheid (actieve leden) op het abonnement: van een eigen regel, anders de terugval. */
export function aantalVanRegels(huidig: readonly AbonnementRegel[], eigen: readonly string[], terugval: number): number {
  return huidig.find((r) => eigen.includes(r.prijsId) && r.aantal !== null)?.aantal ?? terugval
}
