// ─── Club, lidgeld-inbox: eerst ophalen, dan verwerken ──────────────────────
// Bouwplan 1.2. Per geclaimd event halen we het object actueel op bij Stripe
// (kop Stripe-Account), controleren de koppeling met onze betaling (account,
// sportschool, factuur, bedrag) en passen een overgang toe die alleen vooruit
// kan. Volgorde en herhaling maken zo niet uit. Klopt er iets niet: status
// 'afwijkend' plus een melding, nooit een boeking.

import type { StripeUitkomst } from '../stripe-api'
import { leesAccount } from '../stripe-event'
import { naMislukking } from '../outbox/wachten'
import type { StripeLezer } from '../outbox/stripe-client'
import { controleerKoppeling } from './koppeling'
import type { InboxAfloop, InboxEindStatus, InboxOpslag, InboxRij } from './opslag'
import { STANDAARD_OVERGANGEN, volgendeToestand, type BetaalOvergangen } from './overgang'
import { bronUitIntent, intentVan, leesBetaalmethode, leesGeschillen, leesMandaat, leesSessie, leesSetupIntent, type BetaalBron } from './stripe-stand'

export interface InboxDeps {
  opslag: InboxOpslag
  stripe: StripeLezer
  /** Live of test, volgens de sleutel van het platform. */
  liveVerwacht: boolean
  nu: () => Date
  regels?: BetaalOvergangen
}

type Uitkomst = { status: InboxEindStatus; reden: string | null }

/** Tijdelijk probleem (Stripe of database): later opnieuw. */
class Opnieuw extends Error {}

const klaar = (reden: string | null = null): Uitkomst => ({ status: 'verwerkt', reden })
const negeer = (reden: string): Uitkomst => ({ status: 'genegeerd', reden })
const afwijkend = (reden: string): Uitkomst => ({ status: 'afwijkend', reden })

/** Een opgehaald object, of een duidelijke uitkomst als Stripe het niet gaf. */
function gegeven(u: StripeUitkomst<unknown>): unknown {
  if (u.ok) return u.data
  if (u.soort === 'tijdelijk') throw new Opnieuw('stripe_tijdelijk')
  return null
}

const MAX_RACES = 3

async function verwerkBetaling(rij: InboxRij, account: string, bron: BetaalBron, d: InboxDeps): Promise<Uitkomst> {
  const betalingId = bron.meta.betalingId
  if (!betalingId) {
    // Een losse verkoop die is terugbetaald: naar de bestaande verwerking.
    if (bron.meta.verkoopId && rij.type === 'charge.refunded' && bron.paymentIntent && bron.terugTotaalCent > 0) {
      await d.opslag.verkoopTerugbetaald(bron.paymentIntent, account, bron.terugTotaalCent)
      return klaar('verkoop')
    }
    return negeer('geen_lidgeld')
  }
  for (let i = 0; i < MAX_RACES; i++) {
    const betaling = await d.opslag.betaling(betalingId)
    if (!betaling) return afwijkend('onbekende_betaling')
    const accountVanSportschool = await d.opslag.accountVanSportschool(betaling.organisatieId)
    const reden = controleerKoppeling({ betaling, bron, eventAccount: account, accountVanSportschool, liveVerwacht: d.liveVerwacht })
    if (reden) return afwijkend(reden)
    const o = volgendeToestand(betaling, bron.stand, d.regels ?? STANDAARD_OVERGANGEN)
    if (o.verdwenenTerug.length > 0) await d.opslag.meld(`Lidgeld: geboekte terugbetaling niet meer geslaagd bij Stripe (${o.verdwenenTerug.join(', ')})`)
    if (!o.wijzigt) return klaar('al_bij')
    const uit = await d.opslag.pasBetalingToe({
      organisatieId: betaling.organisatieId,
      betalingId,
      factuurId: betaling.factuurId,
      van: betaling.status,
      naar: o.naar,
      pad: o.pad,
      nieuweTerug: o.nieuweTerug,
      paymentIntent: bron.paymentIntent,
      eventId: rij.eventId,
    })
    if (uit === 'ok') return klaar()
    if (uit === 'afwijkend') return afwijkend('overgang_geweigerd')
  }
  throw new Opnieuw('gelijktijdig')
}

