// ─── Club, health: webhooks van leveranciers controleren (PUUR, node) ───────
// Een webhook zegt alleen "er is iets nieuws voor gebruiker X". We vertrouwen de
// inhoud nooit: we zetten de koppeling op "nu bijwerken" en halen de gegevens
// zelf op met de tokens van het lid. Zo kan een nep-bericht hooguit een extra
// (onschuldige) sync veroorzaken.
//
// Controle per leverancier:
//   - Withings (Notify) en Strava (Webhook Events) ondertekenen hun berichten
//     niet. Daarom staat er een geheim in het adres dat we bij de leverancier
//     registreren: ?t=<token>, een HMAC van de bron met een eigen sleutel uit
//     CLUB_HEALTH_SLEUTEL. Zonder dat token: 404.
//   - Strava controleert het adres eerst met hub.verify_token (hetzelfde token)
//     en hub.challenge; Strava geeft ook subscription_id mee, die we vergelijken
//     met CLUB_HEALTH_STRAVA_ABONNEMENT_ID als die gezet is.
//   - Polar ondertekent met HMAC SHA-256 over de body (kop Polar-Webhook-Signature,
//     geheim CLUB_HEALTH_POLAR_WEBHOOK_SECRET, dat Polar geeft bij het aanmaken).
//   - WHOOP ondertekent met HMAC SHA-256 over tijdstempel plus body, met het client
//     secret (koppen X-WHOOP-Signature en X-WHOOP-Signature-Timestamp, base64).
//   - Oura controleert het adres met verification_token en challenge (hetzelfde
//     token als ?t=). Oura-meldingen zijn nog niet aan een lid te koppelen (we
//     bewaren geen Oura-gebruikers-id); Oura werkt daarom met de vaste ronde.
// Het token in het adres geldt voor elke bron als eerste slot; de handtekening
// van Polar en WHOOP komt daar bovenop.
// Aanmelden bij de leverancier (Withings: notify subscribe per lid, Strava, Polar,
// Oura en WHOOP: een keer per app) is nog niet gebouwd; zie het rapport.

import { createHmac, timingSafeEqual } from 'node:crypto'
import { leidSleutelAf } from './versleutelen'
import type { BronId } from './typen'

export function webhookToken(bron: BronId, hoofdsleutel: Uint8Array): string {
  return createHmac('sha256', leidSleutelAf(hoofdsleutel, 'webhook')).update(bron, 'utf8').digest('hex').slice(0, 40)
}

