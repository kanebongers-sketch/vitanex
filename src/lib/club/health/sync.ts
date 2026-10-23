// ─── Club, health: de sync-engine (PUUR, met ingespoten opslag en http) ─────
// Per koppeling, steeds vanaf de cursor van de vorige keer:
//   1. tokens ontsleutelen; verlopen ze binnen 5 minuten, eerst verversen;
//   2. pagina voor pagina ophalen bij de leverancier (hooguit MAX_PAGINAS);
//   3. alleen de soorten waarvoor het lid toestemming gaf, en alleen geldige
//      metingen, gaan de database in (upsert op lid, bron en extern id: twee keer
//      hetzelfde ophalen geeft geen dubbele rijen);
//   4. de cursor schuift pas op als de hele ronde lukte;
//   5. remt de leverancier (429 of eigen code), dan wachten we (Retry-After, de
//      eigen regel van de leverancier, of oplopend: 15 min, 30 min, ... tot 24 uur).
// Netwerk en database zitten achter interfaces: de tests draaien met nep-versies.

import type { ClientSleutels, HealthAdapter, HttpAntwoord, HttpVerzoek, Tokens, TokenAanvraag } from './adapter'
import { schoneMetingen } from './metingen'
import { filterOpDelen, heeftToestemmingVoor, type Toestemming } from './toestemming'
import { PROVIDERS } from './providers'
import { ontsleutelTokens, versleutelTokens } from './versleutelen'
import type { BronId, Meting } from './typen'

export const MAX_PAGINAS = 20
const VERVERS_MARGE_MS = 5 * 60_000
const BASIS_WACHT_MS = 15 * 60_000
const MAX_WACHT_MS = 24 * 3600_000
/** Zonder webhook: zo vaak kijken we vanzelf (de cron draait vaker, dit is de ondergrens). */
export const STANDAARD_INTERVAL_MS = 6 * 3600_000

export type KoppelingStatus = 'actief' | 'fout' | 'opnieuw_koppelen' | 'ingetrokken'

export interface Koppeling {
  id: string
  userId: string
  lidId: string
  bron: BronId
  status: KoppelingStatus
  tokensVersleuteld: string | null
  cursor: string | null
  foutPogingen: number
}

export interface KoppelingWijziging {
  status?: KoppelingStatus
  tokensVersleuteld?: string | null
  tokenVerlooptOp?: string | null
  externGebruikerId?: string | null
  scope?: string | null
  cursor?: string | null
  laatsteSyncOp?: string
  volgendeSyncOp?: string
  foutPogingen?: number
  laatsteFout?: string | null
}

export interface SyncLogRegel {
  userId: string
  koppelingId: string
  bron: BronId
  gestartOp: string
  klaarOp: string
  status: SyncStatus
  nieuw: number
  foutCode: string | null
}

export interface SyncOpslag {
  /** De geldende toestemming, of null bij een leesfout. */
  haalToestemming(userId: string, lidId: string): Promise<Toestemming | null>
  /** Upsert zonder dubbelen. Het aantal verwerkte rijen, of null bij een fout. */
  bewaarMetingen(userId: string, lidId: string, metingen: readonly Meting[]): Promise<number | null>
  werkKoppelingBij(k: Koppeling, wijziging: KoppelingWijziging): Promise<boolean>
  logSync(regel: SyncLogRegel): Promise<void>
}

export type Http = (v: HttpVerzoek) => Promise<HttpAntwoord>

export interface SyncContext {
  adapter: HealthAdapter
  sleutels: ClientSleutels
  hoofdsleutel: Uint8Array
  opslag: SyncOpslag
  http: Http
  nu: Date
}

export type SyncStatus = 'ok' | 'rem' | 'fout' | 'opnieuw_koppelen' | 'geen_toestemming'

export interface SyncUitslag {
  status: SyncStatus
  nieuw: number
}

/** Hoe lang wachten na de n-de mislukte poging (1, 2, 3, ...). */
export function wachtTijd(pogingen: number, retryAfterSec: number | null): number {
  if (retryAfterSec !== null && Number.isFinite(retryAfterSec) && retryAfterSec > 0) return Math.min(retryAfterSec * 1000, MAX_WACHT_MS)
  return Math.min(BASIS_WACHT_MS * 2 ** Math.max(0, pogingen - 1), MAX_WACHT_MS)
}

