/**
 * Korte in-memory cache voor geverifieerde auth-tokens.
 *
 * WAAROM
 * Elke API-route roept `getAuthenticatedUser()` aan, en dat deed per request een
 * netwerk-round-trip naar Supabase GoTrue. Eén Home-load raakt ~7 routes → ~7
 * seriële auth-RTT's bovenop de echte queries. Deze cache maakt daar één
 * verificatie per token per TTL van.
 *
 * VEILIGHEIDSMODEL (lees dit voor je hier iets wijzigt)
 * Dit is een OPTIMALISATIE, nooit de bron van waarheid. De echte verificatie
 * blijft altijd de verifier (GoTrue). Twee invarianten houden dat overeind:
 *
 *  1. Alleen successen worden gecachet. Een `null` of een fout gaat nooit de
 *     cache in — anders wordt één netwerkstoring een uitlog-storm.
 *  2. Ongeverifieerde payload-data (de `exp` uit het token) gebruiken we
 *     UITSLUITEND om de cache-duur te verkorten, nooit om toegang te verlenen.
 *     Een aanvaller die een `exp` verzint kan daarmee dus hooguit z'n eigen
 *     cache-entry korter maken; binnenkomen doet hij er niet mee. Het token
 *     zelf moet altijd eerst door de verifier heen.
 *
 * SERVERLESS-REALITEIT
 * Elke instance heeft z'n eigen cache; bij een cold start is die leeg. Dat is
 * prima — een misser kost alleen de originele RTT.
 */
import { createHash } from 'node:crypto'

/**
 * Standaard cache-duur.
 *
 * TRADE-OFF, bewust gemaakt: een ingetrokken sessie (logout, ban, verwijderde
 * gebruiker) blijft maximaal deze TTL nog geldig op een instance die 'm al
 * gecachet had. Dat is de standaard prijs van token-caching.
 *
 * 30s i.p.v. 60s omdat de winst grotendeels uit de in-flight dedupe + de eerste
 * seconden komt: een paginanavigatie vuurt ~7 routes af binnen 1-2s, en die
 * collapsen sowieso al naar één verificatie. Langer cachen levert marginaal
 * meer hits maar verdubbelt het revocatie-venster — en bij auth wint veilig.
 */
export const TOKEN_CACHE_TTL_MS = 30_000

/**
 * Harde bovengrens op het aantal entries. Een ongelimiteerde Map op een
 * langlevend serverproces is een geheugenlek. Bij overschrijding ruimen we
 * eerst verlopen entries op; helpt dat niet, dan legen we de cache volledig
 * (zelfde simpele strategie als `isRateLimited`) — een lege cache kost
 * alleen snelheid, geen correctheid.
 */
const MAX_ENTRIES = 2_000

interface Entry<T> {
  waarde: T
  /** Absoluut moment (ms) waarop deze entry ongeldig wordt. */
  tot: number
}

export interface TokenCache<T> {
  /**
   * Geeft de geverifieerde waarde voor `token`, uit cache of via `verifieer`.
   * Gelijktijdige aanroepen met hetzelfde token delen één verificatie.
   */
  haal(
    token: string,
    verifieer: (token: string) => Promise<T | null>,
    nu?: number,
  ): Promise<T | null>
  /** Aantal entries in de cache. Voor tests en diagnose. */
  omvang(): number
}

/**
 * Hasht het token tot een cache-sleutel. We bewaren nooit ruwe JWT's in een
 * langlevende map — dat is onnodige blootstelling in heap-dumps.
 */
function tokenSleutel(token: string): string {
  return createHash('sha256').update(token).digest('base64url')
}

/**
 * Leest de `exp` (in ms) uit de JWT-payload, of null als die niet leesbaar is.
 *
 * Puur decoderen, GEEN verificatie — de handtekening controleren blijft aan de
 * verifier. De uitkomst wordt alleen gebruikt om de cache-duur te begrenzen.
 */
function leesExpMs(token: string): number | null {
  const delen = token.split('.')
  if (delen.length !== 3) return null

  const payload = delen[1]
  if (!payload) return null

  try {
    const data: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof data !== 'object' || data === null) return null

    const exp = (data as Record<string, unknown>).exp
    if (typeof exp !== 'number' || !Number.isFinite(exp)) return null
    return exp * 1000 // JWT `exp` is in seconden
  } catch {
    return null
  }
}

/**
 * Maakt een geïsoleerde token-cache. Eén instance per verifier volstaat;
 * tests maken hun eigen instance zodat er geen gedeelde state lekt.
 */
export function maakTokenCache<T>(
  ttlMs: number = TOKEN_CACHE_TTL_MS,
  maxEntries: number = MAX_ENTRIES,
): TokenCache<T> {
  const cache = new Map<string, Entry<T>>()
  const lopend = new Map<string, Promise<T | null>>()

  function ruimOp(nu: number): void {
    for (const [sleutel, entry] of cache) {
      if (entry.tot <= nu) cache.delete(sleutel)
    }
    if (cache.size >= maxEntries) cache.clear()
  }

  function bewaar(sleutel: string, waarde: T, token: string, nu: number): void {
    const expMs = leesExpMs(token)
    // Geen leesbare exp → niet cachen. We kunnen de entry dan niet tegen de
    // echte houdbaarheid van het token begrenzen, en dan cachen we liever niet.
    if (expMs === null) return

    // Nooit voorbij exp cachen: een verlopen token mag nooit uit de cache
    // alsnog geldig terugkomen.
    const tot = Math.min(nu + ttlMs, expMs)
    if (tot <= nu) return

    if (cache.size >= maxEntries) ruimOp(nu)
    cache.set(sleutel, { waarde, tot })
  }

  async function haal(
    token: string,
    verifieer: (token: string) => Promise<T | null>,
    nu: number = Date.now(),
  ): Promise<T | null> {
    const sleutel = tokenSleutel(token)

    const bestaand = cache.get(sleutel)
    if (bestaand) {
      if (bestaand.tot > nu) return bestaand.waarde
      cache.delete(sleutel)
    }

    // In-flight dedupe: twee gelijktijdige requests met hetzelfde token delen
    // één verificatie in plaats van er twee af te vuren.
    const inFlight = lopend.get(sleutel)
    if (inFlight) return inFlight

    const belofte = verifieer(token)
      .then((waarde) => {
        // Alleen successen cachen — zie invariant 1 bovenaan.
        if (waarde !== null) bewaar(sleutel, waarde, token, nu)
        return waarde
      })
      .finally(() => {
        lopend.delete(sleutel)
      })

    lopend.set(sleutel, belofte)
    return belofte
  }

  return {
    haal,
    omvang: () => cache.size,
  }
}
