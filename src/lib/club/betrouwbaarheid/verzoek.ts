// ─── Foutregistratie: wat we uit een verzoek halen (PUUR) ───────────────────
// Uit de headers van een mislukt verzoek halen we alleen de sportschool: de
// slug van het subdomein (<slug>.aiyourgym.com) of het id uit de cookie
// club-org (welke sportschool Kane bekijkt). Niets anders: geen ip, geen
// user-agent, geen andere cookies en zeker geen sessietokens.

import { slugUitHost } from '@/lib/club/kern/subdomein'
import { ORGANISATIE_COOKIE, isUuid } from '@/lib/club/kern/organisatie'
import { maakFoutRegel, type FoutRegel, type FoutSoort } from './fout'

type Headers = Readonly<Record<string, string | string[] | undefined>>

function eerste(waarde: string | string[] | undefined): string | null {
  if (Array.isArray(waarde)) return waarde[0] ?? null
  return waarde ?? null
}

/** De waarde van een cookie uit een Cookie-header, of null. */
export function leesCookie(header: string | null, naam: string): string | null {
  if (!header) return null
  for (const deel of header.split(';')) {
    const [sleutel, ...rest] = deel.trim().split('=')
    if (sleutel === naam) return rest.join('=') || null
  }
  return null
}

/** Welke sportschool het was, als dat zonder persoonsgegevens te zien is. */
export function sportschoolUitHeaders(headers: Headers): string | null {
  const slug = slugUitHost(eerste(headers.host))
  if (slug) return slug
  const org = leesCookie(eerste(headers.cookie), ORGANISATIE_COOKIE)
  return isUuid(org) ? org : null
}

const SOORTEN: ReadonlySet<string> = new Set(['render', 'route', 'action', 'proxy'])

export interface VerzoekFout {
  path: string
  method: string
  headers: Headers
}

export interface VerzoekContext {
  routePath?: string
  routeType?: string
}

/**
 * De regel voor een fout uit onRequestError, of null als hij niet bij Club,
 * de ledenapp of AI Your Gym hoort. Het routepatroon (/clubkane/leden/[id])
 * gaat voor het echte pad; op een subdomein is het pad zonder /clubkane.
 */
export function regelUitVerzoek(fout: unknown, verzoek: VerzoekFout, context: VerzoekContext): FoutRegel | null {
  const patroon = context.routePath && context.routePath.startsWith('/') ? context.routePath : null
  const soort: FoutSoort = context.routeType && SOORTEN.has(context.routeType) ? (context.routeType as FoutSoort) : 'render'
  return maakFoutRegel({
    fout,
    route: patroon ?? verzoek.path,
    methode: verzoek.method,
    soort,
    sportschool: sportschoolUitHeaders(verzoek.headers),
  })
}
