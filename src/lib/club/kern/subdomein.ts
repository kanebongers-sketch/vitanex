// ─── Club: subdomein per sportschool (PUUR) ─────────────────────────────────
// Elke sportschool krijgt een eigen adres: <slug>.aiyourgym.com, zoals
// <naam>.virtuagym.com (besluit Kane 17-10-2026). Puur en zonder Next of env,
// zodat het te testen is; src/proxy.ts voert het uit en src/lib/club/toegang.ts
// kiest op een subdomein de sportschool uit de slug.
//
//  <slug>.aiyourgym.com (schakelaar aan)
//    /clubkane/...   door (alle bestaande links blijven werken)
//    /api/...        door
//    /clubinloggen/  door (persoonlijke inloglink van een eigenaar of clubmanager)
//    /mijn, /mijn/   door (de ledenapp voor leden, src/app/(hoofd)/mijn)
//    /club-app/      door (service worker en iconen van de ledenapp)
//    /...            herschrijven naar /clubkane/...
//  www.aiyourgym.com, aiyourgym.com, gereserveerde namen: niet van Club (nog)
//  elk ander domein: niet van Club
//
// Lokaal: <slug>.club.localhost:3000 (werkt in Chrome en Firefox).
// Schakelaar uit: alles is "niet van Club", er verandert niets.

export const CLUB_DOMEIN = 'aiyourgym.com'
export const CLUB_LOKAAL = 'club.localhost'
export const CLUB_PREFIX = '/clubkane'

/** Een slug: kleine letters, cijfers en koppeltekens, 3 tot 40 tekens, niet beginnen of eindigen met een koppelteken. */
export const SLUG = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/

/** Namen die nooit een sportschool kunnen zijn (eigen diensten of verwarrend). */
export const GERESERVEERD: ReadonlySet<string> = new Set([
  'www', 'app', 'api', 'admin', 'beheer', 'mail', 'smtp', 'ftp', 'cdn', 'static', 'assets', 'status', 'help', 'support',
  'docs', 'blog', 'login', 'inloggen', 'account', 'auth', 'demo', 'test', 'dev', 'staging', 'club', 'aiyourgym', 'portaal',
])

export type SlugUitslag = { ok: true; slug: string } | { ok: false; fout: string }

export function leesSlug(ruw: unknown): SlugUitslag {
  const slug = typeof ruw === 'string' ? ruw.trim().toLowerCase() : ''
  if (!SLUG.test(slug)) return { ok: false, fout: 'Gebruik 3 tot 40 kleine letters, cijfers of koppeltekens (niet aan het begin of eind).' }
  if (slug.includes('--')) return { ok: false, fout: 'Gebruik geen twee koppeltekens achter elkaar.' }
  if (GERESERVEERD.has(slug)) return { ok: false, fout: 'Dit adres is gereserveerd. Kies een ander.' }
  return { ok: true, slug }
}

/** Een voorstel voor de slug uit de naam van de sportschool: "Fit Factory" wordt "fitfactory". */
export function slugVoorstel(naam: string): string {
  const basis = naam
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'en')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 40)
  return basis.length >= 3 ? basis : `${basis}club`.slice(0, 40)
}

function schoon(host: string | null | undefined): string {
  return (host ?? '').split(':')[0].trim().toLowerCase()
}

/** De slug uit de host, of null als dit geen subdomein van een sportschool is. */
export function slugUitHost(host: string | null | undefined): string | null {
  const h = schoon(host)
  for (const domein of [CLUB_DOMEIN, CLUB_LOKAAL]) {
    if (!h.endsWith(`.${domein}`)) continue
    const deel = h.slice(0, -(domein.length + 1))
    if (deel.includes('.')) return null
    const uitslag = leesSlug(deel)
    return uitslag.ok ? uitslag.slug : null
  }
  return null
}

export function adresVan(slug: string): string {
  return `${slug}.${CLUB_DOMEIN}`
}

export type ClubBeslissing = { soort: 'niet-van-mij' } | { soort: 'door'; slug: string } | { soort: 'herschrijven'; slug: string; pad: string }

/** Wat de proxy doet met een verzoek. Met de schakelaar uit altijd "niet van Club". */
export function beslisClub(host: string | null | undefined, pad: string, actief: boolean): ClubBeslissing {
  if (!actief) return { soort: 'niet-van-mij' }
  const slug = slugUitHost(host)
  if (!slug) return { soort: 'niet-van-mij' }
  const door = pad === CLUB_PREFIX || pad.startsWith(`${CLUB_PREFIX}/`) || pad.startsWith('/api/') || pad.startsWith('/clubinloggen/')
    || pad === '/mijn' || pad.startsWith('/mijn/') || pad.startsWith('/club-app/')
  if (door) return { soort: 'door', slug }
  return { soort: 'herschrijven', slug, pad: pad === '/' ? CLUB_PREFIX : `${CLUB_PREFIX}${pad}` }
}
