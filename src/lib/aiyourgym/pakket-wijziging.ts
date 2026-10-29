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
// Minstens een pakket blijft altijd over: alles opzeggen is het abonnement
// opzeggen (Stripe Customer Portal).

import { isPakketSleutel, sorteerPakketten, type PakketSleutel } from './pakketten'
import { pakketVanPrijs } from './config'

export const PAKKET_ACTIES = ['erbij', 'opzeggen'] as const
export type PakketActie = (typeof PAKKET_ACTIES)[number]

export interface PakketVerzoek {
  pakket: PakketSleutel
  actie: PakketActie
}

export type VerzoekUitslag = { ok: true; waarde: PakketVerzoek } | { ok: false; fout: 'onbekend' | 'al' | 'niet' | 'laatste' }

/** Systeemgrens: { pakket, actie } van de pagina, getoetst aan wat er nu is afgenomen. */
export function leesPakketVerzoek(body: unknown, afgenomen: readonly PakketSleutel[]): VerzoekUitslag {
  const b = typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
  if (!isPakketSleutel(b.pakket) || !(PAKKET_ACTIES as readonly unknown[]).includes(b.actie)) return { ok: false, fout: 'onbekend' }
  const pakket = b.pakket
  const actie = b.actie as PakketActie
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
  /** Heeft dit pakket een Stripe-prijs en is er een sleutel (afsluitbaar)? */
  afsluitbaar: boolean
  /** Staat de testbetaling aan voor dit pakket (testbetalen)? */
  testbetalen: boolean
}

export function pakketWeg(i: WegInvoer): PakketWeg {
  if (i.platformEigenaar) return 'direct'
  if (i.stripeAbonnement) return i.actie === 'erbij' && i.afsluitbaar ? 'stripe' : 'aanvraag'
  return i.testbetalen ? 'test' : 'aanvraag'
}

/** De nieuwe lijst na een wijziging (nooit in place). */
export function naWijziging(afgenomen: readonly PakketSleutel[], v: PakketVerzoek): PakketSleutel[] {
  return v.actie === 'erbij' ? sorteerPakketten([...afgenomen, v.pakket]) : afgenomen.filter((p) => p !== v.pakket)
}

/**
 * De pakketten achter de prijzen van een Stripe-abonnement, of null als er een
 * prijs bij zit die we niet kennen (dan veranderen we niets: liever niets dan fout).
 */
export function pakkettenVanPrijzen(prijzen: readonly string[], env: Record<string, string | undefined> = process.env): PakketSleutel[] | null {
  if (prijzen.length === 0) return null
  const pakketten = prijzen.map((p) => pakketVanPrijs(p, env))
  if (pakketten.some((p) => p === null)) return null
  return sorteerPakketten(pakketten as PakketSleutel[])
}
