// ─── Club, health: adapter voor Polar AccessLink (trainingen) (PUUR) ────────
// Volgens de openbare AccessLink API v3 (polar.com/accesslink-api):
//   autoriseren  https://flow.polar.com/oauth2/authorization  (scope accesslink.read_all)
//   token        POST https://polarremote.com/v2/oauth2/token  (Basic-authenticatie)
//   registreren  POST https://www.polaraccesslink.com/v3/users  (een keer per lid, 409 = al gedaan)
//   trainingen   GET  https://www.polaraccesslink.com/v3/exercises  (laatste 30 dagen)
//   intrekken    DELETE https://www.polaraccesslink.com/v3/users/<polar-user-id>
// Tokens verlopen niet tot ze worden ingetrokken; er is geen refresh token.
// Webhook: een per client, ondertekend met HMAC SHA-256 (zie webhook.ts).
// Slaap, Nightly Recharge en rusthartslag zitten in andere endpoints: later.

import type { Meting } from '../typen'
import {
  alsRecord, basicKop, beoordeelHttp, formulier, FORM_KOP, getalOfNull, isoDuurSec, tekstOfNull,
  type DataPagina, type HealthAdapter, type Tokens,
} from '../adapter'

const AUTORISEER_URL = 'https://flow.polar.com/oauth2/authorization'
const TOKEN_URL = 'https://polarremote.com/v2/oauth2/token'
const API = 'https://www.polaraccesslink.com/v3'

function leesTokens(json: unknown, nu: Date, vorige?: Tokens): Tokens | null {
  const r = alsRecord(json)
  const accessToken = tekstOfNull(r?.access_token)
  if (!r || !accessToken) return null
  const duur = getalOfNull(r.expires_in)
  return {
    accessToken,
    refreshToken: null,
    verlooptOp: duur !== null && duur > 0 ? new Date(nu.getTime() + duur * 1000).toISOString() : null,
    externGebruikerId: tekstOfNull(r.x_user_id) ?? vorige?.externGebruikerId ?? null,
    scope: tekstOfNull(r.scope) ?? vorige?.scope ?? null,
  }
}

/** Polar geeft de lokale starttijd zonder zone plus de afwijking in minuten. */
function startUtc(lokaal: string, offsetMin: number | null): string | null {
  const t = Date.parse(`${lokaal}Z`)
  if (Number.isNaN(t)) return null
  return new Date(t - (offsetMin ?? 0) * 60_000).toISOString()
}

function training(ruw: unknown): Meting | null {
  const a = alsRecord(ruw)
  const id = tekstOfNull(a?.id)
  const lokaal = tekstOfNull(a?.start_time)
  const duur = isoDuurSec(a?.duration)
  if (!a || !id || !lokaal || duur === null) return null
  const start = startUtc(lokaal, getalOfNull(a.start_time_utc_offset))
  if (!start) return null
  const hr = alsRecord(a.heart_rate)
  return {
    soort: 'training',
    waarde: duur / 60,
    training: { soort: tekstOfNull(a.detailed_sport_info) ?? tekstOfNull(a.sport) ?? 'Training', duurSec: duur, kcal: getalOfNull(a.calories), gemHartslag: getalOfNull(hr?.average) },
    bron: 'polar',
    externId: id,
    gemetenOp: start,
  }
}

function leesData(json: unknown): DataPagina | null {
  if (!Array.isArray(json)) return null
  return { metingen: json.map(training).filter((m): m is Meting => m !== null), volgendePagina: null, nieuweCursor: null }
}

export const polar: HealthAdapter = {
  bron: 'polar',
  pkce: false,
  autorisatieUrl: ({ clientId, redirectUri, state }) =>
    `${AUTORISEER_URL}?${new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: redirectUri, scope: 'accesslink.read_all', state })}`,
  tokenVerzoek: (s, a) => ({
    methode: 'POST',
    url: TOKEN_URL,
    headers: { ...FORM_KOP, Authorization: basicKop(s.clientId, s.secret) },
    // Polar kent geen refresh token; verversen kan niet en wordt dus nooit gevraagd.
    body: formulier(a.soort === 'code' ? { grant_type: 'authorization_code', code: a.code, redirect_uri: a.redirectUri } : { grant_type: 'refresh_token', refresh_token: a.refreshToken }),
  }),
  leesTokens,
  dataVerzoek: (tokens) => ({ methode: 'GET', url: `${API}/exercises`, headers: { Accept: 'application/json', Authorization: `Bearer ${tokens.accessToken}` } }),
  leesData: (json) => leesData(json),
  beoordeel: beoordeelHttp,
  naKoppelen: (tokens) =>
    tokens.externGebruikerId
      ? { methode: 'POST', url: `${API}/users`, headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${tokens.accessToken}` }, body: JSON.stringify({ 'member-id': `ayg-${tokens.externGebruikerId}` }) }
      : null,
  intrekVerzoek: (tokens) =>
    tokens.externGebruikerId ? { methode: 'DELETE', url: `${API}/users/${encodeURIComponent(tokens.externGebruikerId)}`, headers: { Authorization: `Bearer ${tokens.accessToken}` } } : null,
}
