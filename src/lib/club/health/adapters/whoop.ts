// ─── Club, health: adapter voor WHOOP (PUUR) ────────────────────────────────
// Volgens de openbare WHOOP API v2 (developer.whoop.com):
//   autoriseren  https://api.prod.whoop.com/oauth/oauth2/auth  (scope offline read:profile read:recovery read:sleep read:workout read:body_measurement)
//   lid-id       GET  https://api.prod.whoop.com/developer/v2/user/profile/basic  (alleen user_id bewaard, voor webhooks)
//   token        POST https://api.prod.whoop.com/oauth/oauth2/token  (access token 1 uur; offline = refresh token)
//   gegevens     GET  https://api.prod.whoop.com/developer/v2/{recovery, activity/sleep, activity/workout, user/measurement/body}
//   intrekken    DELETE https://api.prod.whoop.com/developer/v2/user/access
// Een ronde loopt langs vier lijsten; de pagina is "<nummer>|<nextToken>".
// WHOOP geeft energie in kilojoule; omgerekend naar kcal (1 kcal = 4,184 kJ).
// Webhooks: ondertekend met HMAC SHA-256 over tijdstempel plus body (webhook.ts).

import type { Meting } from '../typen'
import {
  alsRecord, beoordeelHttp, datumUtc, formulier, FORM_KOP, getalOfNull, tekstOfNull,
  type DataPagina, type HealthAdapter, type Tokens,
} from '../adapter'

const AUTORISEER_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth'
const TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token'
const API = 'https://api.prod.whoop.com/developer/v2'
const SCOPE = 'offline read:profile read:recovery read:sleep read:workout read:body_measurement'

export const WHOOP_LIJSTEN = ['recovery', 'activity/sleep', 'activity/workout', 'user/measurement/body'] as const
export const WHOOP_EERSTE_DAGEN = 90
const OVERLAP_DAGEN = 2
const KJ_PER_KCAL = 4.184

function leesTokens(json: unknown, nu: Date, vorige?: Tokens): Tokens | null {
  const r = alsRecord(json)
  const accessToken = tekstOfNull(r?.access_token)
  if (!r || !accessToken) return null
  const duur = getalOfNull(r.expires_in)
  return {
    accessToken,
    refreshToken: tekstOfNull(r.refresh_token) ?? vorige?.refreshToken ?? null,
    verlooptOp: duur !== null ? new Date(nu.getTime() + duur * 1000).toISOString() : null,
    externGebruikerId: vorige?.externGebruikerId ?? null,
    scope: tekstOfNull(r.scope) ?? vorige?.scope ?? null,
  }
}

function leesPagina(pagina: string | null): { lijst: number; token: string | null } {
  if (!pagina) return { lijst: 0, token: null }
  const [nr, token] = pagina.split('|')
  const lijst = Number(nr)
  return { lijst: Number.isInteger(lijst) && lijst >= 0 && lijst < WHOOP_LIJSTEN.length ? lijst : 0, token: token || null }
}

function herstel(r: Record<string, unknown>): Meting[] {
  const id = tekstOfNull(r.cycle_id)
  const op = tekstOfNull(r.created_at)
  const score = alsRecord(r.score)
  if (!id || !op || !score || r.score_state !== 'SCORED') return []
  const uit: Meting[] = []
  const rust = getalOfNull(score.resting_heart_rate)
  if (rust !== null) uit.push({ soort: 'rusthartslag', waarde: rust, training: null, bron: 'whoop', externId: `rust:${id}`, gemetenOp: op })
  const hrv = getalOfNull(score.hrv_rmssd_milli)
  if (hrv !== null) uit.push({ soort: 'hrv_ms', waarde: hrv, training: null, bron: 'whoop', externId: `hrv:${id}`, gemetenOp: op })
  return uit
}

function slaap(r: Record<string, unknown>): Meting[] {
  const id = tekstOfNull(r.id)
  const eind = tekstOfNull(r.end)
  const fases = alsRecord(alsRecord(r.score)?.stage_summary)
  if (!id || !eind || !fases || r.nap === true || r.score_state !== 'SCORED') return []
  const inBed = getalOfNull(fases.total_in_bed_time_milli)
  const wakker = getalOfNull(fases.total_awake_time_milli) ?? 0
  return inBed !== null ? [{ soort: 'slaap_minuten', waarde: Math.max(0, inBed - wakker) / 60_000, training: null, bron: 'whoop', externId: `slaap:${id}`, gemetenOp: eind }] : []
}

