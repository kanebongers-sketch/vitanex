// ─── AI Your Gym: de verkoopwebsite op aiyourgym.com (PUUR) ─────────────────
// Puur en zonder Next of env, zodat het te testen is; src/proxy.ts voert het uit.
//
//  aiyourgym.com en www.aiyourgym.com (schakelaar AIYOURGYM_SITE_ACTIEF aan)
//    /api/aiyourgym/...  door (aanmelden, beschikbaarheid, Stripe-webhook)
//    /aiyourgym/...      308 naar hetzelfde pad zonder /aiyourgym (besluit Kane 30-10-2026:
//                        schone adressen), zodat oude links blijven werken. Uitgezonderd:
//                        bestanden en de beelden van Next (icon, opengraph-image): door
//    /club, /clubinloggen, /mijn, /club-app, /api/club..., /api/widget  door (Club)
//    /<slug>/...         de omgeving van een sportschool (src/lib/club/kern/pad-adres.ts,
//                        stap in de proxy voor deze); een onbekende slug komt hier en wordt een 404
//    /favicon.ico, /robots.txt  door (er is geen sitemap: /sitemap.xml gaat
//                        naar /aiyourgym/sitemap.xml en wordt een 404 van de site)
//    /en, /en/...        oude Engelse links: 308 naar hetzelfde pad zonder /en (en zonder
//    /aiyourgym/en/...   /aiyourgym), met de cookie ayg-taal=en (src/lib/aiyourgym/taal/pad.ts)
//    /...                herschrijven naar /aiyourgym/... (ook andere /api/: die bestaan daar niet).
//                        Een herschrijving gaat niet opnieuw door de proxy: geen lus.
//  Elke websitepagina krijgt `publiek` mee: het publieke pad (de proxy zet dat
//  als kop voor de canonical). De taal komt uit de cookie, niet uit het pad
//  (besluit Kane 24-10-2026, docs/aiyourgym/TALEN.md).
//  <slug>.aiyourgym.com: niet van de website, dat is Club (src/lib/club/kern/subdomein.ts)
//  elk ander domein: niet van de website; met de site aan is /aiyourgym/... daar een
//  404 (beslisAygElders): de website staat alleen op aiyourgym.com (besluit Kane 21-10-2026)
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
  /** Een oud adres met /aiyourgym ervoor: 308 naar het schone `pad`. */
  | { soort: 'omleiden'; pad: string }

/** Hoort dit pad onder /aiyourgym (de map van de website in de app)? */
function onderPrefix(pad: string): boolean {
  return pad === AYG_PREFIX || pad.startsWith(`${AYG_PREFIX}/`)
}

/** Het schone pad zonder (een of meer) /aiyourgym ervoor: '/aiyourgym/prijzen' wordt '/prijzen'. */
export function zonderPrefix(pad: string): string {
  let rest = pad
  while (onderPrefix(rest)) rest = rest.slice(AYG_PREFIX.length)
  return rest === '' ? '/' : rest
}

// Beelden die Next zelf bij de metadata maakt (og:image, icoon): die verwijzen naar
// /aiyourgym/..., en een crawler hoort daar geen omleiding te krijgen.
const NEXT_BEELDEN: readonly string[] = ['opengraph-image', 'twitter-image', 'icon', 'apple-icon']

/** Een bestand (laatste deel met een punt) of een beeld van Next: die gaan door zoals ze zijn. */
function isBestandOfBeeld(pad: string): boolean {
  const laatste = pad.split('/').pop() ?? ''
  if (laatste.includes('.')) return true
  const eerste = pad.slice(AYG_PREFIX.length).split('/')[1] ?? ''
  return NEXT_BEELDEN.some((b) => eerste === b || eerste.startsWith(`${b}-`))
}

export function beslisAyg(host: string | null | undefined, pad: string, actief: boolean): AygBeslissing {
  if (!actief || !isAygHost(host)) return { soort: 'niet-van-mij' }
  if (pad === AYG_API || pad.startsWith(`${AYG_API}/`)) return { soort: 'door' }
  if (ALTIJD_DOOR.has(pad)) return { soort: 'door' }
  if (isClubPad(pad)) return { soort: 'door' }
  const zonderEn = oudEngelsPad(pad)
  if (zonderEn !== null) return { soort: 'engels-omleiden', pad: zonderPrefix(zonderEn) }
  // Onder /aiyourgym: een oud adres, met een 308 naar het schone adres (zoekstring gaat mee in de proxy).
  if (onderPrefix(pad)) return isBestandOfBeeld(pad) ? { soort: 'door' } : { soort: 'omleiden', pad: zonderPrefix(pad) }
  return { soort: 'herschrijven', pad: pad === '/' ? AYG_PREFIX : `${AYG_PREFIX}${pad}`, publiek: pad }
}

/**
 * De website op een ander domein dan aiyourgym.com (fitfactorypt.nl, localhost).
 * Met de site aan staat de website alleen op aiyourgym.com: een pagina onder
 * /aiyourgym is hier dan een 404 (geen link of omleiding tussen de apps).
 * Bestanden en beelden van Next gaan door. Met de site uit blijft /aiyourgym
 * hier de voorvertoning voor Kane (de layout eist het master account).
 */
export function beslisAygElders(host: string | null | undefined, pad: string, actief: boolean): 'verbergen' | null {
  if (!actief || isAygHost(host) || !onderPrefix(pad)) return null
  return isBestandOfBeeld(pad) ? null : 'verbergen'
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
 * Het volle adres voor een 308 van een oud adres (Engels of met /aiyourgym), op dezelfde host (de
 * zoekstring gaat mee). Lokaal (*.localhost) http, anders https: achter Render
 * is request.url niet altijd het publieke adres.
 */
export function omleidUrl(host: string | null | undefined, pad: string, zoek: string): string {
  const h = (host ?? '').trim().toLowerCase()
  const naam = h.split(':')[0]
  const lokaal = naam === 'localhost' || naam.endsWith('.localhost')
  return `${lokaal ? 'http' : 'https'}://${h}${pad}${zoek}`
}

/** Zelfde als omleidUrl (de oude naam, voor de Engelse adressen). */
export const engelsOmleidUrl = omleidUrl

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
