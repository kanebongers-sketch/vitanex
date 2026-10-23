// ─── Club: het adres van een sportschool als pad (PUUR) ─────────────────────
// Besluit Kane (23-10-2026): subdomeinen per sportschool (naam.aiyourgym.com)
// komen pas bij de volledige livegang. Tot dan heeft elke sportschool een adres
// als pad: aiyourgym.com/<slug>, bijvoorbeeld aiyourgym.com/budel. Puur en
// zonder Next of env, zodat het te testen is; src/proxy.ts voert het uit.
//
//  aiyourgym.com/<slug>/<rest> (slug bestaat, niet gereserveerd)
//    rest zoals op het subdomein (clubDoelPad in subdomein.ts):
//      ''  en /          -> /club
//      /club..., /api/..., /clubinloggen/..., /mijn..., /club-app/...  -> zo
//      /inloggen         -> /aiyourgym/inloggen
//      /...              -> /club/...
//    met de kop SLUG_KOP (gezet door de proxy, nooit van de browser) en de
//    cookie ADRES_COOKIE, zodat de gewone links in Club (/club/...) en de
//    API-aanroepen (/api/club/...) bij dezelfde sportschool blijven.
//  Bestaande paden (/club, /mijn, /inloggen, /api/..., websitepagina's) gaan
//  voor: hun eerste deel is gereserveerd en kan nooit een slug zijn.
//  Onbekende slug: niet van Club, dan de 404 van de website.
//  Subdomeinen aan: 308 naar <slug>.aiyourgym.com/<rest>.
//
// Toegang (kiesOrganisatie): het pad (kop) is hard, een andere sportschool dan
// die van de sessie geeft een 404. De cookie is zacht: hij kiest alleen voor
// het master account welke sportschool open staat, en bij inloggen telt alleen
// een account van die sportschool. Een sessie van een eigenaar, clubmanager,
// medewerker of lid geldt altijd alleen voor de eigen sportschool.

import { CLUB_DOMEIN, CLUB_LOKAAL, clubDoelPad, leesSlug } from './subdomein'

/** De kop waarmee de proxy de slug uit het pad meegeeft. De proxy wist hem altijd eerst. */
export const SLUG_KOP = 'x-ayg-sportschool'
/** De cookie met de slug van de laatst geopende omgeving (httpOnly, gezet door de proxy). */
export const ADRES_COOKIE = 'ayg-adres'

export type PadBeslissing =
  | { soort: 'niet-van-mij' }
  | { soort: 'herschrijven'; slug: string; pad: string }
  | { soort: 'omleiden'; slug: string; rest: string }

/** Het eerste deel van het pad als slug, met de rest erachter; null als het geen (vrije) slug kan zijn. */
export function splitsSlugPad(pad: string): { slug: string; rest: string } | null {
  if (!pad.startsWith('/')) return null
  const eind = pad.indexOf('/', 1)
  const deel = eind === -1 ? pad.slice(1) : pad.slice(1, eind)
  // Precies zoals getypt: /Budel is geen slug (geen dubbele adressen).
  if (deel !== deel.toLowerCase()) return null
  const uitslag = leesSlug(deel)
  if (!uitslag.ok || uitslag.slug !== deel) return null
  return { slug: deel, rest: eind === -1 ? '' : pad.slice(eind) }
}

/**
 * Wat de proxy doet met een pad op de host van de website. `bestaat` zegt of
 * de slug van een sportschool is (de proxy leest dat uit de database).
 */
export function beslisClubPad(pad: string, subdomeinenAan: boolean, bestaat: (slug: string) => boolean): PadBeslissing {
  const gesplitst = splitsSlugPad(pad)
  if (!gesplitst || !bestaat(gesplitst.slug)) return { soort: 'niet-van-mij' }
  const { slug, rest } = gesplitst
  if (subdomeinenAan) return { soort: 'omleiden', slug, rest: rest === '' ? '/' : rest }
  return { soort: 'herschrijven', slug, pad: clubDoelPad(rest) ?? rest }
}

/** Het adres op het subdomein voor een oud pad-adres (alleen met subdomeinen aan). */
export function subdomeinUrl(slug: string, rest: string, zoek: string, host: string | null | undefined): string {
  const h = (host ?? '').trim().toLowerCase()
  const lokaal = h.split(':')[0].endsWith('.localhost')
  const poort = lokaal && h.includes(':') ? `:${h.split(':')[1]}` : ''
  const basis = lokaal ? `http://${slug}.${CLUB_LOKAAL}${poort}` : `https://${slug}.${CLUB_DOMEIN}`
  return `${basis}${rest}${zoek}`
}

/** De slug van een verzoek: hard (uit het pad of het subdomein) of zacht (uit de cookie). */
export interface VerzoekAdres {
  slug: string
  vast: boolean
}

export interface AdresBron {
  /** De slug van het subdomein (alleen met subdomeinen aan), of null. */
  subdomein: string | null
  subdomeinenAan: boolean
  /** Is dit de host van de website (aiyourgym.com of lokaal)? Alleen daar telt het pad. */
  websiteHost: boolean
  kop: string | null | undefined
  cookie: string | null | undefined
}

function geldig(ruw: string | null | undefined): string | null {
  if (!ruw) return null
  const uitslag = leesSlug(ruw)
  return uitslag.ok && uitslag.slug === ruw ? uitslag.slug : null
}

/** Welke sportschool het adres van dit verzoek noemt, of null (gewoon aiyourgym.com/club). */
export function kiesAdres(bron: AdresBron): VerzoekAdres | null {
  if (bron.subdomeinenAan) return bron.subdomein ? { slug: bron.subdomein, vast: true } : null
  if (!bron.websiteHost) return null
  const kop = geldig(bron.kop)
  if (kop) return { slug: kop, vast: true }
  const cookie = geldig(bron.cookie)
  return cookie ? { slug: cookie, vast: false } : null
}

/**
 * Hoe streng het adres telt:
 *  vast      alleen het pad of subdomein (sessies van eigenaar, clubmanager, medewerker, lid)
 *  streng    pad en cookie, allebei verplicht passend (inloggen, inloglinks)
 *  voorkeur  het pad verplicht, de cookie als keuze (het master account)
 */
export type AdresRegel = 'vast' | 'streng' | 'voorkeur'

/**
 * De sportschool die bij het adres hoort, uit de sportscholen die deze persoon
 * mag openen. undefined = het adres zegt niets (kies zoals altijd); null = het
 * adres hoort bij een andere sportschool (dan bestaat Club hier niet: 404).
 */
export function kiesOrganisatie<T extends { slug: string | null }>(organisaties: readonly T[], adres: VerzoekAdres | null, regel: AdresRegel): T | null | undefined {
  if (!adres || (!adres.vast && regel === 'vast')) return undefined
  const gevonden = organisaties.find((o) => o.slug === adres.slug)
  if (gevonden) return gevonden
  return adres.vast || regel === 'streng' ? null : undefined
}
