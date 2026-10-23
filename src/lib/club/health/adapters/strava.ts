// ─── Club, health: adapter voor Strava (trainingen) (PUUR) ──────────────────
// Volgens de openbare Strava API v3 (developers.strava.com):
//   autoriseren  https://www.strava.com/oauth/authorize  (scope activity:read_all)
//   token        POST https://www.strava.com/oauth/token
//   trainingen   GET  https://www.strava.com/api/v3/athlete/activities?after=&page=&per_page=
//   intrekken    POST https://www.strava.com/oauth/deauthorize
// Het overzicht van trainingen bevat geen kcal (alleen kilojoules bij fietsen);
// we rekenen niets om en laten kcal dan leeg. Strava remt per 15 minuten en per
// dag: bij een 429 wachten we tot het volgende kwartier.

import type { Meting } from '../typen'
import {
  FORM_KOP, alsRecord, beoordeelHttp, formulier, getalOfNull, tekstOfNull,
  type DataPagina, type HealthAdapter, type Tokens,
} from '../adapter'

const AUTORISEER_URL = 'https://www.strava.com/oauth/authorize'
const TOKEN_URL = 'https://www.strava.com/oauth/token'
const TRAININGEN_URL = 'https://www.strava.com/api/v3/athlete/activities'
const INTREK_URL = 'https://www.strava.com/oauth/deauthorize'

export const STRAVA_PER_PAGINA = 100
export const STRAVA_EERSTE_DAGEN = 90
const KWARTIER_MS = 15 * 60_000

function leesTokens(json: unknown, _nu: Date, vorige?: Tokens): Tokens | null {
  const r = alsRecord(json)
  const accessToken = tekstOfNull(r?.access_token)
  if (!r || !accessToken) return null
  const verloopt = getalOfNull(r.expires_at)
  return {
    accessToken,
    refreshToken: tekstOfNull(r.refresh_token) ?? vorige?.refreshToken ?? null,
    verlooptOp: verloopt !== null ? new Date(verloopt * 1000).toISOString() : null,
    externGebruikerId: tekstOfNull(alsRecord(r.athlete)?.id) ?? vorige?.externGebruikerId ?? null,
    scope: tekstOfNull(r.scope) ?? vorige?.scope ?? null,
  }
}

function training(ruw: unknown): Meting | null {
  const a = alsRecord(ruw)
  const id = tekstOfNull(a?.id)
  const start = tekstOfNull(a?.start_date)
  const duur = getalOfNull(a?.moving_time) ?? getalOfNull(a?.elapsed_time)
  if (!a || !id || !start || duur === null || Number.isNaN(Date.parse(start))) return null
  const soort = tekstOfNull(a.sport_type) ?? tekstOfNull(a.type) ?? 'Training'
  const kcal = getalOfNull(a.calories)
  return {
    soort: 'training',
    waarde: duur / 60,
    training: { soort, duurSec: duur, kcal, gemHartslag: a.has_heartrate === false ? null : getalOfNull(a.average_heartrate) },
    bron: 'strava',
    externId: id,
    gemetenOp: new Date(start).toISOString(),
  }
}

function leesData(json: unknown, pagina: string | null): DataPagina | null {
  if (!Array.isArray(json)) return null
  const metingen = json.map(training).filter((m): m is Meting => m !== null)
  const laatste = metingen.reduce((max, m) => Math.max(max, Math.floor(Date.parse(m.gemetenOp) / 1000)), 0)
  const huidig = Number(pagina ?? '1')
  return {
    metingen,
    volgendePagina: json.length >= STRAVA_PER_PAGINA ? String(huidig + 1) : null,
    nieuweCursor: laatste > 0 ? String(laatste) : null,
  }
}

export const strava: HealthAdapter = {
  bron: 'strava',
  pkce: false,
  autorisatieUrl: ({ clientId, redirectUri, state }) =>
    `${AUTORISEER_URL}?${new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', approval_prompt: 'auto', scope: 'activity:read_all', state })}`,
  tokenVerzoek: (s, a) => ({
    methode: 'POST',
    url: TOKEN_URL,
    headers: FORM_KOP,
    body: formulier(
      a.soort === 'code'
        ? { client_id: s.clientId, client_secret: s.secret, code: a.code, grant_type: 'authorization_code' }
        : { client_id: s.clientId, client_secret: s.secret, refresh_token: a.refreshToken, grant_type: 'refresh_token' },
    ),
  }),
  leesTokens,
  dataVerzoek: (tokens, cursor, pagina, nu) => {
    const na = cursor ?? String(Math.floor(nu.getTime() / 1000) - STRAVA_EERSTE_DAGEN * 86_400)
    const vraag = new URLSearchParams({ after: na, page: pagina ?? '1', per_page: String(STRAVA_PER_PAGINA) })
    return { methode: 'GET', url: `${TRAININGEN_URL}?${vraag}`, headers: { Accept: 'application/json', Authorization: `Bearer ${tokens.accessToken}` } }
  },
  leesData: (json, _nu, pagina) => leesData(json, pagina),
  beoordeel: beoordeelHttp,
  wachtNaRem: (_a, nu) => KWARTIER_MS - (nu.getTime() % KWARTIER_MS) + 5_000,
  intrekVerzoek: (tokens) => ({ methode: 'POST', url: INTREK_URL, headers: { ...FORM_KOP, Authorization: `Bearer ${tokens.accessToken}` }, body: formulier({ access_token: tokens.accessToken }) }),
}
