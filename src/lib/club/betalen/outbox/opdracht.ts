// ─── Club, lidgeld-outbox: een opdracht aan Stripe lezen (PUUR) ─────────────
// Bouwplan 1.3. Geld bewegen gaat alleen via club_betalen_opdrachten (migratie
// 461). Elke opdracht heeft een vaste idempotentiesleutel `ayg_<soort>_<id>`
// (kolom idempotentie_sleutel): hoe vaak de werker hem ook probeert, Stripe
// voert hem hooguit een keer uit.
// Systeemgrens: de jsonb `payload` uit de database wordt hier gecontroleerd.
// Daar staan alleen ids en bedragen; naam en e-mail van een nieuwe klant haalt
// de werker pas vlak voor de aanroep op.

import type { EersteBetalingInvoer, IncassoInvoer, LidTerugbetalingInvoer, MachtigingInvoer } from '../stripe-api'
import { ACCOUNT_ID, geheel, idVan, obj, str, uuid, type Obj } from '../inbox/lees'

/** Onze namen; de database gebruikt er een paar andere (zie DB_SOORT). */
export type OpdrachtSoort = 'klant' | 'eerste_betaling' | 'machtiging' | 'incasso' | 'terugbetaling' | 'klant_verwijderen' | 'mandaat_loskoppelen' | 'betaling_annuleren'

/** Een rij zoals de claim hem teruggeeft (payload nog ongelezen). */
export interface OpdrachtRij {
  id: string
  organisatieId: string
  /** De soort zoals in de database (bijvoorbeeld klant_aanmaken, checkout_sessie). */
  soort: string
  /** De vaste sleutel uit de database, of null (dan maken we hem zelf, zelfde vorm). */
  sleutel: string | null
  lidId: string | null
  factuurId: string | null
  betalingId: string | null
  /** Eerdere pogingen (0 bij de eerste keer). */
  pogingen: number
  /** Vanaf wanneer de sleutel telt: het aanmaken van de opdracht (voorzichtig). */
  eersteOp: Date | null
  gegevens: unknown
}

interface Basis {
  id: string
  organisatieId: string
  sleutel: string
  pogingen: number
  eersteOp: Date | null
}

/** De werker zet het id van de sportschool er bij elke poging zelf bij. */
type ZonderFee<T> = Omit<T, 'organisatieId'>

export type Opdracht = Basis &
  (
    | { soort: 'klant'; invoer: { lidId: string } }
    | { soort: 'eerste_betaling'; invoer: ZonderFee<EersteBetalingInvoer> }
    | { soort: 'machtiging'; invoer: Omit<MachtigingInvoer, 'organisatieId'> }
    | { soort: 'incasso'; invoer: ZonderFee<IncassoInvoer> }
    | { soort: 'terugbetaling'; invoer: Omit<LidTerugbetalingInvoer, 'organisatieId'> }
    | { soort: 'klant_verwijderen'; invoer: { klant: string; account: string | null } }
    | { soort: 'mandaat_loskoppelen'; invoer: { betaalmethode: string } }
    | { soort: 'betaling_annuleren'; invoer: { paymentIntent: string } }
  )

const SLEUTEL = /^ayg_[a-z_]{3,30}_[A-Za-z0-9-]{8,80}$/

export function idempotentieSleutel(soort: string, id: string): string {
  return `ayg_${soort}_${id}`
}

/** Opdrachten die geld bewegen: extra voorzichtig met herhalen. */
export function beweegtGeld(soort: OpdrachtSoort): boolean {
  return soort === 'incasso' || soort === 'terugbetaling'
}

/** Tot 10.000 euro per opdracht; meer is voor een sportschool vrijwel zeker een fout. */
const MAX_CENT = 1_000_000

function bedrag(v: unknown): number | null {
  const n = geheel(v)
  return n !== null && n > 0 && n <= MAX_CENT ? n : null
}

function https(v: unknown): string | null {
  const s = str(v)
  return s && s.startsWith('https://') ? s : null
}

function tekst(v: unknown, max: number): string | null {
  const s = typeof v === 'string' ? v.trim() : ''
  return s.length > 0 ? s.slice(0, max) : null
}

/** Payload plus de kolommen van de rij (de kolommen winnen als ze er zijn). */
function velden(r: OpdrachtRij, g: Obj): Obj {
  return { ...g, lid_id: r.lidId ?? g.lid_id, factuur_id: r.factuurId ?? g.factuur_id, betaling_id: r.betalingId ?? g.betaling_id }
}

