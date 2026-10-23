// ─── Club, lidgeld-inbox: de echte opslag in Supabase (SERVER-ONLY) ─────────
// Op de tabellen en functies van migratie 460 en 461:
//   club_betalen_stripe_events  status ontvangen | bezig | verwerkt | afwijkend | fout | genegeerd,
//                               pogingen, laatste_fout, verwerkt_op, account, object_id, user_id
//   club_betalen_betalingen     de betaling (status, bedrag, factuur, PaymentIntent)
//   club_betalen_betaling_overgang(p_user, p_betaling, p_naar, p_intent)  een stap, met kasboek
//   club_betalen_boek(...)      een terugbetaling in het kasboek, uniek op 'refund:<re_id>'
//   club_betalen_klanten, club_betalen_mandaten, club_betalen_accounts
//
// Claimen: per rij een voorwaardelijke update (alleen als status en pogingen
// nog gelijk zijn). Twee verwerkers krijgen zo nooit dezelfde rij; dat is even
// veilig als `for update skip locked`. Komt er een RPC met skip locked, dan
// alleen `claim` hieronder vervangen.
// Opnieuw proberen: status 'fout' met pogingen + 1; de volgende poging mag pas
// na de oplopende wachttijden, gerekend vanaf ontvangen_op (vroegsteVolgende).
// Vast: status 'fout' met pogingen = MAX_POGINGEN (de claim slaat die over).

import type { SupabaseClient } from '@supabase/supabase-js'
import { meldFout } from '@/lib/club/betrouwbaarheid/melden'
import { verwerkTerugbetaling, werkAccountStandBij } from '../opslag'
import { MAX_POGINGEN, vroegsteVolgende } from '../outbox/wachten'
import { objectVanType, type InboxEvent } from './event'
import type { BetalingRij } from './koppeling'
import type { InboxAfloop, InboxOpslag, InboxRij, MachtigingVastlegging, MachtigingWijziging, BetalingWijziging } from './opslag'
import { isBetaalStatus } from './overgang'
import { geheel, obj, str, uuid } from './lees'

const ROUTE = '/api/club-betalen/stripe'
const VASTGELOPEN_MS = 10 * 60_000
const MANDAAT_SOORTEN = new Set(['sepa_debit', 'card', 'ideal'])

class DatabaseFout extends Error {}

function fout(wat: string, code: string | undefined): never {
  // Alleen de stap en de foutcode: nooit gegevens van een lid.
  console.error('[club/betalen] inbox', wat, code ?? '')
  throw new DatabaseFout(wat)
}

interface Kandidaat {
  rij: InboxRij
  status: 'ontvangen' | 'bezig' | 'fout'
}

function leesKandidaat(v: unknown, live: boolean): Kandidaat | null {
  const r = obj(v)
  const eventId = str(r?.event_id)
  const type = str(r?.type)
  const object = type ? objectVanType(type) : null
  const objectId = str(r?.object_id)
  const status = r?.status === 'ontvangen' || r?.status === 'bezig' || r?.status === 'fout' ? r.status : null
  if (!r || !eventId || !type || !object || !objectId || !status) return null
  // Events van de andere modus worden bij de webhook al niet bewaard.
  return { rij: { eventId, type, object, account: str(r.account), objectId, livemode: live, pogingen: geheel(r.pogingen) ?? 0 }, status }
}

/** Mag deze rij nu (weer) aan de beurt? */
function aanDeBeurt(k: Kandidaat, ontvangenOp: Date, nu: Date): boolean {
  if (k.status === 'ontvangen') return true
  const vroegst = vroegsteVolgende(ontvangenOp, k.rij.pogingen).getTime()
  return k.status === 'fout' ? vroegst <= nu.getTime() : vroegst + VASTGELOPEN_MS <= nu.getTime()
}