export function tokenKlopt(bron: BronId, gegeven: string | null, hoofdsleutel: Uint8Array): boolean {
  if (!gegeven) return false
  const a = Buffer.from(webhookToken(bron, hoofdsleutel))
  const b = Buffer.from(gegeven)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function webhookPad(bron: BronId, hoofdsleutel: Uint8Array): string {
  return `/api/aiyourgym/health/webhook/${bron}?t=${webhookToken(bron, hoofdsleutel)}`
}

export interface WebhookGebeurtenis {
  externGebruikerId: string
  actie: 'bijwerken' | 'ingetrokken'
}

/** Strava: de controle van het adres bij het aanmelden. Geeft de challenge terug, of null. */
export function stravaControle(vraag: URLSearchParams, hoofdsleutel: Uint8Array): string | null {
  if (vraag.get('hub.mode') !== 'subscribe') return null
  if (!tokenKlopt('strava', vraag.get('hub.verify_token'), hoofdsleutel)) return null
  const challenge = vraag.get('hub.challenge')
  return challenge && challenge.length <= 200 ? challenge : null
}

/** Strava: een gebeurtenis (JSON). */
export function stravaGebeurtenis(body: unknown, abonnementId: string | undefined): WebhookGebeurtenis | null {
  if (typeof body !== 'object' || body === null) return null
  const r = body as Record<string, unknown>
  if (abonnementId && String(r.subscription_id ?? '') !== abonnementId) return null
  const eigenaar = typeof r.owner_id === 'number' || typeof r.owner_id === 'string' ? String(r.owner_id) : null
  if (!eigenaar || !/^\d{1,20}$/.test(eigenaar)) return null
  const updates = typeof r.updates === 'object' && r.updates !== null ? (r.updates as Record<string, unknown>) : {}
  if (r.object_type === 'athlete' && updates.authorized === 'false') return { externGebruikerId: eigenaar, actie: 'ingetrokken' }
  if (r.object_type === 'activity') return { externGebruikerId: eigenaar, actie: 'bijwerken' }
  return null
}

/** Withings: een melding (formulier met userid, appli, startdate, enddate). */
export function withingsGebeurtenis(formulier: URLSearchParams): WebhookGebeurtenis | null {
  const userid = formulier.get('userid')
  if (!userid || !/^\d{1,20}$/.test(userid)) return null
  // appli 1 = gewicht en lichaamssamenstelling; andere soorten halen we niet op.
  if (formulier.get('appli') !== '1') return null
  return { externGebruikerId: userid, actie: 'bijwerken' }
}

function hmacGelijk(verwacht: Buffer, gegeven: string | null, codering: 'hex' | 'base64'): boolean {
  if (!gegeven) return false
  const b = Buffer.from(gegeven.trim(), codering)
  return b.length === verwacht.length && timingSafeEqual(b, verwacht)
}

/** Polar: klopt de handtekening over de ruwe body? */
export function polarHandtekeningKlopt(rauw: string, handtekening: string | null, geheim: string | undefined): boolean {
  if (!geheim) return false
  return hmacGelijk(createHmac('sha256', geheim).update(rauw, 'utf8').digest(), handtekening, 'hex')
}

/** Polar: een gebeurtenis (JSON). PING (bij het aanmaken) geeft null. */
export function polarGebeurtenis(body: unknown): WebhookGebeurtenis | null {
  if (typeof body !== 'object' || body === null) return null
  const r = body as Record<string, unknown>
  const id = typeof r.user_id === 'number' || typeof r.user_id === 'string' ? String(r.user_id) : null
  if (!id || !/^\d{1,20}$/.test(id) || r.event !== 'EXERCISE') return null
  return { externGebruikerId: id, actie: 'bijwerken' }
}

/** WHOOP: tijdstempel niet ouder dan 5 minuten, handtekening over tijdstempel plus body. */
export function whoopHandtekeningKlopt(rauw: string, handtekening: string | null, tijdstempel: string | null, secret: string | undefined, nu: Date): boolean {
  if (!secret || !tijdstempel || !/^\d{10,16}$/.test(tijdstempel)) return false
  const ms = tijdstempel.length > 11 ? Number(tijdstempel) : Number(tijdstempel) * 1000
  if (Math.abs(nu.getTime() - ms) > 5 * 60_000) return false
  return hmacGelijk(createHmac('sha256', secret).update(tijdstempel + rauw, 'utf8').digest(), handtekening, 'base64')
}

/** WHOOP: een gebeurtenis (JSON) met user_id en type, bijv. workout.updated. */
export function whoopGebeurtenis(body: unknown): WebhookGebeurtenis | null {
  if (typeof body !== 'object' || body === null) return null
  const r = body as Record<string, unknown>
  const id = typeof r.user_id === 'number' || typeof r.user_id === 'string' ? String(r.user_id) : null
  if (!id || !/^\d{1,20}$/.test(id) || typeof r.type !== 'string') return null
  return /^(workout|sleep|recovery)\./.test(r.type) ? { externGebruikerId: id, actie: 'bijwerken' } : null
}

/** Oura: de controle van het adres. Geeft de challenge terug, of null. */
export function ouraControle(vraag: URLSearchParams, hoofdsleutel: Uint8Array): string | null {
  if (!tokenKlopt('oura', vraag.get('verification_token'), hoofdsleutel)) return null
  const challenge = vraag.get('challenge')
  return challenge && challenge.length <= 200 ? challenge : null
}