export function retryAfter(a: HttpAntwoord): number | null {
  const v = a.headers['retry-after']
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function rijVan(k: Koppeling): { userId: string; lidId: string; bron: string } {
  return { userId: k.userId, lidId: k.lidId, bron: k.bron }
}

export function tokensNaarTekst(t: Tokens): string {
  return JSON.stringify(t)
}

export function tokensUitTekst(tekst: string | null): Tokens | null {
  if (!tekst) return null
  try {
    const r = JSON.parse(tekst) as Record<string, unknown>
    if (typeof r.accessToken !== 'string') return null
    const s = (v: unknown): string | null => (typeof v === 'string' ? v : null)
    return { accessToken: r.accessToken, refreshToken: s(r.refreshToken), verlooptOp: s(r.verlooptOp), externGebruikerId: s(r.externGebruikerId), scope: s(r.scope) }
  } catch {
    return null
  }
}

/** Een tokenverzoek uitvoeren (code inwisselen of verversen). Logt nooit een token. */
export async function vraagTokens(ctx: Pick<SyncContext, 'adapter' | 'sleutels' | 'http' | 'nu'>, aanvraag: TokenAanvraag, vorige?: Tokens): Promise<Tokens | null> {
  try {
    const antwoord = await ctx.http(ctx.adapter.tokenVerzoek(ctx.sleutels, aanvraag))
    if (ctx.adapter.beoordeel(antwoord) !== 'ok') return null
    return ctx.adapter.leesTokens(antwoord.json, ctx.nu, vorige)
  } catch {
    return null
  }
}

/** De versleutelde tokens en hun velden voor de koppeling. */
export function tokenVelden(t: Tokens, k: Pick<Koppeling, 'userId' | 'lidId' | 'bron'>, hoofdsleutel: Uint8Array): KoppelingWijziging {
  return {
    tokensVersleuteld: versleutelTokens(tokensNaarTekst(t), hoofdsleutel, { userId: k.userId, lidId: k.lidId, bron: k.bron }),
    tokenVerlooptOp: t.verlooptOp,
    externGebruikerId: t.externGebruikerId,
    scope: t.scope,
  }
}

async function geldigeTokens(ctx: SyncContext, k: Koppeling): Promise<Tokens | null> {
  const tokens = tokensUitTekst(k.tokensVersleuteld ? ontsleutelTokens(k.tokensVersleuteld, ctx.hoofdsleutel, rijVan(k)) : null)
  if (!tokens) return null
  const verloopt = tokens.verlooptOp ? Date.parse(tokens.verlooptOp) : Number.POSITIVE_INFINITY
  if (verloopt - VERVERS_MARGE_MS > ctx.nu.getTime()) return tokens
  return verversEnBewaar(ctx, k, tokens)
}

async function verversEnBewaar(ctx: SyncContext, k: Koppeling, tokens: Tokens): Promise<Tokens | null> {
  if (!tokens.refreshToken) return null
  const nieuw = await vraagTokens(ctx, { soort: 'verversen', refreshToken: tokens.refreshToken }, tokens)
  if (!nieuw) return null
  await ctx.opslag.werkKoppelingBij(k, tokenVelden(nieuw, k, ctx.hoofdsleutel))
  return nieuw
}

type RondeUitslag = { soort: 'klaar'; metingen: Meting[]; cursor: string | null; compleet: boolean } | { soort: 'rem'; wachtMs: number } | { soort: 'token' } | { soort: 'fout'; code: string }

async function haalRonde(ctx: SyncContext, k: Koppeling, start: Tokens): Promise<RondeUitslag> {
  let tokens = start
  let pagina: string | null = null
  let cursor: string | null = null
  let opnieuwGeprobeerd = false
  const metingen: Meting[] = []
  for (let i = 0; i < MAX_PAGINAS; i++) {
    let antwoord: HttpAntwoord
    try {
      antwoord = await ctx.http(ctx.adapter.dataVerzoek(tokens, k.cursor, pagina, ctx.nu))
    } catch {
      return { soort: 'fout', code: 'netwerk' }
    }
    const oordeel = ctx.adapter.beoordeel(antwoord)
    if (oordeel === 'rem') return { soort: 'rem', wachtMs: ctx.adapter.wachtNaRem?.(antwoord, ctx.nu) ?? wachtTijd(k.foutPogingen + 1, retryAfter(antwoord)) }
    if (oordeel === 'token_ongeldig') {
      const ververst = opnieuwGeprobeerd ? null : await verversEnBewaar(ctx, k, tokens)
      if (!ververst) return { soort: 'token' }
      tokens = ververst
      opnieuwGeprobeerd = true
      i--
      continue
    }
    if (oordeel === 'fout') return { soort: 'fout', code: `http_${antwoord.status}` }
    const gelezen = ctx.adapter.leesData(antwoord.json, ctx.nu, pagina)
    if (!gelezen) return { soort: 'fout', code: 'antwoord' }
    metingen.push(...gelezen.metingen)
    cursor = gelezen.nieuweCursor ?? cursor
    if (!gelezen.volgendePagina) return { soort: 'klaar', metingen, cursor, compleet: true }
    pagina = gelezen.volgendePagina
  }
  return { soort: 'klaar', metingen, cursor, compleet: false }
}

async function sluitAf(ctx: SyncContext, k: Koppeling, gestart: string, uitslag: SyncUitslag, wijziging: KoppelingWijziging, foutCode: string | null): Promise<SyncUitslag> {
  await ctx.opslag.werkKoppelingBij(k, { ...wijziging, laatsteSyncOp: ctx.nu.toISOString() })
  await ctx.opslag.logSync({ userId: k.userId, koppelingId: k.id, bron: k.bron, gestartOp: gestart, klaarOp: new Date().toISOString(), status: uitslag.status, nieuw: uitslag.nieuw, foutCode })
  return uitslag
}

function volgende(nu: Date, ms: number): string {
  return new Date(nu.getTime() + ms).toISOString()
}

/** Een ronde voor een koppeling. Gooit nooit; de uitkomst staat in het log. */
export async function synchroniseer(ctx: SyncContext, k: Koppeling): Promise<SyncUitslag> {
  const gestart = ctx.nu.toISOString()
  if (k.status !== 'actief' && k.status !== 'fout') return { status: 'opnieuw_koppelen', nieuw: 0 }
  const toestemming = await ctx.opslag.haalToestemming(k.userId, k.lidId)
  if (!toestemming) return sluitAf(ctx, k, gestart, { status: 'fout', nieuw: 0 }, { volgendeSyncOp: volgende(ctx.nu, BASIS_WACHT_MS) }, 'toestemming_lezen')
  // Geen toestemming voor iets wat deze bron levert: niets ophalen.
  if (!heeftToestemmingVoor(toestemming, PROVIDERS[k.bron].soorten)) {
    return sluitAf(ctx, k, gestart, { status: 'geen_toestemming', nieuw: 0 }, { volgendeSyncOp: volgende(ctx.nu, STANDAARD_INTERVAL_MS) }, null)
  }
  const tokens = await geldigeTokens(ctx, k)
  if (!tokens) return sluitAf(ctx, k, gestart, { status: 'opnieuw_koppelen', nieuw: 0 }, { status: 'opnieuw_koppelen', laatsteFout: 'token' }, 'token')

  const ronde = await haalRonde(ctx, k, tokens)
  if (ronde.soort === 'token') return sluitAf(ctx, k, gestart, { status: 'opnieuw_koppelen', nieuw: 0 }, { status: 'opnieuw_koppelen', laatsteFout: 'token' }, 'token')
  if (ronde.soort === 'rem' || ronde.soort === 'fout') {
    const pogingen = k.foutPogingen + 1
    const wacht = ronde.soort === 'rem' ? ronde.wachtMs : wachtTijd(pogingen, null)
    const code = ronde.soort === 'rem' ? 'rem' : ronde.code
    return sluitAf(ctx, k, gestart, { status: ronde.soort, nieuw: 0 }, { status: 'fout', foutPogingen: pogingen, laatsteFout: code, volgendeSyncOp: volgende(ctx.nu, wacht) }, code)
  }

  const teBewaren = schoneMetingen(filterOpDelen(ronde.metingen, toestemming), ctx.nu)
  const nieuw = teBewaren.length > 0 ? await ctx.opslag.bewaarMetingen(k.userId, k.lidId, teBewaren) : 0
  if (nieuw === null) {
    const pogingen = k.foutPogingen + 1
    return sluitAf(ctx, k, gestart, { status: 'fout', nieuw: 0 }, { status: 'fout', foutPogingen: pogingen, laatsteFout: 'opslaan', volgendeSyncOp: volgende(ctx.nu, wachtTijd(pogingen, null)) }, 'opslaan')
  }
  const wijziging: KoppelingWijziging = {
    status: 'actief',
    foutPogingen: 0,
    laatsteFout: null,
    // Niet compleet (te veel pagina's): de cursor blijft staan en we gaan snel verder.
    volgendeSyncOp: volgende(ctx.nu, ronde.compleet ? STANDAARD_INTERVAL_MS : 60_000),
    ...(ronde.compleet && ronde.cursor ? { cursor: ronde.cursor } : {}),
  }
  return sluitAf(ctx, k, gestart, { status: 'ok', nieuw }, wijziging, null)
}

/**
 * Ontkoppelen: eerst bij de leverancier intrekken (als de API dat kan), dan
 * altijd de tokens wissen. Een mislukt intrekken houdt het wissen niet tegen.
 */
export async function trekIn(ctx: Pick<SyncContext, 'adapter' | 'sleutels' | 'hoofdsleutel' | 'http'>, k: Koppeling): Promise<{ bijLeverancier: 'ingetrokken' | 'niet_mogelijk' | 'mislukt' }> {
  const tokens = tokensUitTekst(k.tokensVersleuteld ? ontsleutelTokens(k.tokensVersleuteld, ctx.hoofdsleutel, rijVan(k)) : null)
  const verzoek = tokens ? ctx.adapter.intrekVerzoek(tokens, ctx.sleutels) : null
  if (!verzoek) return { bijLeverancier: 'niet_mogelijk' }
  try {
    const a = await ctx.http(verzoek)
    return { bijLeverancier: a.status >= 200 && a.status < 300 ? 'ingetrokken' : 'mislukt' }
  } catch {
    return { bijLeverancier: 'mislukt' }
  }
}
