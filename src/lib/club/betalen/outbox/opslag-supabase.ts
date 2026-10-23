// ─── Club, lidgeld-outbox: de echte opslag in Supabase (SERVER-ONLY) ────────
// Op club_betalen_opdrachten (migratie 461): status wacht | bezig | klaar |
// mislukt | vast | geannuleerd, pogingen, volgende_poging_op, bezig_sinds,
// klaar_op, laatste_fout, payload (alleen ids en bedragen), idempotentie_sleutel.
//
// Claimen: per rij een voorwaardelijke update (status, pogingen en bezig_sinds
// moeten nog gelijk zijn), even veilig als `for update skip locked`. Een rij
// die langer dan 10 minuten 'bezig' is (de werker viel weg) mag opnieuw: de
// vaste sleutel maakt dat veilig. Komt er een RPC met skip locked, dan alleen
// `claim` vervangen.
//
// Na een geslaagde aanroep eerst de gevolgen vastleggen (klant, betaling naar
// 'aangeboden' met de PaymentIntent, terugbetaling met het refund-id), daarna
// pas de opdracht op 'klaar'. Mislukt het vastleggen, dan herhaalt de werker
// met dezelfde sleutel en geeft Stripe hetzelfde resultaat.

import type { SupabaseClient } from '@supabase/supabase-js'
import { meldFout } from '@/lib/club/betrouwbaarheid/melden'
import { geheel, obj, str, uuid } from '../inbox/lees'
import type { Opdracht, OpdrachtRij } from './opdracht'
import type { OpdrachtAfloop, OutboxOpslag } from './werker'

const ROUTE = '/api/aiyourgym/cron/club-outbox'
const VASTGELOPEN_MS = 10 * 60_000
const KOLOMMEN = 'id, user_id, lid_id, soort, idempotentie_sleutel, status, pogingen, bezig_sinds, factuur_id, betaling_id, payload, aangemaakt_op'
const FACTUUR_OPEN = new Set(['definitief', 'open', 'deels_betaald'])
const CONTRACT_DICHT = new Set(['concept', 'gepauzeerd', 'beeindigd'])

class DatabaseFout extends Error {}

function fout(wat: string, code: string | undefined): never {
  console.error('[club/betalen] outbox', wat, code ?? '')
  throw new DatabaseFout(wat)
}

function datum(v: unknown): Date | null {
  const d = new Date(String(v ?? ''))
  return Number.isNaN(d.getTime()) ? null : d
}

function leesRij(v: unknown): { rij: OpdrachtRij; status: string; bezigSinds: string | null } | null {
  const r = obj(v)
  const id = uuid(r?.id)
  const organisatieId = uuid(r?.user_id)
  const soort = str(r?.soort)
  const status = str(r?.status)
  if (!r || !id || !organisatieId || !soort || !status) return null
  const rij: OpdrachtRij = {
    id,
    organisatieId,
    soort,
    sleutel: str(r.idempotentie_sleutel),
    lidId: uuid(r.lid_id),
    factuurId: uuid(r.factuur_id),
    betalingId: uuid(r.betaling_id),
    pogingen: geheel(r.pogingen) ?? 0,
    eersteOp: datum(r.aangemaakt_op),
    gegevens: r.payload,
  }
  return { rij, status, bezigSinds: str(r.bezig_sinds) }
}

async function kandidaten(admin: SupabaseClient, max: number, nu: Date): Promise<unknown[]> {
  const tabel = () => admin.from('club_betalen_opdrachten').select(KOLOMMEN)
  const [wacht, bezig] = await Promise.all([
    tabel().eq('status', 'wacht').lte('volgende_poging_op', nu.toISOString()).order('volgende_poging_op', { ascending: true }).limit(max),
    tabel().eq('status', 'bezig').lt('bezig_sinds', new Date(nu.getTime() - VASTGELOPEN_MS).toISOString()).limit(max),
  ])
  if (wacht.error) fout('opdrachten lezen', wacht.error.code)
  if (bezig.error) fout('opdrachten lezen', bezig.error.code)
  return [...(bezig.data ?? []), ...(wacht.data ?? [])]
}

