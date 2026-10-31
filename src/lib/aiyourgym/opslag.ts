// ─── AI Your Gym: aanmeldingen en Stripe-events opslaan (SERVER-ONLY) ───────
// Tabellen ayg_aanmeldingen en ayg_stripe_events (migratie 422) in de
// LifeOS-database, alleen via de service role.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Aanmelding } from './aanmelding'
import { PAKKET_SLEUTELS, leesPakketKeuze, metBasis, type PakketSleutel } from './pakketten'
import { isAanmeldStatus, volgendeStatus, type AanmeldStatus, type Gebeurtenis } from './status'

export const AANMELDING_KOLOMMEN = 'id, pakket, pakketten, sportschool_naam, slug, aantal_vestigingen, eigenaar_naam, eigenaar_email, eigenaar_telefoon, status, stripe_customer_id, stripe_subscription_id, stripe_session_id, organisatie_id, eigenaar_wachtwoord_hash, aangemaakt_op, bijgewerkt_op'

export interface AanmeldingRij {
  id: string
  /** 'los' voor een modulaire aanmelding; oude aanmeldingen: start, club of keten. */
  pakket: string
  /** De gekozen pakketten, altijd met de basis. Een oude aanmelding (zonder lijst) kreeg alles. */
  pakketten: PakketSleutel[]
  sportschoolNaam: string
  slug: string
  aantalVestigingen: number
  eigenaarNaam: string
  eigenaarEmail: string
  eigenaarTelefoon: string
  status: AanmeldStatus
  stripeSessionId: string | null
  stripeSubscriptionId: string | null
  organisatieId: string | null
  aangemaaktOp: string
  bijgewerktOp: string
  /** SERVER-ONLY. Hash van het gekozen wachtwoord, tot de sportschool is ingericht. */
  eigenaarWachtwoordHash: string | null
}

/** Een checkout die zo lang niet is afgerond, houdt het adres niet meer vast (Stripe laat hem na 24 uur verlopen). */
const WACHT_HOUDT_ADRES_MS = 24 * 60 * 60 * 1000
/** Hangt een inrichting langer dan dit, dan mag een nieuwe poging het overnemen. */
export const INRICHTEN_VASTGELOPEN_MS = 10 * 60 * 1000

function tekst(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v ? v : null
}

export function aanmeldingUitRij(rij: unknown): AanmeldingRij | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (typeof r.id !== 'string' || !isAanmeldStatus(r.status)) return null
  return {
    id: r.id,
    pakket: tekst(r.pakket),
    pakketten: metBasis(leesPakketKeuze(r.pakketten) ?? PAKKET_SLEUTELS),
    sportschoolNaam: tekst(r.sportschool_naam),
    slug: tekst(r.slug),
    aantalVestigingen: typeof r.aantal_vestigingen === 'number' ? r.aantal_vestigingen : 1,
    eigenaarNaam: tekst(r.eigenaar_naam),
    eigenaarEmail: tekst(r.eigenaar_email),
    eigenaarTelefoon: tekst(r.eigenaar_telefoon),
    status: r.status,
    stripeSessionId: tekstOfNull(r.stripe_session_id),
    stripeSubscriptionId: tekstOfNull(r.stripe_subscription_id),
    organisatieId: tekstOfNull(r.organisatie_id),
    eigenaarWachtwoordHash: tekstOfNull(r.eigenaar_wachtwoord_hash),
    aangemaaktOp: tekst(r.aangemaakt_op),
    bijgewerktOp: tekst(r.bijgewerkt_op),
  }
}

// ─── Beschikbaarheid ────────────────────────────────────────────────────────

/** Is dit adres nog vrij? Null bij een databasefout (dan niet doorgaan). */
export async function slugVrij(admin: SupabaseClient, slug: string, nu: Date): Promise<boolean | null> {
  const [org, bezet, wacht] = await Promise.all([
    admin.from('club_organisaties').select('id').eq('slug', slug).limit(1),
    admin.from('ayg_aanmeldingen').select('id').eq('slug', slug).in('status', ['inrichten', 'actief', 'betaling_mislukt', 'gepauzeerd', 'test']).limit(1),
    admin.from('ayg_aanmeldingen').select('id').eq('slug', slug).eq('status', 'wacht_op_betaling').gte('aangemaakt_op', new Date(nu.getTime() - WACHT_HOUDT_ADRES_MS).toISOString()).limit(1),
  ])
  if (org.error || bezet.error || wacht.error) {
    console.error('[aiyourgym] beschikbaarheid lezen mislukt', org.error?.message ?? bezet.error?.message ?? wacht.error?.message)
    return null
  }
  return (org.data ?? []).length === 0 && (bezet.data ?? []).length === 0 && (wacht.data ?? []).length === 0
}