async function bronVanIntent(account: string, pi: string, d: InboxDeps): Promise<BetaalBron | null> {
  const intent = gegeven(await d.stripe.haal(account, 'payment_intent', pi))
  if (!intent) return null
  const geschillen = gegeven(await d.stripe.haalGeschillen(account, pi))
  return bronUitIntent(intent, leesGeschillen(geschillen))
}

async function viaIntent(rij: InboxRij, account: string, pi: string | null, d: InboxDeps): Promise<Uitkomst> {
  if (!pi) return negeer('geen_intent')
  const bron = await bronVanIntent(account, pi, d)
  return bron ? verwerkBetaling(rij, account, bron, d) : afwijkend('intent_niet_op_te_halen')
}

async function verwerkSessie(rij: InboxRij, account: string, d: InboxDeps): Promise<Uitkomst> {
  const s = leesSessie(gegeven(await d.stripe.haal(account, 'checkout_session', rij.objectId)))
  if (!s) return afwijkend('sessie_niet_op_te_halen')
  if (s.modus === 'setup') return s.setupIntent ? verwerkSetup(account, s.setupIntent, d) : klaar('setup_open')
  if (s.modus !== 'payment') return negeer('andere_modus')
  if (s.paymentIntent) return viaIntent(rij, account, s.paymentIntent, d)
  return verwerkBetaling(rij, account, s.bron, d)
}

async function verwerkSetup(account: string, setupId: string, d: InboxDeps): Promise<Uitkomst> {
  const si = leesSetupIntent(gegeven(await d.stripe.haal(account, 'setup_intent', setupId)))
  if (!si) return afwijkend('setup_niet_op_te_halen')
  if (!si.gelukt) return klaar('setup_niet_gelukt')
  if (!si.meta.organisatieId) return negeer('geen_lidgeld')
  if (si.livemode !== d.liveVerwacht) return afwijkend('livemode')
  if ((await d.opslag.accountVanSportschool(si.meta.organisatieId)) !== account) return afwijkend('account')
  if (!si.klant || !si.betaalmethode || !si.mandaat) return afwijkend('setup_onvolledig')
  const pm = leesBetaalmethode(gegeven(await d.stripe.haal(account, 'payment_method', si.betaalmethode)))
  if (!pm) return afwijkend('betaalmethode_niet_op_te_halen')
  const uit = await d.opslag.legMachtigingVast({ organisatieId: si.meta.organisatieId, contractId: si.meta.contractId, klant: si.klant, betaalmethode: pm.id, mandaat: si.mandaat, soort: pm.soort, laatste4: pm.laatste4, setupIntent: si.id })
  return uit === 'ok' ? klaar() : afwijkend('onbekende_klant')
}

async function verwerkMachtiging(rij: InboxRij, account: string, d: InboxDeps): Promise<Uitkomst> {
  const organisatieId = await d.opslag.sportschoolVanAccount(account)
  if (!organisatieId) return negeer('onbekend_account')
  if (rij.object === 'mandate') {
    const m = leesMandaat(gegeven(await d.stripe.haal(account, 'mandate', rij.objectId)))
    if (!m) return afwijkend('mandaat_niet_op_te_halen')
    await d.opslag.werkMachtigingBij({ organisatieId, mandaat: m.id, betaalmethode: m.betaalmethode, status: m.status })
    return klaar()
  }
  const pm = leesBetaalmethode(gegeven(await d.stripe.haal(account, 'payment_method', rij.objectId)))
  if (!pm) return afwijkend('betaalmethode_niet_op_te_halen')
  // Losgekoppeld: alleen ingetrokken als Stripe hem ook echt los heeft.
  if (pm.klant) return klaar('nog_gekoppeld')
  await d.opslag.werkMachtigingBij({ organisatieId, mandaat: null, betaalmethode: pm.id, status: 'ingetrokken' })
  return klaar()
}