async function claim(admin: SupabaseClient, live: boolean, max: number, eventId?: string): Promise<InboxRij[]> {
  let q = admin.from('club_betalen_stripe_events').select('event_id, type, account, object_id, status, pogingen, ontvangen_op').in('status', ['ontvangen', 'fout', 'bezig']).lt('pogingen', MAX_POGINGEN).not('object_id', 'is', null)
  if (eventId) q = q.eq('event_id', eventId)
  const { data, error } = await q.order('ontvangen_op', { ascending: true }).limit(Math.max(max * 4, 20))
  if (error) fout('events lezen', error.code)
  const nu = new Date()
  const uit: InboxRij[] = []
  for (const ruw of Array.isArray(data) ? data : []) {
    if (uit.length >= max) break
    const k = leesKandidaat(ruw, live)
    const ontvangen = new Date(String(obj(ruw)?.ontvangen_op ?? ''))
    if (!k || Number.isNaN(ontvangen.getTime()) || !aanDeBeurt(k, ontvangen, nu)) continue
    // Een vastgelopen 'bezig' telt als poging, zodat twee verwerkers hem niet allebei krijgen.
    const pogingen = k.status === 'bezig' ? k.rij.pogingen + 1 : k.rij.pogingen
    const { data: rij, error: e2 } = await admin
      .from('club_betalen_stripe_events')
      .update({ status: 'bezig', pogingen })
      .eq('event_id', k.rij.eventId)
      .eq('status', k.status)
      .eq('pogingen', k.rij.pogingen)
      .select('event_id')
    if (e2) fout('event claimen', e2.code)
    if (Array.isArray(rij) && rij.length === 1) uit.push({ ...k.rij, pogingen })
  }
  return uit
}

async function rond(admin: SupabaseClient, rij: InboxRij, a: InboxAfloop): Promise<void> {
  const reden = a.reden ? a.reden.slice(0, 300) : null
  const wijziging =
    a.status === 'opnieuw'
      ? { status: 'fout', pogingen: rij.pogingen + 1, laatste_fout: reden }
      : a.status === 'vast'
        ? { status: 'fout', pogingen: MAX_POGINGEN, laatste_fout: reden }
        : { status: a.status, pogingen: rij.pogingen + 1, laatste_fout: a.status === 'verwerkt' ? null : reden, verwerkt_op: new Date().toISOString() }
  const { error } = await admin.from('club_betalen_stripe_events').update(wijziging).eq('event_id', rij.eventId).eq('status', 'bezig')
  if (error) fout('event afronden', error.code)
}

async function betaling(admin: SupabaseClient, id: string): Promise<BetalingRij | null> {
  const { data, error } = await admin.from('club_betalen_betalingen').select('id, user_id, factuur_id, bedrag_cent, status, stripe_payment_intent').eq('id', id).maybeSingle()
  if (error) fout('betaling lezen', error.code)
  const r = obj(data)
  const organisatieId = uuid(r?.user_id)
  const bedragCent = geheel(r?.bedrag_cent)
  if (!r || !organisatieId || bedragCent === null || !isBetaalStatus(r.status)) return null
  const { data: boek, error: e2 } = await admin.from('club_betalen_boekingen').select('oorzaak').eq('user_id', organisatieId).eq('betaling_id', id).eq('soort', 'terugbetaling').like('oorzaak', 'refund:%')
  if (e2) fout('terugbetalingen lezen', e2.code)
  const terugIds = (Array.isArray(boek) ? boek : []).map((b) => str(obj(b)?.oorzaak)?.slice('refund:'.length) ?? '').filter((x) => x.startsWith('re_'))
  return { id, organisatieId, factuurId: uuid(r.factuur_id), bedragCent, status: r.status, terugIds, paymentIntent: str(r.stripe_payment_intent) }
}

async function pasBetalingToe(admin: SupabaseClient, w: BetalingWijziging): Promise<'ok' | 'verouderd' | 'afwijkend'> {
  for (const stap of w.pad) {
    const { data, error } = await admin.rpc('club_betalen_betaling_overgang', { p_user: w.organisatieId, p_betaling: w.betalingId, p_naar: stap, p_intent: w.paymentIntent })
    if (error) fout('betaling overgang', error.code)
    // 'genegeerd': iemand anders zette hem al verder. Opnieuw lezen en verder vanaf daar.
    if (data === 'genegeerd') return 'verouderd'
    if (data !== 'ok') return 'afwijkend'
  }
  for (const t of w.nieuweTerug) {
    const { error } = await admin.rpc('club_betalen_boek', { p_user: w.organisatieId, p_soort: 'terugbetaling', p_bedrag_cent: t.cent, p_oorzaak: `refund:${t.id}`, p_factuur: w.factuurId, p_betaling: w.betalingId })
    if (error) fout('terugbetaling boeken', error.code)
  }
  return 'ok'
}

async function accountKolom(admin: SupabaseClient, kolom: 'user_id' | 'stripe_account_id', waarde: string, terug: 'user_id' | 'stripe_account_id'): Promise<string | null> {
  const { data, error } = await admin.from('club_betalen_accounts').select('user_id, stripe_account_id').eq(kolom, waarde).maybeSingle()
  if (error) fout('account lezen', error.code)
  return str(obj(data)?.[terug])
}

