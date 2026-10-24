// ─── AI Your Gym: de verkoopwebsite op aiyourgym.com (PUUR) ─────────────────
// Puur en zonder Next of env, zodat het te testen is; src/proxy.ts voert het uit.
//
//  aiyourgym.com en www.aiyourgym.com (schakelaar AIYOURGYM_SITE_ACTIEF aan)
//    /api/aiyourgym/...  door (aanmelden, beschikbaarheid, Stripe-webhook)
//    /aiyourgym/...      door (bestaande links blijven werken)
//    /club, /clubinloggen, /mijn, /club-app, /api/club..., /api/widget  door (Club)
//    /<slug>/...         de omgeving van een sportschool (src/lib/club/kern/pad-adres.ts,
//                        stap in de proxy voor deze); een onbekende slug komt hier en wordt een 404
//    /favicon.ico, /robots.txt  door (er is geen sitemap: /sitemap.xml gaat
//                        naar /aiyourgym/sitemap.xml en wordt een 404 van de site)
//    /en, /en/...        oude Engelse links: 308 naar hetzelfde pad zonder /en, met
//    /aiyourgym/en/...   de cookie ayg-taal=en (src/lib/aiyourgym/taal/pad.ts)
//    /...                herschrijven naar /aiyourgym/... (ook andere /api/: die bestaan daar niet)
//  Elke websitepagina krijgt `publiek` mee: het publieke pad (de proxy zet dat
//  als kop voor de canonical). De taal komt uit de cookie, niet uit het pad
//  (besluit Kane 24-10-2026, docs/aiyourgym/TALEN.md).
//  <slug>.aiyourgym.com: niet van de website, dat is Club (src/lib/club/kern/subdomein.ts)
//  elk ander domein: niet van de website
//
// Lokaal: aiyourgym.localhost:3000. Schakelaar uit: alles is "niet van mij".

import { oudEngelsPad } from './taal/pad'

export const AYG_PREFIX = '/aiyourgym'
export const AYG_API = '/api/aiyourgym'

const AYG_HOSTS: ReadonlySet<string> = new Set(['aiyourgym.com', 'www.aiyourgym.com', 'aiyourgym.localhost', 'www.aiyourgym.localhost'])
const ALTIJD_DOOR: ReadonlySet<string> = new Set(['/favicon.ico', '/robots.txt'])

// Club, ledenapp en inloggen staan op aiyourgym.com zelf (besluit Kane 21-10-2026):
// die paden gaan door naar hun eigen routes in src/app/(aiyourgym)/(club).
const CLUB_VOORVOEGSELS: readonly string[] = ['/club', '/clubinloggen', '/mijn', '/club-app', '/api/club', '/api/club-afmelden', '/api/widget']

function isClubPad(pad: string): boolean {
  return CLUB_VOORVOEGSELS.some((v) => pad === v || pad.startsWith(`${v}/`))
}

function schoon(host: string | null | undefined): string {
  return (host ?? '').split(':')[0].trim().toLowerCase()
}

/** Is dit de host van de verkoopwebsite (niet een subdomein van een sportschool)? */
export function isAygHost(host: string | null | undefined): boolean {
  return AYG_HOSTS.has(schoon(host))
}

export type AygBeslissing =
  | { soort: 'niet-van-mij' }
  | { soort: 'door'; publiek?: string }
  | { soort: 'herschrijven'; pad: string; publiek: string }
  /** Een oud Engels adres: 308 naar `pad` en de cookie ayg-taal=en. */
  | { soort: 'engels-omleiden'; pad: string }

export function beslisAyg(host: string | null | undefined, pad: string, actief: boolean): AygBeslissing {
  if (!actief || !isAygHost(host)) return { soort: 'niet-van-mij' }
  if (pad === AYG_API || pad.startsWith(`${AYG_API}/`)) return { soort: 'door' }
  if (ALTIJD_DOOR.has(pad)) return { soort: 'door' }
  if (isClubPad(pad)) return { soort: 'door' }
  const zonderEn = oudEngelsPad(pad)
  if (zonderEn !== null) return { soort: 'engels-omleiden', pad: zonderEn }
  // Onder /aiyourgym: precies zoals altijd door, met het publieke pad erbij.
  if (pad === AYG_PREFIX || pad.startsWith(`${AYG_PREFIX}/`)) return { soort: 'door', publiek: pad.slice(AYG_PREFIX.length) || '/' }
  return { soort: 'herschrijven', pad: pad === '/' ? AYG_PREFIX : `${AYG_PREFIX}${pad}`, publiek: pad }
}

/**
 * Een oud Engels websiteadres onder /aiyourgym/en op een ander domein dan
 * aiyourgym.com (fitfactorypt.nl/aiyourgym zolang de schakelaar uit staat):
 * het pad zonder /en voor de 308. null = niets te doen.
 */
export function beslisAygTaalElders(pad: string): { pad: string } | null {
  if (pad !== AYG_PREFIX && !pad.startsWith(`${AYG_PREFIX}/`)) return null
  const zonderEn = oudEngelsPad(pad)
  return zonderEn === null ? null : { pad: zonderEn }
}

/**
 * Het volle adres voor de 308 van een oud Engels adres, op dezelfde host (de
 * zoekstring gaat mee). Lokaal (*.localhost) http, anders https: achter Render
 * is request.url niet altijd het publieke adres.
 */
export function engelsOmleidUrl(host: string | null | undefined, pad: string, zoek: string): string {
  const h = (host ?? '').trim().toLowerCase()
  const naam = h.split(':')[0]
  const lokaal = naam === 'localhost' || naam.endsWith('.localhost')
  return `${lokaal ? 'http' : 'https'}://${h}${pad}${zoek}`
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
