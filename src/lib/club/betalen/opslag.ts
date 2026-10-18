// ─── Club, betalen: lezen en schrijven (SERVER-ONLY) ────────────────────────
// Alles op user_id van de sportschool (club_organisaties.id). Tegoeden muteren
// alleen via de databasefuncties uit migratie 439 (atomair, met een slot per lid).

import type { SupabaseClient } from '@supabase/supabase-js'
import { PRODUCT_KOLOMMEN, TEGOED_KOLOMMEN, VERKOOP_KOLOMMEN, productUitRij, tegoedUitRij, verkoopUitRij, type Product, type Tegoed, type TegoedSoort, type Verkoop } from './model'
import type { AccountStand } from './stripe-event'

function log(wat: string, code: string | undefined, bericht?: string): void {
  console.error(`[club/betalen] ${wat} mislukt`, code ?? '', bericht ?? '')
}

// ─── Connect-account en schakelaar per sportschool ──────────────────────────

export interface BetaalAccount {
  stripeAccountId: string | null
  chargesAan: boolean
  uitbetalenAan: boolean
  gegevensCompleet: boolean
  /** De sportschool heeft betalen in de ledenapp aan gezet. */
  betalenAan: boolean
}

export const GEEN_ACCOUNT: BetaalAccount = { stripeAccountId: null, chargesAan: false, uitbetalenAan: false, gegevensCompleet: false, betalenAan: false }

/** Het account van deze sportschool (GEEN_ACCOUNT als er nog niets is), of null bij een leesfout. */
export async function haalBetaalAccount(admin: SupabaseClient, userId: string): Promise<BetaalAccount | null> {
  const { data, error } = await admin.from('club_betalen_accounts').select('stripe_account_id, charges_aan, uitbetalen_aan, gegevens_compleet, betalen_aan').eq('user_id', userId).maybeSingle()
  if (error) {
    log('account lezen', error.code, error.message)
    return null
  }
  if (!data) return GEEN_ACCOUNT
  return {
    stripeAccountId: typeof data.stripe_account_id === 'string' ? data.stripe_account_id : null,
    chargesAan: data.charges_aan === true,
    uitbetalenAan: data.uitbetalen_aan === true,
    gegevensCompleet: data.gegevens_compleet === true,
    betalenAan: data.betalen_aan === true,
  }
}

/** Kunnen leden van deze sportschool nu afrekenen? */
export function kanAfrekenen(a: BetaalAccount | null): a is BetaalAccount & { stripeAccountId: string } {
  return a !== null && a.betalenAan && a.chargesAan && a.stripeAccountId !== null
}