function training(r: Record<string, unknown>): Meting[] {
  const id = tekstOfNull(r.id)
  const start = tekstOfNull(r.start)
  const eind = tekstOfNull(r.end)
  if (!id || !start || !eind) return []
  const duurSec = (Date.parse(eind) - Date.parse(start)) / 1000
  if (!Number.isFinite(duurSec)) return []
  const score = alsRecord(r.score)
  const kj = getalOfNull(score?.kilojoule)
  return [{
    soort: 'training',
    waarde: duurSec / 60,
    training: { soort: tekstOfNull(r.sport_name) ?? 'Training', duurSec, kcal: kj !== null ? kj / KJ_PER_KCAL : null, gemHartslag: getalOfNull(score?.average_heart_rate) },
    bron: 'whoop',
    externId: `training:${id}`,
    gemetenOp: new Date(start).toISOString(),
  }]
}

function leesData(json: unknown, nu: Date, pagina: string | null): DataPagina | null {
  const r = alsRecord(json)
  if (!r) return null
  const { lijst } = leesPagina(pagina)
  const naam = WHOOP_LIJSTEN[lijst]
  const volgendeLijst = lijst + 1 < WHOOP_LIJSTEN.length ? `${lijst + 1}|` : null
  const cursor = datumUtc(new Date(nu.getTime() - OVERLAP_DAGEN * 86_400_000))
  if (naam === 'user/measurement/body') {
    // Het gewicht uit het profiel heeft geen datum: een rij per dag.
    const kg = getalOfNull(r.weight_kilogram)
    const metingen: Meting[] = kg !== null ? [{ soort: 'gewicht_kg', waarde: kg, training: null, bron: 'whoop', externId: `gewicht:${datumUtc(nu)}`, gemetenOp: nu.toISOString() }] : []
    return { metingen, volgendePagina: volgendeLijst, nieuweCursor: cursor }
  }
  if (!Array.isArray(r.records)) return null
  const lezer = naam === 'recovery' ? herstel : naam === 'activity/sleep' ? slaap : training
  const metingen = r.records.flatMap((x) => {
    const rec = alsRecord(x)
    return rec ? lezer(rec) : []
  })
  const volgend = tekstOfNull(r.next_token)
  return { metingen, volgendePagina: volgend ? `${lijst}|${volgend}` : volgendeLijst, nieuweCursor: cursor }
}

export const whoop: HealthAdapter = {
  bron: 'whoop',
  pkce: false,
  autorisatieUrl: ({ clientId, redirectUri, state }) =>
    `${AUTORISEER_URL}?${new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: redirectUri, scope: SCOPE, state })}`,
  tokenVerzoek: (s, a) => ({
    methode: 'POST',
    url: TOKEN_URL,
    headers: FORM_KOP,
    body: formulier(
      a.soort === 'code'
        ? { grant_type: 'authorization_code', code: a.code, redirect_uri: a.redirectUri, client_id: s.clientId, client_secret: s.secret }
        : { grant_type: 'refresh_token', refresh_token: a.refreshToken, client_id: s.clientId, client_secret: s.secret, scope: 'offline' },
    ),
  }),
  leesTokens,
  dataVerzoek: (tokens, cursor, pagina, nu) => {
    const { lijst, token } = leesPagina(pagina)
    const naam = WHOOP_LIJSTEN[lijst]
    const kop = { Accept: 'application/json', Authorization: `Bearer ${tokens.accessToken}` }
    if (naam === 'user/measurement/body') return { methode: 'GET', url: `${API}/${naam}`, headers: kop }
    const start = cursor ?? datumUtc(new Date(nu.getTime() - WHOOP_EERSTE_DAGEN * 86_400_000))
    const vraag = new URLSearchParams({ start: `${start}T00:00:00.000Z`, limit: '25' })
    if (token) vraag.set('nextToken', token)
    return { methode: 'GET', url: `${API}/${naam}?${vraag}`, headers: kop }
  },
  leesData,
  beoordeel: beoordeelHttp,
  naKoppelen: (tokens) => ({ methode: 'GET', url: `${API}/user/profile/basic`, headers: { Accept: 'application/json', Authorization: `Bearer ${tokens.accessToken}` } }),
  externIdNaKoppelen: (json) => tekstOfNull(alsRecord(json)?.user_id),
  intrekVerzoek: (tokens) => ({ methode: 'DELETE', url: `${API}/user/access`, headers: { Authorization: `Bearer ${tokens.accessToken}` } }),
}