async function claim(admin: SupabaseClient, max: number): Promise<OpdrachtRij[]> {
  const nu = new Date()
  const uit: OpdrachtRij[] = []
  for (const ruw of await kandidaten(admin, max, nu)) {
    if (uit.length >= max) break
    const r = leesRij(ruw)
    if (!r) continue
    let q = admin.from('club_betalen_opdrachten').update({ status: 'bezig', bezig_sinds: nu.toISOString() }).eq('id', r.rij.id).eq('status', r.status).eq('pogingen', r.rij.pogingen)
    q = r.bezigSinds ? q.eq('bezig_sinds', r.bezigSinds) : q.is('bezig_sinds', null)
    const { data, error } = await q.select('id')
    if (error) fout('opdracht claimen', error.code)
    if (Array.isArray(data) && data.length === 1) uit.push(r.rij)
  }
  return uit
}

async function lees(admin: SupabaseClient, tabel: string, kolommen: string, id: string, org: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await admin.from(tabel).select(kolommen).eq('id', id).eq('user_id', org).maybeSingle()
  if (error) fout(`${tabel} lezen`, error.code)
  return obj(data)
}

/** De betaling, factuur en het contract moeten nog kloppen voor er geld beweegt. */
async function betalingMagDoor(admin: SupabaseClient, org: string, betalingId: string, bedragCent: number): Promise<boolean> {
  const b = await lees(admin, 'club_betalen_betalingen', 'status, bedrag_cent, factuur_id, contract_id', betalingId, org)
  if (!b || b.status !== 'klaar' || b.bedrag_cent !== bedragCent) return false
  const factuurId = str(b.factuur_id)
  const f = factuurId ? await lees(admin, 'club_betalen_facturen', 'status', factuurId, org) : null
  if (!f || !FACTUUR_OPEN.has(String(f.status))) return false
  const contractId = str(b.contract_id)
  if (!contractId) return true
  const c = await lees(admin, 'club_betalen_contracten', 'status', contractId, org)
  return !!c && !CONTRACT_DICHT.has(String(c.status))
}

async function accountStand(admin: SupabaseClient, org: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await admin.from('club_betalen_accounts').select('stripe_account_id, lidgeld_aan, incasso_aan, schaduw').eq('user_id', org).maybeSingle()
  if (error) fout('account lezen', error.code)
  return obj(data)
}

async function controleer(admin: SupabaseClient, o: Opdracht): Promise<'door' | 'stop'> {
  const org = o.organisatieId
  switch (o.soort) {
    case 'incasso': {
      const a = await accountStand(admin, org)
      // Schaduwmodus of incasso uit: nooit afschrijven.
      if (!a || a.incasso_aan !== true || a.schaduw !== false) return 'stop'
      return (await betalingMagDoor(admin, org, o.invoer.betalingId, o.invoer.bedragCent)) ? 'door' : 'stop'
    }
    case 'eerste_betaling': {
      const a = await accountStand(admin, org)
      if (!a || a.lidgeld_aan !== true) return 'stop'
      return (await betalingMagDoor(admin, org, o.invoer.betalingId, o.invoer.bedragCent)) ? 'door' : 'stop'
    }
    case 'machtiging': {
      const a = await accountStand(admin, org)
      return a?.lidgeld_aan === true ? 'door' : 'stop'
    }
    case 'terugbetaling': {
      const t = await lees(admin, 'club_betalen_terugbetalingen', 'status, bedrag_cent, betaling_id, stripe_refund_id', o.invoer.terugbetalingId, org)
      if (!t || t.status !== 'aangevraagd' || t.stripe_refund_id || t.bedrag_cent !== o.invoer.bedragCent || t.betaling_id !== o.invoer.betalingId) return 'stop'
      // De PaymentIntent moet echt bij deze betaling van deze sportschool horen.
      const b = await lees(admin, 'club_betalen_betalingen', 'stripe_payment_intent', o.invoer.betalingId, org)
      return b && b.stripe_payment_intent === o.invoer.paymentIntent ? 'door' : 'stop'
    }
    case 'klant': {
      const { data, error } = await admin.from('club_betalen_klanten').select('stripe_klant_id').eq('user_id', org).eq('lid_id', o.invoer.lidId).maybeSingle()
      if (error) fout('klant lezen', error.code)
      return str(obj(data)?.stripe_klant_id) ? 'stop' : 'door'
    }
    default:
      return 'door'
  }
}