async function verwerkAccount(rij: InboxRij, d: InboxDeps): Promise<Uitkomst> {
  const u = await d.stripe.haalAccount(rij.objectId)
  if (rij.type === 'account.application.deauthorized') {
    if (u.ok) return negeer('nog_gekoppeld')
    if (u.soort === 'tijdelijk') throw new Opnieuw('stripe_tijdelijk')
    await d.opslag.accountOntkoppeld(rij.objectId)
    return klaar()
  }
  const stand = leesAccount(gegeven(u))
  if (!stand || stand.accountId !== rij.objectId) return afwijkend('account_niet_op_te_halen')
  await d.opslag.werkAccountStandBij(stand)
  return klaar()
}

async function viaObject(rij: InboxRij, account: string, d: InboxDeps): Promise<Uitkomst> {
  const soort = rij.object === 'charge' || rij.object === 'refund' || rij.object === 'dispute' ? rij.object : null
  if (!soort) return negeer('onbekend_object')
  const object = gegeven(await d.stripe.haal(account, soort, rij.objectId))
  if (!object) return afwijkend(`${soort}_niet_op_te_halen`)
  return viaIntent(rij, account, intentVan(object), d)
}

/** Een geclaimde rij verwerken (gooit Opnieuw bij een tijdelijk probleem). */
export async function verwerkRij(rij: InboxRij, d: InboxDeps): Promise<Uitkomst> {
  if (rij.livemode !== d.liveVerwacht) return negeer('andere_modus')
  if (rij.object === 'account') return verwerkAccount(rij, d)
  const account = rij.account
  if (!account) return negeer('geen_account')
  switch (rij.object) {
    case 'payment_intent':
      return viaIntent(rij, account, rij.objectId, d)
    case 'checkout_session':
      return verwerkSessie(rij, account, d)
    case 'setup_intent':
      return verwerkSetup(account, rij.objectId, d)
    case 'mandate':
    case 'payment_method':
      return verwerkMachtiging(rij, account, d)
    default:
      return viaObject(rij, account, d)
  }
}

/** De afloop van een rij, ook bij een fout (nooit een stille fout). */
export async function afloopVan(rij: InboxRij, d: InboxDeps): Promise<InboxAfloop> {
  try {
    return await verwerkRij(rij, d)
  } catch (err) {
    const reden = err instanceof Opnieuw ? err.message : 'database'
    const h = naMislukking(rij.pogingen + 1, d.nu())
    return h.status === 'vast' ? { status: 'vast', reden } : { status: 'opnieuw', reden, volgendeOp: h.volgendeOp }
  }
}

export interface InboxVerslag {
  geclaimd: number
  verwerkt: number
  afwijkend: number
  genegeerd: number
  opnieuw: number
  vast: number
}

/** Geclaimde rijen verwerken: direct na de webhook (een event) of door de cron (inhalen). */
export async function werkInboxAf(d: InboxDeps, opties: { max: number; eventId?: string }): Promise<InboxVerslag> {
  const rijen = await d.opslag.claim(opties.max, opties.eventId)
  const verslag: InboxVerslag = { geclaimd: rijen.length, verwerkt: 0, afwijkend: 0, genegeerd: 0, opnieuw: 0, vast: 0 }
  for (const rij of rijen) {
    const afloop = await afloopVan(rij, d)
    verslag[afloop.status] += 1
    if (afloop.status === 'afwijkend') await d.opslag.meld(`Lidgeld-event wijkt af (${rij.type}, ${afloop.reden ?? 'onbekend'})`)
    if (afloop.status === 'vast') await d.opslag.meld(`Lidgeld-event zit vast na herhalen (${rij.type}, ${afloop.reden})`)
    try {
      await d.opslag.rond(rij, afloop)
    } catch (err) {
      // De rij blijft 'bezig'; de claim neemt hem na een tijd weer mee.
      console.error('[club/betalen] inbox afronden mislukt', rij.type, err instanceof Error ? err.name : 'onbekend')
    }
  }
  return verslag
}
