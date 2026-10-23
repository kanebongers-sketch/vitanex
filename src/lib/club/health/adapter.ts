// ─── Club, health: wat een adapter per leverancier moet kunnen (PUUR) ───────
// Een adapter bouwt alleen verzoeken en leest antwoorden; hij doet zelf nooit
// een netwerkverzoek. De sync-engine (sync.ts) voert ze uit. Zo is elke
// adapter met vaste voorbeeldantwoorden (fixtures) te testen, en is een nieuwe
// leverancier een bestand in adapters/ plus een entry in providers.ts.

import type { BronId, Meting } from './typen'

export interface HttpVerzoek {
  methode: 'GET' | 'POST' | 'DELETE'
  url: string
  headers: Readonly<Record<string, string>>
  /** application/x-www-form-urlencoded, of leeg. */
  body?: string
}

export interface HttpAntwoord {
  status: number
  /** Kopteksten met kleine letters als sleutel. */
  headers: Readonly<Record<string, string>>
  /** De JSON van het antwoord, of null als het geen JSON was. */
  json: unknown
}

export interface Tokens {
  accessToken: string
  refreshToken: string | null
  /** ISO-moment waarop het access token verloopt, of null als onbekend. */
  verlooptOp: string | null
  /** Het id van het lid bij de leverancier (nodig voor webhooks). */
  externGebruikerId: string | null
  scope: string | null
}

export interface ClientSleutels {
  clientId: string
  secret: string
}

export type TokenAanvraag =
  | { soort: 'code'; code: string; codeVerifier: string | null; redirectUri: string }
  | { soort: 'verversen'; refreshToken: string }

/** Hoe het antwoord van de leverancier te lezen is. */
export type Beoordeling = 'ok' | 'token_ongeldig' | 'rem' | 'fout'

export interface DataPagina {
  metingen: Meting[]
  /** De volgende pagina binnen dezelfde ronde, of null als dit de laatste was. */
  volgendePagina: string | null
  /** De cursor voor de volgende ronde (alleen bewaard als de hele ronde lukt). */
  nieuweCursor: string | null
}

export interface HealthAdapter {
  bron: BronId
  /** Stuurt Club een PKCE-uitdaging mee? (alleen als de leverancier het ondersteunt) */
  pkce: boolean
  autorisatieUrl(p: { clientId: string; redirectUri: string; state: string; codeChallenge: string | null }): string
  tokenVerzoek(sleutels: ClientSleutels, aanvraag: TokenAanvraag): HttpVerzoek
  /** Tokens uit het antwoord; bij verversen blijven ontbrekende velden van `vorige` staan. */
  leesTokens(json: unknown, nu: Date, vorige?: Tokens): Tokens | null
  dataVerzoek(tokens: Tokens, cursor: string | null, pagina: string | null, nu: Date): HttpVerzoek
  leesData(json: unknown, nu: Date, pagina: string | null): DataPagina | null
  beoordeel(antwoord: HttpAntwoord): Beoordeling
  /** Hoe lang wachten na 'rem' (ms), als de leverancier dat zelf aangeeft; anders null. */
  wachtNaRem?(antwoord: HttpAntwoord, nu: Date): number | null
  /**
   * Een verzoek direct na het koppelen (Polar: het lid registreren; WHOOP: het id ophalen), of null.
   * Een 2xx of 409 (al geregistreerd) telt als gelukt.
   */
  naKoppelen?(tokens: Tokens): HttpVerzoek | null
  /** Het id van het lid bij de leverancier uit het antwoord van naKoppelen (voor webhooks), of null. */
  externIdNaKoppelen?(json: unknown): string | null
  /** Toegang intrekken bij de leverancier, of null als de API dat niet kan. */
  intrekVerzoek(tokens: Tokens, sleutels: ClientSleutels): HttpVerzoek | null
}

/** Formulier-body (x-www-form-urlencoded). */
export function formulier(velden: Readonly<Record<string, string>>): string {
  return new URLSearchParams(velden).toString()
}

export const FORM_KOP = { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' } as const

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function alsRecord(v: unknown): Record<string, unknown> | null {
  return isRecord(v) ? v : null
}

export function tekstOfNull(v: unknown): string | null {
  if (typeof v === 'string' && v.length > 0) return v
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return null
}

export function getalOfNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/** Standaard: 401 = token weg, 429 = te veel verzoeken, 2xx = goed. */
export function beoordeelHttp(a: HttpAntwoord): Beoordeling {
  if (a.status === 401) return 'token_ongeldig'
  if (a.status === 429) return 'rem'
  if (a.status >= 200 && a.status < 300) return 'ok'
  return 'fout'
}

/** "PT1H2M3S" (ISO 8601) naar seconden, of null. */
export function isoDuurSec(v: unknown): number | null {
  if (typeof v !== 'string') return null
  const m = /^PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(v)
  if (!m || v === 'PT') return null
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)
}

/** Basic-authenticatie met client id en secret. */
export function basicKop(clientId: string, secret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${secret}`, 'utf8').toString('base64')}`
}

/** JJJJ-MM-DD (UTC) van een moment. */
export function datumUtc(d: Date): string {
  return d.toISOString().slice(0, 10)
}