async function overgang(admin: SupabaseClient, org: string, betaling: string, naar: string, intent: string | null): Promise<void> {
  const { error } = await admin.rpc('club_betalen_betaling_overgang', { p_user: org, p_betaling: betaling, p_naar: naar, p_intent: intent })
  if (error) fout('betaling overgang', error.code)
}

/** De gevolgen van een geslaagde aanroep vastleggen (veilig om te herhalen). */
async function legGevolgVast(admin: SupabaseClient, o: Opdracht, a: Extract<OpdrachtAfloop, { status: 'klaar' }>, account: string | null): Promise<void> {
  const org = o.organisatieId
  switch (o.soort) {
    case 'klant': {
      const { error } = await admin.from('club_betalen_klanten').upsert({ user_id: org, lid_id: o.invoer.lidId, stripe_klant_id: a.stripeId, stripe_account_id: account }, { onConflict: 'user_id,lid_id' })
      if (error) fout('klant vastleggen', error.code)
      return
    }
    case 'incasso':
      await overgang(admin, org, o.invoer.betalingId, 'aangeboden', a.stripeId)
      if (a.stripeStatus === 'processing' || a.stripeStatus === 'succeeded') await overgang(admin, org, o.invoer.betalingId, 'in_behandeling', a.stripeId)
      return
    case 'eerste_betaling':
      await overgang(admin, org, o.invoer.betalingId, 'aangeboden', null)
      return
    case 'terugbetaling': {
      const { error } = await admin.from('club_betalen_terugbetalingen').update({ stripe_refund_id: a.stripeId, status: 'in_behandeling' }).eq('id', o.invoer.terugbetalingId).eq('user_id', org).is('stripe_refund_id', null)
      if (error) fout('terugbetaling vastleggen', error.code)
      return
    }
    default:
      return
  }
}

const DB_STATUS: Readonly<Record<Exclude<OpdrachtAfloop['status'], 'opnieuw'>, string>> = { klaar: 'klaar', afgewezen: 'mislukt', geannuleerd: 'geannuleerd', vast: 'vast' }

async function rond(admin: SupabaseClient, rij: OpdrachtRij, o: Opdracht | null, a: OpdrachtAfloop): Promise<void> {
  if (a.status === 'klaar' && o) await legGevolgVast(admin, o, a, str((await accountStand(admin, o.organisatieId))?.stripe_account_id))
  const nu = new Date().toISOString()
  const basis = { pogingen: Math.min(rij.pogingen + 1, 20), bezig_sinds: null }
  const wijziging =
    a.status === 'opnieuw'
      ? { ...basis, status: 'wacht', volgende_poging_op: a.volgendeOp.toISOString(), laatste_fout: a.code }
      : a.status === 'klaar'
        ? { ...basis, status: 'klaar', klaar_op: nu, laatste_fout: null, payload: { ...(obj(rij.gegevens) ?? {}), resultaat: { stripe_id: a.stripeId, url: a.url, stripe_status: a.stripeStatus } } }
        : { ...basis, status: DB_STATUS[a.status], laatste_fout: a.status === 'geannuleerd' ? a.reden : a.code }
  const { error } = await admin.from('club_betalen_opdrachten').update(wijziging).eq('id', rij.id).eq('status', 'bezig')
  if (error) fout('opdracht afronden', error.code)
}

async function klantGegevens(admin: SupabaseClient, org: string, lidId: string): Promise<{ naam: string; email: string | null } | null> {
  const { data, error } = await admin.from('club_leden').select('voornaam, achternaam, email').eq('id', lidId).eq('user_id', org).maybeSingle()
  if (error) fout('lid lezen', error.code)
  const r = obj(data)
  const naam = [str(r?.voornaam), str(r?.achternaam)].filter(Boolean).join(' ').trim()
  return r && naam ? { naam, email: str(r.email) } : null
}

export function supabaseOutbox(admin: SupabaseClient): OutboxOpslag {
  return {
    claim: (max) => claim(admin, max),
    controleer: (o) => controleer(admin, o),
    accountVanSportschool: async (org) => str((await accountStand(admin, org))?.stripe_account_id),
    klantGegevens: (org, lidId) => klantGegevens(admin, org, lidId),
    rond: (rij, o, a) => rond(admin, rij, o, a),
    meld: (wat) => meldFout({ fout: wat, route: ROUTE, methode: 'POST', soort: 'handmatig' }, admin),
  }
}
