// ─── Club, health: adapter voor Withings (weegschalen) (PUUR) ───────────────
// Volgens de openbare Withings Public API (developer.withings.com):
//   autoriseren  https://account.withings.com/oauth2_user/authorize2  (scope user.metrics)
//   token        POST https://wbsapi.withings.net/v2/oauth2  action=requesttoken
//   metingen     POST https://wbsapi.withings.net/measure    action=getmeas
// Withings antwoordt bijna altijd met HTTP 200 en zet de echte uitslag in
// `status` (0 = goed, 401 = token ongeldig, 601 = te veel verzoeken).
// Meetsoorten: 1 gewicht (kg), 6 vetpercentage, 76 spiermassa (kg). De waarde is
// value * 10^unit. Een meting met attrib 1 is "onzeker wie er op stond": die
// slaan we over, net als de Withings-app zelf die apart laat bevestigen.
// Webhooks (Notify) bestaan; aanmelden staat nog open (zie de kop van webhook.ts).
// [CHECK] Een revoke-endpoint voor de toegang is niet bekend; het lid trekt de
// toegang in de Withings-app in. Wij wissen in elk geval de tokens.

import type { DataSoort, Meting } from '../typen'
import {
  FORM_KOP, alsRecord, beoordeelHttp, formulier, getalOfNull, tekstOfNull,
  type Beoordeling, type DataPagina, type HealthAdapter, type HttpAntwoord, type Tokens,
} from '../adapter'

const AUTORISEER_URL = 'https://account.withings.com/oauth2_user/authorize2'
const TOKEN_URL = 'https://wbsapi.withings.net/v2/oauth2'
const MEET_URL = 'https://wbsapi.withings.net/measure'

/** Eerste keer: zoveel dagen terug ophalen. */
export const WITHINGS_EERSTE_DAGEN = 90

const SOORT_PER_TYPE: Readonly<Record<number, DataSoort>> = { 1: 'gewicht_kg', 6: 'vetpercentage', 76: 'spiermassa_kg' }

function inhoud(json: unknown): Record<string, unknown> | null {
  const r = alsRecord(json)
  if (!r || r.status !== 0) return null
  return alsRecord(r.body)
}

function leesTokens(json: unknown, nu: Date, vorige?: Tokens): Tokens | null {
  const b = inhoud(json)
  const accessToken = tekstOfNull(b?.access_token)
  if (!b || !accessToken) return null
  const duur = getalOfNull(b.expires_in)
  return {
    accessToken,
    refreshToken: tekstOfNull(b.refresh_token) ?? vorige?.refreshToken ?? null,
    verlooptOp: duur !== null ? new Date(nu.getTime() + duur * 1000).toISOString() : null,
    externGebruikerId: tekstOfNull(b.userid) ?? vorige?.externGebruikerId ?? null,
    scope: tekstOfNull(b.scope) ?? vorige?.scope ?? null,
  }
}

function metingenUitGroep(groep: Record<string, unknown>): Meting[] {
  const grpid = tekstOfNull(groep.grpid)
  const datum = getalOfNull(groep.date)
  if (!grpid || datum === null || groep.attrib === 1 || groep.category !== 1) return []
  const lijst = Array.isArray(groep.measures) ? groep.measures : []
  const uit: Meting[] = []
  for (const ruw of lijst) {
    const m = alsRecord(ruw)
    const type = getalOfNull(m?.type)
    const value = getalOfNull(m?.value)
    const unit = getalOfNull(m?.unit)
    const soort = type !== null ? SOORT_PER_TYPE[type] : undefined
    if (!soort || value === null || unit === null) continue
    uit.push({ soort, waarde: value * 10 ** unit, training: null, bron: 'withings', externId: `${grpid}:${type}`, gemetenOp: new Date(datum * 1000).toISOString() })
  }
  return uit
}

function leesData(json: unknown): DataPagina | null {
  const b = inhoud(json)
  if (!b) return null
  const groepen = Array.isArray(b.measuregrps) ? b.measuregrps : []
  const metingen = groepen.flatMap((g) => {
    const r = alsRecord(g)
    return r ? metingenUitGroep(r) : []
  })
  const offset = getalOfNull(b.offset)
  const updatetime = getalOfNull(b.updatetime)
  return {
    metingen,
    volgendePagina: b.more === 1 || b.more === true ? (offset !== null ? String(offset) : null) : null,
    nieuweCursor: updatetime !== null ? String(Math.floor(updatetime)) : null,
  }
}

function beoordeel(a: HttpAntwoord): Beoordeling {
  const http = beoordeelHttp(a)
  if (http !== 'ok') return http
  const status = alsRecord(a.json)?.status
  if (status === 0) return 'ok'
  if (status === 401) return 'token_ongeldig'
  if (status === 601) return 'rem'
  return 'fout'
}

export const withings: HealthAdapter = {
  bron: 'withings',
  pkce: false,
  autorisatieUrl: ({ clientId, redirectUri, state }) =>
    `${AUTORISEER_URL}?${new URLSearchParams({ response_type: 'code', client_id: clientId, scope: 'user.metrics', redirect_uri: redirectUri, state })}`,
  tokenVerzoek: (s, a) => ({
    methode: 'POST',
    url: TOKEN_URL,
    headers: FORM_KOP,
    body: formulier(
      a.soort === 'code'
        ? { action: 'requesttoken', grant_type: 'authorization_code', client_id: s.clientId, client_secret: s.secret, code: a.code, redirect_uri: a.redirectUri }
        : { action: 'requesttoken', grant_type: 'refresh_token', client_id: s.clientId, client_secret: s.secret, refresh_token: a.refreshToken },
    ),
  }),
  leesTokens,
  dataVerzoek: (tokens, cursor, pagina, nu) => {
    const vanaf = cursor ?? String(Math.floor(nu.getTime() / 1000) - WITHINGS_EERSTE_DAGEN * 86_400)
    const velden: Record<string, string> = { action: 'getmeas', meastypes: '1,6,76', category: '1', lastupdate: vanaf }
    if (pagina) velden.offset = pagina
    return { methode: 'POST', url: MEET_URL, headers: { ...FORM_KOP, Authorization: `Bearer ${tokens.accessToken}` }, body: formulier(velden) }
  },
  leesData: (json) => leesData(json),
  beoordeel,
  intrekVerzoek: () => null,
}
