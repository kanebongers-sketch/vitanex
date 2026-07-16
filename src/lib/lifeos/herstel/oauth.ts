// ─── LifeOS — OAuth2 token-uitwisseling ────────────────────────────────────
// Code → token, en refresh → nieuw token. Alleen server-side: dit bestand raakt
// het client-secret aan en mag nooit in een bundle voor de browser belanden.
//
// Beide diensten praten standaard OAuth2 (RFC 6749): een POST met
// `application/x-www-form-urlencoded`. Geen JSON-body — dat is een veelgemaakte
// aanname die bij een strikte autorisatieserver een 400 oplevert.

import type { DienstConfig } from './diensten'
import { getal, isObject, lijst, tekst } from './narrow'

/**
 * Een fout in de koppeling, veilig om aan de gebruiker te tonen.
 *
 * `reden` is bewust kort en zonder leverancier-payload: een token-endpoint
 * echoot bij een fout soms het request terug, inclusief het client-secret. Dat
 * mag nooit in een log of een HTTP-response belanden.
 */
export class KoppelFout extends Error {
  readonly dienst: string

  constructor(dienst: string, reden: string) {
    super(reden)
    this.name = 'KoppelFout'
    this.dienst = dienst
  }
}

export interface TokenAntwoord {
  toegangstoken: string
  /** Null als de dienst er geen gaf — dan is de koppeling eindig. */
  verversingstoken: string | null
  /** ISO-tijdstip waarop het toegangstoken verloopt, of null als onbekend. */
  verlooptOp: string | null
  bereik: string[]
}

/** Wissel de autorisatiecode in voor tokens. */
export async function wisselCodeIn(
  config: DienstConfig,
  code: string,
): Promise<TokenAntwoord> {
  return tokenRequest(config, {
    grant_type: 'authorization_code',
    code,
    // redirect_uri moet exact gelijk zijn aan die uit het autorisatie-request;
    // de autorisatieserver controleert dat (RFC 6749 §4.1.3).
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  })
}

/** Haal een nieuw toegangstoken op met het verversingstoken. */
export async function ververs(
  config: DienstConfig,
  verversingstoken: string,
): Promise<TokenAntwoord> {
  const body: Record<string, string> = {
    grant_type: 'refresh_token',
    refresh_token: verversingstoken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  }
  if (config.verversBereik !== null) body.scope = config.verversBereik

  return tokenRequest(config, body)
}

async function tokenRequest(
  config: DienstConfig,
  body: Record<string, string>,
): Promise<TokenAntwoord> {
  let res: Response
  try {
    res = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
      },
      body: new URLSearchParams(body).toString(),
      // Een token-endpoint dat blijft hangen mag de sync niet laten hangen.
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    })
  } catch (fout) {
    // Netwerkfout ≠ "geen data". Hij gaat als fout naar boven, niet als leegte.
    const reden = fout instanceof Error && fout.name === 'TimeoutError'
      ? 'de dienst reageerde niet op tijd'
      : 'de dienst was niet bereikbaar'
    throw new KoppelFout(config.dienst, reden)
  }

  if (!res.ok) {
    // Bewust NIET de responsbody meesturen: die kan ons eigen client-secret
    // bevatten (sommige servers echoën het request terug bij een 400).
    throw new KoppelFout(
      config.dienst,
      res.status === 400 || res.status === 401
        ? 'de koppeling is geweigerd — opnieuw koppelen'
        : `de dienst gaf een fout (${res.status})`,
    )
  }

  const ruw: unknown = await res.json().catch(() => null)
  return leesTokenAntwoord(config.dienst, ruw)
}

/**
 * Narrow het tokenantwoord. Puur en apart getest: dit is de systeemgrens waar
 * een leverancier-wijziging zichtbaar moet worden als een duidelijke fout, niet
 * als een `undefined` die later pas ontploft.
 */
export function leesTokenAntwoord(dienst: string, ruw: unknown): TokenAntwoord {
  if (!isObject(ruw)) throw new KoppelFout(dienst, 'onleesbaar antwoord van de dienst')

  const toegangstoken = tekst(ruw.access_token)
  if (toegangstoken === null) {
    throw new KoppelFout(dienst, 'de dienst gaf geen toegangstoken terug')
  }

  const seconden = getal(ruw.expires_in)
  const verlooptOp = seconden === null
    ? null
    : new Date(Date.now() + seconden * 1000).toISOString()

  return {
    toegangstoken,
    verversingstoken: tekst(ruw.refresh_token),
    verlooptOp,
    bereik: leesBereik(ruw.scope),
  }
}

/** `scope` is per RFC een spatie-gescheiden string; sommige diensten sturen een array. */
function leesBereik(v: unknown): string[] {
  const s = tekst(v)
  if (s !== null) return s.split(/\s+/).filter((x) => x.length > 0)
  return lijst(v)
    .map((x) => tekst(x))
    .filter((x): x is string => x !== null)
}
