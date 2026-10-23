// ─── Club, health: adapter voor Oura (ring) (PUUR) ──────────────────────────
// Volgens de openbare Oura API v2 (cloud.ouraring.com/v2/docs):
//   autoriseren  https://cloud.ouraring.com/oauth/authorize  (scopes daily heartrate workout)
//   token        POST https://api.ouraring.com/oauth/token
//   gegevens     GET  https://api.ouraring.com/v2/usercollection/<soort>?start_date&end_date&next_token
//   intrekken    GET  https://api.ouraring.com/oauth/revoke?access_token=
// Een ronde loopt langs vier lijsten: sleep, daily_activity, workout en vO2_max.
// De pagina is "<nummer van de lijst>|<next_token>".
// Regels van Oura (providers.ts): geen AI-verwerking, wissen binnen 72 uur na een
// verzoek. Rusthartslag = de laagste hartslag tijdens de nacht (zo noemt Oura het ook).

import type { Meting } from '../typen'
import {
  alsRecord, beoordeelHttp, datumUtc, formulier, FORM_KOP, getalOfNull, tekstOfNull,
  type DataPagina, type HealthAdapter, type Tokens,
} from '../adapter'

const AUTORISEER_URL = 'https://cloud.ouraring.com/oauth/authorize'
const TOKEN_URL = 'https://api.ouraring.com/oauth/token'
const API = 'https://api.ouraring.com/v2/usercollection'
const INTREK_URL = 'https://api.ouraring.com/oauth/revoke'

export const OURA_LIJSTEN = ['sleep', 'daily_activity', 'workout', 'vO2_max'] as const
export const OURA_EERSTE_DAGEN = 90
/** De cursor gaat twee dagen terug, zodat een nacht die nog werd bijgewerkt opnieuw meekomt. */
const OVERLAP_DAGEN = 2

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
  return { lijst: Number.isInteger(lijst) && lijst >= 0 && lijst < OURA_LIJSTEN.length ? lijst : 0, token: token || null }
}

function slaap(r: Record<string, unknown>, id: string): Meting[] {
  // Alleen de hoofdslaap; dutjes tellen niet als nacht.
  if (r.type !== 'long_sleep') return []
  const eind = tekstOfNull(r.bedtime_end)
  if (!eind) return []
  const uit: Meting[] = []
  const duur = getalOfNull(r.total_sleep_duration)
  if (duur !== null) uit.push({ soort: 'slaap_minuten', waarde: duur / 60, training: null, bron: 'oura', externId: `slaap:${id}`, gemetenOp: eind })
  const hrv = getalOfNull(r.average_hrv)
  if (hrv !== null) uit.push({ soort: 'hrv_ms', waarde: hrv, training: null, bron: 'oura', externId: `hrv:${id}`, gemetenOp: eind })
  const rust = getalOfNull(r.lowest_heart_rate)
  if (rust !== null) uit.push({ soort: 'rusthartslag', waarde: rust, training: null, bron: 'oura', externId: `rust:${id}`, gemetenOp: eind })
  return uit
}

function dagMoment(dag: unknown): string | null {
  return typeof dag === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dag) ? `${dag}T12:00:00.000Z` : null
}

function meting(lijst: (typeof OURA_LIJSTEN)[number], ruw: unknown): Meting[] {
  const r = alsRecord(ruw)
  const id = tekstOfNull(r?.id)
  if (!r || !id) return []
  if (lijst === 'sleep') return slaap(r, id)
  if (lijst === 'daily_activity') {
    const op = dagMoment(r.day)
    const stappen = getalOfNull(r.steps)
    return op && stappen !== null ? [{ soort: 'stappen', waarde: stappen, training: null, bron: 'oura', externId: `stappen:${r.day as string}`, gemetenOp: op }] : []
  }
  if (lijst === 'vO2_max') {
    const op = dagMoment(r.day)
    const vo2 = getalOfNull(r.vo2_max)
    return op && vo2 !== null ? [{ soort: 'vo2max', waarde: vo2, training: null, bron: 'oura', externId: `vo2:${id}`, gemetenOp: op }] : []
  }
  const start = tekstOfNull(r.start_datetime)
  const eind = tekstOfNull(r.end_datetime)
  if (!start || !eind) return []
  const duurSec = (Date.parse(eind) - Date.parse(start)) / 1000
  if (!Number.isFinite(duurSec)) return []
  return [{ soort: 'training', waarde: duurSec / 60, training: { soort: tekstOfNull(r.activity) ?? 'Training', duurSec, kcal: getalOfNull(r.calories), gemHartslag: null }, bron: 'oura', externId: `training:${id}`, gemetenOp: new Date(start).toISOString() }]
}

function leesData(json: unknown, nu: Date, pagina: string | null): DataPagina | null {
  const r = alsRecord(json)
  if (!r || !Array.isArray(r.data)) return null
  const { lijst } = leesPagina(pagina)
  const naam = OURA_LIJSTEN[lijst]
  const metingen = r.data.flatMap((d) => meting(naam, d))
  const volgend = tekstOfNull(r.next_token)
  const volgendePagina = volgend ? `${lijst}|${volgend}` : lijst + 1 < OURA_LIJSTEN.length ? `${lijst + 1}|` : null
  return { metingen, volgendePagina, nieuweCursor: datumUtc(new Date(nu.getTime() - OVERLAP_DAGEN * 86_400_000)) }
}

export const oura: HealthAdapter = {
  bron: 'oura',
  pkce: false,
  autorisatieUrl: ({ clientId, redirectUri, state }) =>
    `${AUTORISEER_URL}?${new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: redirectUri, scope: 'daily heartrate workout', state })}`,
  tokenVerzoek: (s, a) => ({
    methode: 'POST',
    url: TOKEN_URL,
    headers: FORM_KOP,
    body: formulier(
      a.soort === 'code'
        ? { grant_type: 'authorization_code', code: a.code, redirect_uri: a.redirectUri, client_id: s.clientId, client_secret: s.secret }
        : { grant_type: 'refresh_token', refresh_token: a.refreshToken, client_id: s.clientId, client_secret: s.secret },
    ),
  }),
  leesTokens,
  dataVerzoek: (tokens, cursor, pagina, nu) => {
    const { lijst, token } = leesPagina(pagina)
    const vraag = new URLSearchParams({
      start_date: cursor ?? datumUtc(new Date(nu.getTime() - OURA_EERSTE_DAGEN * 86_400_000)),
      end_date: datumUtc(new Date(nu.getTime() + 86_400_000)),
    })
    if (token) vraag.set('next_token', token)
    return { methode: 'GET', url: `${API}/${OURA_LIJSTEN[lijst]}?${vraag}`, headers: { Accept: 'application/json', Authorization: `Bearer ${tokens.accessToken}` } }
  },
  leesData,
  beoordeel: beoordeelHttp,
  intrekVerzoek: (tokens) => ({ methode: 'GET', url: `${INTREK_URL}?${new URLSearchParams({ access_token: tokens.accessToken })}`, headers: { Accept: 'application/json' } }),
}