/** Te veel aanmeldingen in het laatste uur (per e-mailadres en in totaal)? Null bij een databasefout. */
export async function teVeelRecent(admin: SupabaseClient, email: string, nu: Date): Promise<boolean | null> {
  const sinds = new Date(nu.getTime() - 60 * 60_000).toISOString()
  const [eigen, alles] = await Promise.all([
    admin.from('ayg_aanmeldingen').select('id', { count: 'exact', head: true }).eq('eigenaar_email', email).gte('aangemaakt_op', sinds),
    admin.from('ayg_aanmeldingen').select('id', { count: 'exact', head: true }).gte('aangemaakt_op', sinds),
  ])
  if (eigen.error || alles.error) return null
  return (eigen.count ?? 0) >= 5 || (alles.count ?? 0) >= 200
}

// ─── Aanmeldingen ───────────────────────────────────────────────────────────

export async function maakAanmelding(admin: SupabaseClient, a: Aanmelding, status: 'aanvraag' | 'wacht_op_betaling', nu: Date, wachtwoordHash: string | null = null): Promise<string | null> {
  const { data, error } = await admin
    .from('ayg_aanmeldingen')
    .insert({
      pakket: 'los',
      pakketten: a.pakketten,
      sportschool_naam: a.sportschoolNaam,
      slug: a.slug,
      aantal_vestigingen: a.aantalVestigingen,
      eigenaar_naam: a.eigenaarNaam,
      eigenaar_email: a.eigenaarEmail,
      eigenaar_telefoon: a.eigenaarTelefoon,
      status,
      akkoord_op: nu.toISOString(),
      // Een aanvraag wordt geen sportschool via deze weg: dan ook geen wachtwoord bewaren.
      eigenaar_wachtwoord_hash: status === 'wacht_op_betaling' ? wachtwoordHash : null,
    })
    .select('id')
    .single()
  if (error || !data) {
    console.error('[aiyourgym] aanmelding opslaan mislukt', error?.code ?? '')
    return null
  }
  return String((data as { id: unknown }).id)
}

export async function koppelSessie(admin: SupabaseClient, id: string, sessieId: string): Promise<boolean> {
  const { error } = await admin.from('ayg_aanmeldingen').update({ stripe_session_id: sessieId, bijgewerkt_op: new Date().toISOString() }).eq('id', id).eq('status', 'wacht_op_betaling')
  if (error) console.error('[aiyourgym] sessie koppelen mislukt', error.code ?? '')
  return !error
}

export async function vindAanmelding(admin: SupabaseClient, id: string): Promise<AanmeldingRij | null> {
  const { data, error } = await admin.from('ayg_aanmeldingen').select(AANMELDING_KOLOMMEN).eq('id', id).maybeSingle()
  if (error) console.error('[aiyourgym] aanmelding lezen mislukt', error.code ?? '')
  return aanmeldingUitRij(data)
}

export async function vindOpSessie(admin: SupabaseClient, sessieId: string): Promise<AanmeldingRij | null> {
  const { data, error } = await admin.from('ayg_aanmeldingen').select(AANMELDING_KOLOMMEN).eq('stripe_session_id', sessieId).maybeSingle()
  if (error) console.error('[aiyourgym] aanmelding lezen mislukt', error.code ?? '')
  return aanmeldingUitRij(data)
}

/**
 * Compare-and-set: alleen wie de status van wacht_op_betaling (of een
 * vastgelopen inrichting) naar inrichten zet, richt de sportschool in. Twee
 * gelijktijdige events of een event plus de welkomstpagina: precies een wint.
 */
export async function claimInrichten(admin: SupabaseClient, a: AanmeldingRij, nu: Date): Promise<boolean> {
  const grens = new Date(nu.getTime() - INRICHTEN_VASTGELOPEN_MS)
  const vastgelopen = a.status === 'inrichten' && Date.parse(a.bijgewerktOp) < grens.getTime()
  if (a.status !== 'wacht_op_betaling' && !vastgelopen) return false
  const basis = admin.from('ayg_aanmeldingen').update({ status: 'inrichten', bijgewerkt_op: nu.toISOString() }).eq('id', a.id).eq('status', a.status)
  const { data, error } = await (vastgelopen ? basis.lt('bijgewerkt_op', grens.toISOString()) : basis).select('id')
  if (error) {
    console.error('[aiyourgym] inrichten claimen mislukt', error.code ?? '')
    // Het adres is intussen van een andere sportschool (unieke index, migratie 433): geen tweede omgeving, Kane lost het met de hand op.
    if (error.code === '23505') await admin.from('ayg_aanmeldingen').update({ status: 'aanvraag', bijgewerkt_op: nu.toISOString() }).eq('id', a.id).eq('status', a.status)
    return false
  }
  return Array.isArray(data) && data.length === 1
}

export async function bewaarOrganisatie(admin: SupabaseClient, id: string, organisatieId: string | null): Promise<boolean> {
  const { error } = await admin.from('ayg_aanmeldingen').update({ organisatie_id: organisatieId, bijgewerkt_op: new Date().toISOString() }).eq('id', id).eq('status', 'inrichten')
  return !error
}

