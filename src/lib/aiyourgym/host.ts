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
//    /en, /en/...        Engels: herschrijven naar /aiyourgym/... met taal en (src/lib/aiyourgym/taal/pad.ts)
//    /aiyourgym/en/...   idem (de interne Engelse links)
//    /...                herschrijven naar /aiyourgym/... (ook andere /api/: die bestaan daar niet)
//  Elke websitepagina krijgt `site` mee: de taal en het publieke pad zonder taal
//  (de proxy zet die als kop voor <html lang> en hreflang).
//  <slug>.aiyourgym.com: niet van de website, dat is Club (src/lib/club/kern/subdomein.ts)
//  elk ander domein: niet van de website
//
// Lokaal: aiyourgym.localhost:3000. Schakelaar uit: alles is "niet van mij".

import { ontleedSitePad } from './taal/pad'
import type { Taal } from './taal/taal'

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

/** Bij een websitepagina: de taal en het publieke pad zonder taal ('/functies'). */
export interface SiteTaal {
  taal: Taal
  publiek: string
}

export type AygBeslissing =
  | { soort: 'niet-van-mij' }
  | { soort: 'door'; site?: SiteTaal }
  | { soort: 'herschrijven'; pad: string; site?: SiteTaal }

export function beslisAyg(host: string | null | undefined, pad: string, actief: boolean): AygBeslissing {
  if (!actief || !isAygHost(host)) return { soort: 'niet-van-mij' }
  if (pad === AYG_API || pad.startsWith(`${AYG_API}/`)) return { soort: 'door' }
  if (ALTIJD_DOOR.has(pad)) return { soort: 'door' }
  if (isClubPad(pad)) return { soort: 'door' }
  const site = ontleedSitePad(pad)
  if (site) {
    const taal: SiteTaal = { taal: site.taal, publiek: site.publiek }
    // Nederlands onder /aiyourgym: precies zoals altijd door, alleen met de taal erbij.
    if (site.taal === 'nl') return { soort: 'door', site: taal }
    return { soort: 'herschrijven', pad: site.route, site: taal }
  }
  return { soort: 'herschrijven', pad: pad === '/' ? AYG_PREFIX : `${AYG_PREFIX}${pad}`, site: { taal: 'nl', publiek: pad } }
}

/**
 * Een Engelse websitepagina onder /aiyourgym/en op een ander domein dan
 * aiyourgym.com (fitfactorypt.nl/aiyourgym zolang de schakelaar uit staat).
 * null = niets te doen (Nederlands of geen websitepad).
 */
export function beslisAygTaalElders(pad: string): { pad: string; site: SiteTaal } | null {
  if (pad !== AYG_PREFIX && !pad.startsWith(`${AYG_PREFIX}/`)) return null
  const site = ontleedSitePad(pad)
  if (!site || site.taal === 'nl') return null
  return { pad: site.route, site: { taal: site.taal, publiek: site.publiek } }
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
