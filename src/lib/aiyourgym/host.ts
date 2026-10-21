// ─── AI Your Gym: de verkoopwebsite op aiyourgym.com (PUUR) ─────────────────
// Puur en zonder Next of env, zodat het te testen is; src/proxy.ts voert het uit.
//
//  aiyourgym.com en www.aiyourgym.com (schakelaar AIYOURGYM_SITE_ACTIEF aan)
//    /api/aiyourgym/...  door (aanmelden, beschikbaarheid, Stripe-webhook)
//    /aiyourgym/...      door (bestaande links blijven werken)
//    /favicon.ico, /robots.txt, /sitemap.xml  door
//    /...                herschrijven naar /aiyourgym/... (ook andere /api/: die bestaan daar niet)
//  <slug>.aiyourgym.com: niet van de website, dat is Club (src/lib/club/kern/subdomein.ts)
//  elk ander domein: niet van de website
//
// Lokaal: aiyourgym.localhost:3000. Schakelaar uit: alles is "niet van mij".

export const AYG_PREFIX = '/aiyourgym'
export const AYG_API = '/api/aiyourgym'

const AYG_HOSTS: ReadonlySet<string> = new Set(['aiyourgym.com', 'www.aiyourgym.com', 'aiyourgym.localhost', 'www.aiyourgym.localhost'])
const ALTIJD_DOOR: ReadonlySet<string> = new Set(['/favicon.ico', '/robots.txt', '/sitemap.xml'])

function schoon(host: string | null | undefined): string {
  return (host ?? '').split(':')[0].trim().toLowerCase()
}

/** Is dit de host van de verkoopwebsite (niet een subdomein van een sportschool)? */
export function isAygHost(host: string | null | undefined): boolean {
  return AYG_HOSTS.has(schoon(host))
}

export type AygBeslissing = { soort: 'niet-van-mij' } | { soort: 'door' } | { soort: 'herschrijven'; pad: string }

export function beslisAyg(host: string | null | undefined, pad: string, actief: boolean): AygBeslissing {
  if (!actief || !isAygHost(host)) return { soort: 'niet-van-mij' }
  if (pad === AYG_API || pad.startsWith(`${AYG_API}/`)) return { soort: 'door' }
  if (pad === AYG_PREFIX || pad.startsWith(`${AYG_PREFIX}/`)) return { soort: 'door' }
  if (ALTIJD_DOOR.has(pad)) return { soort: 'door' }
  return { soort: 'herschrijven', pad: pad === '/' ? AYG_PREFIX : `${AYG_PREFIX}${pad}` }
}

/**
 * Het pad van een pagina van de website zoals de bezoeker hem ziet: op
 * aiyourgym.com zonder voorvoegsel, elders (fitfactorypt.nl, schakelaar uit) met.
 */
export function zichtbaarPad(host: string | null | undefined, pad: string, actief: boolean): string {
  const zonder = pad.startsWith(`${AYG_PREFIX}/`) ? pad.slice(AYG_PREFIX.length) : pad === AYG_PREFIX ? '/' : pad
  return actief && isAygHost(host) ? zonder : `${AYG_PREFIX}${zonder === '/' ? '' : zonder}`
}

/**
 * Is dit adres van AI Your Gym nog dicht? Zolang de schakelaars uit staan mag er
 * op aiyourgym.com en zijn subdomeinen niets van de app verschijnen (ook niet de
 * Fit Factory-app): dan een kale 404. De website gaat open met
 * AIYOURGYM_SITE_ACTIEF, de subdomeinen van sportscholen met CLUB_SUBDOMEINEN_ACTIEF.
 */
export function aygDomeinDicht(host: string | null | undefined, siteAan: boolean, subdomeinenAan: boolean): boolean {
  const h = schoon(host)
  const basis = h.endsWith('.localhost') ? 'aiyourgym.localhost' : 'aiyourgym.com'
  if (h === basis || h === `www.${basis}`) return !siteAan
  if (h.endsWith(`.${basis}`)) return !subdomeinenAan
  return false
}