async function legMachtigingVast(admin: SupabaseClient, m: MachtigingVastlegging): Promise<'ok' | 'onbekend'> {
  if (!MANDAAT_SOORTEN.has(m.soort)) return 'onbekend'
  const { data: klant, error } = await admin.from('club_betalen_klanten').select('id, lid_id').eq('user_id', m.organisatieId).eq('stripe_klant_id', m.klant).maybeSingle()
  if (error) fout('klant lezen', error.code)
  const k = obj(klant)
  if (!k || !str(k.id)) return 'onbekend'
  const rij = { user_id: m.organisatieId, lid_id: str(k.lid_id), klant_id: str(k.id), stripe_pm_id: m.betaalmethode, stripe_mandate_id: m.mandaat, type: m.soort, laatste4: m.laatste4, status: 'actief', bron: 'setup', ondertekend_op: new Date().toISOString() }
  const { error: e2 } = await admin.from('club_betalen_mandaten').upsert(rij, { onConflict: 'stripe_pm_id', ignoreDuplicates: true })
  if (e2) fout('mandaat vastleggen', e2.code)
  return 'ok'
}

async function werkMachtigingBij(admin: SupabaseClient, m: MachtigingWijziging): Promise<void> {
  // In afwachting: niets veranderen; een machtiging wordt pas actief na Stripe.
  if (m.status === 'in_afwachting') return
  const status = m.status === 'actief' ? 'actief' : 'ingetrokken'
  let q = admin.from('club_betalen_mandaten').update({ status }).eq('user_id', m.organisatieId)
  if (m.mandaat) q = q.eq('stripe_mandate_id', m.mandaat)
  else if (m.betaalmethode) q = q.eq('stripe_pm_id', m.betaalmethode)
  else return
  const { error } = await q
  if (error) fout('mandaat bijwerken', error.code)
}

async function accountOntkoppeld(admin: SupabaseClient, account: string): Promise<void> {
  const { error } = await admin.from('club_betalen_accounts').update({ charges_aan: false, uitbetalen_aan: false, lidgeld_aan: false, incasso_aan: false, bijgewerkt_op: new Date().toISOString() }).eq('stripe_account_id', account)
  if (error) fout('account ontkoppelen', error.code)
}

/** Een event bewaren als 'ontvangen' (alleen ids, geen payload). */
async function bewaar(admin: SupabaseClient, e: InboxEvent): Promise<'nieuw' | 'dubbel' | 'fout'> {
  const { error } = await admin.from('club_betalen_stripe_events').insert({ event_id: e.eventId, type: e.type.slice(0, 80), account: e.account, object_id: e.objectId, status: 'ontvangen' })
  if (!error) return 'nieuw'
  if (error.code === '23505') return 'dubbel'
  console.error('[club/betalen] inbox bewaren', error.code ?? '')
  return 'fout'
}

/** `live`: de modus van de platformsleutel (de webhook bewaart alleen events van die modus). */
export function supabaseInbox(admin: SupabaseClient, live: boolean): InboxOpslag {
  return {
    bewaar: (e) => bewaar(admin, e),
    claim: (max, eventId) => claim(admin, live, max, eventId),
    rond: (rij, a) => rond(admin, rij, a),
    sportschoolVanAccount: (account) => accountKolom(admin, 'stripe_account_id', account, 'user_id'),
    accountVanSportschool: (org) => accountKolom(admin, 'user_id', org, 'stripe_account_id'),
    betaling: (id) => betaling(admin, id),
    pasBetalingToe: (w) => pasBetalingToe(admin, w),
    werkAccountStandBij: async (stand) => {
      if ((await werkAccountStandBij(admin, stand)) !== 'ok') fout('accountstand', undefined)
    },
    accountOntkoppeld: (account) => accountOntkoppeld(admin, account),
    legMachtigingVast: (m) => legMachtigingVast(admin, m),
    werkMachtigingBij: (m) => werkMachtigingBij(admin, m),
    verkoopTerugbetaald: async (pi, account, terug) => {
      if ((await verwerkTerugbetaling(admin, pi, account, terug)) === null) fout('verkoop terugbetaling', undefined)
    },
    meld: (wat) => meldFout({ fout: wat, route: ROUTE, methode: 'POST', soort: 'handmatig' }, admin),
  }
}