export async function rondInrichtingAf(admin: SupabaseClient, id: string, s: { klantId: string | null; abonnementId: string | null }): Promise<boolean> {
  const { error } = await admin
    .from('ayg_aanmeldingen')
    .update({ status: 'actief', stripe_customer_id: s.klantId, stripe_subscription_id: s.abonnementId, eigenaar_wachtwoord_hash: null, bijgewerkt_op: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'inrichten')
  if (error) console.error('[aiyourgym] inrichting afronden mislukt', error.code ?? '')
  return !error
}

/**
 * Het adres van de eigenaar kan al inloggen: de aanmelding wordt een aanvraag
 * voor Kane. Geen sportschool, en het wachtwoord van deze aanmelding gaat weg.
 */
export async function zetNaarNakijken(admin: SupabaseClient, id: string): Promise<void> {
  const { error } = await admin.from('ayg_aanmeldingen').update({ status: 'aanvraag', organisatie_id: null, eigenaar_wachtwoord_hash: null, bijgewerkt_op: new Date().toISOString() }).eq('id', id).eq('status', 'inrichten')
  if (error) console.error('[aiyourgym] aanmelding naar nakijken mislukt', error.code ?? '')
}

/** Mislukt: terug naar wacht_op_betaling, zodat de volgende poging van Stripe het opnieuw doet. */
export async function geefInrichtingVrij(admin: SupabaseClient, id: string): Promise<void> {
  const { error } = await admin.from('ayg_aanmeldingen').update({ status: 'wacht_op_betaling', organisatie_id: null, bijgewerkt_op: new Date().toISOString() }).eq('id', id).eq('status', 'inrichten')
  if (error) console.error('[aiyourgym] inrichting vrijgeven mislukt', error.code ?? '')
}

/** Een event van Stripe over een lopend abonnement. 'fout' = Stripe moet het opnieuw proberen. */
export async function werkStatusBij(admin: SupabaseClient, abonnementId: string, g: Gebeurtenis): Promise<'ok' | 'fout'> {
  const { data, error } = await admin.from('ayg_aanmeldingen').select(AANMELDING_KOLOMMEN).eq('stripe_subscription_id', abonnementId).maybeSingle()
  if (error) return 'fout'
  const a = aanmeldingUitRij(data)
  if (!a) return 'ok'
  const nieuw = volgendeStatus(a.status, g)
  if (!nieuw) return 'ok'
  const { error: schrijfFout } = await admin.from('ayg_aanmeldingen').update({ status: nieuw, bijgewerkt_op: new Date().toISOString() }).eq('id', a.id).eq('status', a.status)
  return schrijfFout ? 'fout' : 'ok'
}

// ─── Stripe-events: elk event precies een keer ──────────────────────────────

export type EventClaim = 'nieuw' | 'dubbel' | 'fout'

export async function claimEvent(admin: SupabaseClient, eventId: string, type: string): Promise<EventClaim> {
  const { error } = await admin.from('ayg_stripe_events').insert({ event_id: eventId, type: type.slice(0, 80) })
  if (!error) return 'nieuw'
  if (error.code === '23505') return 'dubbel'
  console.error('[aiyourgym] event registreren mislukt', error.code ?? '')
  return 'fout'
}

/** Verwerking mislukt: claim weg, zodat de herhaling van Stripe het opnieuw mag doen. */
export async function geefEventVrij(admin: SupabaseClient, eventId: string): Promise<void> {
  const { error } = await admin.from('ayg_stripe_events').delete().eq('event_id', eventId)
  if (error) console.error('[aiyourgym] event vrijgeven mislukt', error.code ?? '')
}

// ─── Afgenomen pakketten (besluit Kane 29-10-2026) ──────────────────────────

/**
 * Stripe meldt welke regels (pakketten) een abonnement nu heeft: zet precies
 * die pakketten op de sportschool en de aanmelding. Idempotent (een vaste
 * lijst, geen optelling). 'fout' = Stripe moet het opnieuw proberen.
 */
export async function zetPakkettenVanAbonnement(admin: SupabaseClient, abonnementId: string, pakketten: readonly PakketSleutel[]): Promise<'ok' | 'fout'> {
  if (pakketten.length === 0) return 'ok'
  // De basis staat er altijd in (besluit Kane 31-10-2026).
  const lijst = metBasis(pakketten)
  const { data, error } = await admin.from('ayg_aanmeldingen').select('id, organisatie_id').eq('stripe_subscription_id', abonnementId).maybeSingle()
  if (error) return 'fout'
  const rij = data as { id?: unknown; organisatie_id?: unknown } | null
  if (!rij || typeof rij.id !== 'string') return 'ok'
  const nu = new Date().toISOString()
  const { error: aFout } = await admin.from('ayg_aanmeldingen').update({ pakketten: lijst, bijgewerkt_op: nu }).eq('id', rij.id)
  if (aFout) return 'fout'
  if (typeof rij.organisatie_id !== 'string') return 'ok'
  const { error: oFout } = await admin.from('club_organisaties').update({ pakketten: lijst, bijgewerkt_op: nu }).eq('id', rij.organisatie_id)
  if (oFout) console.error('[aiyourgym] pakketten bijwerken mislukt', oFout.code ?? '')
  return oFout ? 'fout' : 'ok'
}