function eersteBetaling(g: Obj): ZonderFee<EersteBetalingInvoer> | null {
  const betalingId = uuid(g.betaling_id)
  const factuurId = uuid(g.factuur_id)
  const k = idVan(g.klant, 'cus_')
  const bedragCent = bedrag(g.bedrag_cent)
  const succesUrl = https(g.succes_url)
  const terugUrl = https(g.terug_url)
  const omschrijving = tekst(g.omschrijving, 80)
  if (!betalingId || !factuurId || !k || bedragCent === null || !succesUrl || !terugUrl || !omschrijving) return null
  return { betalingId, factuurId, klant: k, bedragCent, succesUrl, terugUrl, omschrijving }
}

function machtiging(g: Obj): Omit<MachtigingInvoer, 'organisatieId'> | null {
  const k = idVan(g.klant, 'cus_')
  const succesUrl = https(g.succes_url)
  const terugUrl = https(g.terug_url)
  return k && succesUrl && terugUrl ? { klant: k, contractId: uuid(g.contract_id), succesUrl, terugUrl } : null
}

function incasso(g: Obj): ZonderFee<IncassoInvoer> | null {
  const betalingId = uuid(g.betaling_id)
  const factuurId = uuid(g.factuur_id)
  const k = idVan(g.klant, 'cus_')
  const betaalmethode = idVan(g.betaalmethode, 'pm_')
  const mandaat = idVan(g.mandaat, 'mandate_')
  const bedragCent = bedrag(g.bedrag_cent)
  const omschrijving = tekst(g.omschrijving, 80)
  if (!betalingId || !factuurId || !k || !betaalmethode || !mandaat || bedragCent === null || !omschrijving) return null
  return { betalingId, factuurId, klant: k, betaalmethode, mandaat, bedragCent, omschrijving }
}

function terugbetaling(g: Obj): Omit<LidTerugbetalingInvoer, 'organisatieId'> | null {
  const terugbetalingId = uuid(g.terugbetaling_id)
  const betalingId = uuid(g.betaling_id)
  const paymentIntent = idVan(g.payment_intent, 'pi_')
  const bedragCent = bedrag(g.bedrag_cent)
  if (!terugbetalingId || !betalingId || !paymentIntent || bedragCent === null) return null
  return { terugbetalingId, betalingId, paymentIntent, bedragCent }
}

/** Het deel van een opdracht zonder de basis, per soort apart (distributief). */
type Deel = Opdracht extends infer O ? (O extends Opdracht ? Omit<O, keyof Basis> : never) : never

type Lezer = (g: Obj) => Deel | null

const LEZERS: Readonly<Record<string, Lezer>> = {
  klant_aanmaken: (g) => {
    const lidId = uuid(g.lid_id)
    return lidId ? { soort: 'klant', invoer: { lidId } } : null
  },
  // Een Checkout-sessie: betalen (eerste betaling) of alleen machtigen (modus setup).
  checkout_sessie: (g) => {
    if (g.modus === 'setup') {
      const invoer = machtiging(g)
      return invoer ? { soort: 'machtiging', invoer } : null
    }
    const invoer = eersteBetaling(g)
    return invoer ? { soort: 'eerste_betaling', invoer } : null
  },
  incasso: (g) => {
    const invoer = incasso(g)
    return invoer ? { soort: 'incasso', invoer } : null
  },
  terugbetaling: (g) => {
    const invoer = terugbetaling(g)
    return invoer ? { soort: 'terugbetaling', invoer } : null
  },
  klant_verwijderen: (g) => {
    const klant = idVan(g.stripe_klant_id, 'cus_')
    const account = str(g.stripe_account_id)
    return klant ? { soort: 'klant_verwijderen', invoer: { klant, account: account && ACCOUNT_ID.test(account) ? account : null } } : null
  },
  mandaat_loskoppelen: (g) => {
    const betaalmethode = idVan(g.stripe_pm_id, 'pm_')
    return betaalmethode ? { soort: 'mandaat_loskoppelen', invoer: { betaalmethode } } : null
  },
  betaling_annuleren: (g) => {
    const paymentIntent = idVan(g.stripe_payment_intent, 'pi_')
    return paymentIntent ? { soort: 'betaling_annuleren', invoer: { paymentIntent } } : null
  },
}

/** Een geclaimde rij lezen (PUUR, getest); null = ongeldig, nooit uitvoeren. */
export function leesOpdracht(r: OpdrachtRij): Opdracht | null {
  const id = uuid(r.id)
  const organisatieId = uuid(r.organisatieId)
  const g = obj(r.gegevens)
  const lezer = Object.prototype.hasOwnProperty.call(LEZERS, r.soort) ? LEZERS[r.soort] : null
  if (!id || !organisatieId || !g || !lezer) return null
  const sleutel = r.sleutel ?? idempotentieSleutel(r.soort, id)
  if (!SLEUTEL.test(sleutel)) return null
  const deel = lezer(velden(r, g))
  if (!deel) return null
  const basis: Basis = { id, organisatieId, sleutel, pogingen: r.pogingen, eersteOp: r.eersteOp }
  return { ...basis, ...deel }
}