export async function bewaarAccountId(admin: SupabaseClient, userId: string, accountId: string): Promise<boolean> {
  const { error } = await admin.from('club_betalen_accounts').upsert({ user_id: userId, stripe_account_id: accountId, bijgewerkt_op: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) log('account bewaren', error.code, error.message)
  return !error
}

/** De stand van Stripe overnemen (na onboarding of uit account.updated). */
export async function werkAccountStandBij(admin: SupabaseClient, stand: AccountStand): Promise<'ok' | 'fout'> {
  const { error } = await admin
    .from('club_betalen_accounts')
    .update({ charges_aan: stand.chargesAan, uitbetalen_aan: stand.uitbetalenAan, gegevens_compleet: stand.gegevensCompleet, bijgewerkt_op: new Date().toISOString() })
    .eq('stripe_account_id', stand.accountId)
  if (error) log('accountstand bijwerken', error.code, error.message)
  return error ? 'fout' : 'ok'
}

export async function zetBetalenAan(admin: SupabaseClient, userId: string, aan: boolean): Promise<boolean> {
  const { error } = await admin.from('club_betalen_accounts').upsert({ user_id: userId, betalen_aan: aan, bijgewerkt_op: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) log('schakelaar bewaren', error.code, error.message)
  return !error
}

// ─── Producten ──────────────────────────────────────────────────────────────

export async function haalProducten(admin: SupabaseClient, userId: string, alleenActief = false): Promise<Product[] | null> {
  let q = admin.from('club_betalen_producten').select(PRODUCT_KOLOMMEN).eq('user_id', userId)
  if (alleenActief) q = q.eq('actief', true)
  const { data, error } = await q.order('volgorde').order('naam').limit(200)
  if (error) {
    log('producten lezen', error.code, error.message)
    return null
  }
  return (data ?? []).map(productUitRij).filter((p): p is Product => p !== null)
}

export async function haalProduct(admin: SupabaseClient, userId: string, id: string): Promise<Product | null> {
  const { data, error } = await admin.from('club_betalen_producten').select(PRODUCT_KOLOMMEN).eq('user_id', userId).eq('id', id).maybeSingle()
  if (error) log('product lezen', error.code, error.message)
  return productUitRij(data)
}

export async function maakProduct(admin: SupabaseClient, userId: string, velden: Record<string, unknown>): Promise<Product | null> {
  const { data, error } = await admin.from('club_betalen_producten').insert({ ...velden, user_id: userId }).select(PRODUCT_KOLOMMEN).single()
  if (error) log('product maken', error.code, error.message)
  return productUitRij(data)
}

export async function wijzigProduct(admin: SupabaseClient, userId: string, id: string, velden: Record<string, unknown>): Promise<Product | null> {
  const { data, error } = await admin
    .from('club_betalen_producten')
    .update({ ...velden, gewijzigd_op: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', id)
    .select(PRODUCT_KOLOMMEN)
    .maybeSingle()
  if (error) log('product wijzigen', error.code, error.message)
  return productUitRij(data)
}

/** Weg als er nooit iets van verkocht is; anders alleen uit de verkoop (verkopen houden hun kopie). */
export async function verwijderProduct(admin: SupabaseClient, userId: string, id: string): Promise<'weg' | 'uit' | 'fout'> {
  const { count, error } = await admin.from('club_betalen_verkopen').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('product_id', id)
  if (error) {
    log('verkopen tellen', error.code, error.message)
    return 'fout'
  }
  if ((count ?? 0) > 0) return (await wijzigProduct(admin, userId, id, { actief: false })) ? 'uit' : 'fout'
  const weg = await admin.from('club_betalen_producten').delete().eq('user_id', userId).eq('id', id)
  if (weg.error) log('product verwijderen', weg.error.code, weg.error.message)
  return weg.error ? 'fout' : 'weg'
}

// ─── Verkopen ───────────────────────────────────────────────────────────────

export interface NieuweVerkoop {
  lidId: string
  vestiging: string
  product: Product
  platformFeeCent: number
  stripeAccountId: string
}

export async function maakVerkoop(admin: SupabaseClient, userId: string, v: NieuweVerkoop): Promise<string | null> {
  const p = v.product
  const { data, error } = await admin
    .from('club_betalen_verkopen')
    .insert({
      user_id: userId,
      lid_id: v.lidId,
      product_id: p.id,
      vestiging: v.vestiging,
      product_naam: p.naam,
      type: p.type,
      tegoeden: p.tegoeden,
      geldig_dagen: p.geldigDagen,
      vestigingen: p.vestigingen,
      btw_procent: p.btwProcent,
      bedrag_cent: p.prijsCent,
      platform_fee_cent: v.platformFeeCent,
      stripe_account_id: v.stripeAccountId,
    })
    .select('id')
    .single()
  if (error) log('verkoop maken', error.code, error.message)
  return typeof data?.id === 'string' ? data.id : null
}

export async function koppelSessie(admin: SupabaseClient, userId: string, verkoopId: string, sessieId: string): Promise<boolean> {
  const { error } = await admin.from('club_betalen_verkopen').update({ stripe_sessie_id: sessieId }).eq('user_id', userId).eq('id', verkoopId).eq('status', 'open')
  if (error) log('sessie koppelen', error.code, error.message)
  return !error
}

/** Open verkopen van een lid in het afgelopen uur (rem tegen eindeloos sessies maken). */
export async function telOpenVanLid(admin: SupabaseClient, userId: string, lidId: string, nu: Date): Promise<number | null> {
  const { count, error } = await admin
    .from('club_betalen_verkopen')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('lid_id', lidId)
    .eq('status', 'open')
    .gte('aangemaakt_op', new Date(nu.getTime() - 3_600_000).toISOString())
  if (error) log('open verkopen tellen', error.code, error.message)
  return error ? null : (count ?? 0)
}

export async function haalVerkopen(admin: SupabaseClient, userId: string, max = 200): Promise<Verkoop[] | null> {
  const { data, error } = await admin.from('club_betalen_verkopen').select(VERKOOP_KOLOMMEN).eq('user_id', userId).order('aangemaakt_op', { ascending: false }).limit(max)
  if (error) {
    log('verkopen lezen', error.code, error.message)
    return null
  }
  return (data ?? []).map(verkoopUitRij).filter((v): v is Verkoop => v !== null)
}

export interface VerkoopStripe extends Verkoop {
  stripeAccountId: string
  paymentIntent: string | null
  platformFeeCent: number
}

export async function haalVerkoopStripe(admin: SupabaseClient, userId: string, id: string): Promise<VerkoopStripe | null> {
  const { data, error } = await admin
    .from('club_betalen_verkopen')
    .select(`${VERKOOP_KOLOMMEN}, stripe_account_id, stripe_payment_intent, platform_fee_cent`)
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle()
  if (error) log('verkoop lezen', error.code, error.message)
  const v = verkoopUitRij(data)
  if (!v || !data || typeof data.stripe_account_id !== 'string') return null
  return { ...v, stripeAccountId: data.stripe_account_id, paymentIntent: typeof data.stripe_payment_intent === 'string' ? data.stripe_payment_intent : null, platformFeeCent: typeof data.platform_fee_cent === 'number' ? data.platform_fee_cent : 0 }
}

/** Compare-and-set: alleen een betaalde verkoop zonder eerdere aanvraag. */
export async function claimTerugbetaling(admin: SupabaseClient, userId: string, id: string): Promise<boolean> {
  const { data, error } = await admin
    .from('club_betalen_verkopen')
    .update({ terugbetaling_aangevraagd_op: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', id)
    .eq('status', 'betaald')
    .is('terugbetaling_aangevraagd_op', null)
    .select('id')
  if (error) log('terugbetaling vastleggen', error.code, error.message)
  return !error && (data ?? []).length === 1
}

export async function geefTerugbetalingVrij(admin: SupabaseClient, userId: string, id: string): Promise<void> {
  const { error } = await admin.from('club_betalen_verkopen').update({ terugbetaling_aangevraagd_op: null }).eq('user_id', userId).eq('id', id).eq('status', 'betaald')
  if (error) log('terugbetaling vrijgeven', error.code, error.message)
}

// ─── Tegoeden ───────────────────────────────────────────────────────────────

export async function haalTegoeden(admin: SupabaseClient, userId: string, lidId: string): Promise<Tegoed[] | null> {
  const { data, error } = await admin.from('club_betalen_tegoeden').select(TEGOED_KOLOMMEN).eq('user_id', userId).eq('lid_id', lidId).order('aangemaakt_op', { ascending: false }).limit(100)
  if (error) {
    log('tegoeden lezen', error.code, error.message)
    return null
  }
  return (data ?? []).map(tegoedUitRij).filter((t): t is Tegoed => t !== null)
}

export interface Afboeking {
  userId: string
  lidId: string
  soort: TegoedSoort
  vestiging: string
  reserveringId: string | null
  afspraakId: string | null
  door: string
}

/** 'ok' = afgeboekt, 'geen' = geen bruikbaar tegoed, 'al' = al afgeboekt, 'fout' = storing. */
export async function boekTegoedAf(admin: SupabaseClient, a: Afboeking): Promise<'ok' | 'geen' | 'al' | 'fout'> {
  const { data, error } = await admin.rpc('club_betalen_afboeken', {
    p_user: a.userId,
    p_lid: a.lidId,
    p_soort: a.soort,
    p_vestiging: a.vestiging,
    p_reservering: a.reserveringId,
    p_afspraak: a.afspraakId,
    p_door: a.door,
  })
  if (error) {
    if (/al_afgeboekt/.test(error.message)) return 'al'
    log('tegoed afboeken', error.code, error.message)
    return 'fout'
  }
  return typeof data === 'string' ? 'ok' : 'geen'
}

export async function geefTegoedTerug(admin: SupabaseClient, a: Omit<Afboeking, 'soort' | 'vestiging'>): Promise<boolean | null> {
  const { data, error } = await admin.rpc('club_betalen_teruggeven', { p_user: a.userId, p_lid: a.lidId, p_reservering: a.reserveringId, p_afspraak: a.afspraakId, p_door: a.door })
  if (error) {
    log('tegoed teruggeven', error.code, error.message)
    return null
  }
  return data === true
}

/** Netto afgeboekt voor deze afspraak (negatief = er staat een sessie op). */
export async function nettoVoorAfspraak(admin: SupabaseClient, userId: string, afspraakId: string): Promise<number | null> {
  const { data, error } = await admin.from('club_betalen_mutaties').select('aantal').eq('user_id', userId).eq('afspraak_id', afspraakId).limit(100)
  if (error) {
    log('mutaties lezen', error.code, error.message)
    return null
  }
  return (data ?? []).reduce((som, r) => som + (typeof r.aantal === 'number' ? r.aantal : 0), 0)
}

// ─── Webhook ────────────────────────────────────────────────────────────────

export type EventClaim = 'nieuw' | 'dubbel' | 'fout'

export async function claimEvent(admin: SupabaseClient, eventId: string, type: string): Promise<EventClaim> {
  const { error } = await admin.from('club_betalen_stripe_events').insert({ event_id: eventId, type: type.slice(0, 80) })
  if (!error) return 'nieuw'
  if (error.code === '23505') return 'dubbel'
  log('event registreren', error.code)
  return 'fout'
}

export async function geefEventVrij(admin: SupabaseClient, eventId: string): Promise<void> {
  const { error } = await admin.from('club_betalen_stripe_events').delete().eq('event_id', eventId)
  if (error) log('event vrijgeven', error.code)
}

export interface Afronding {
  verkoopId: string
  sessieId: string
  paymentIntent: string | null
  bedragCent: number
  account: string
}

export async function rondVerkoopAf(admin: SupabaseClient, a: Afronding): Promise<string | null> {
  const { data, error } = await admin.rpc('club_betalen_afronden', { p_verkoop: a.verkoopId, p_sessie: a.sessieId, p_intent: a.paymentIntent, p_bedrag: a.bedragCent, p_account: a.account })
  if (error) log('verkoop afronden', error.code, error.message)
  return typeof data === 'string' ? data : null
}

export async function verwerkTerugbetaling(admin: SupabaseClient, paymentIntent: string, account: string, terugCent: number): Promise<string | null> {
  const { data, error } = await admin.rpc('club_betalen_terugbetaald', { p_intent: paymentIntent, p_account: account, p_terug: terugCent })
  if (error) log('terugbetaling verwerken', error.code, error.message)
  return typeof data === 'string' ? data : null
}

/** Een open verkoop die niet betaald werd: mislukt of verlopen. Alleen als sessie en account kloppen. */
export async function sluitOpenVerkoop(admin: SupabaseClient, sessieId: string, account: string, status: 'mislukt' | 'verlopen'): Promise<'ok' | 'fout'> {
  const { error } = await admin.from('club_betalen_verkopen').update({ status }).eq('stripe_sessie_id', sessieId).eq('stripe_account_id', account).eq('status', 'open')
  if (error) log('verkoop sluiten', error.code, error.message)
  return error ? 'fout' : 'ok'
}
