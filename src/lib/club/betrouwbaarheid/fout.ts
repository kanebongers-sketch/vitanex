// ─── Foutregistratie: pure logica (geen database, geen Next) ────────────────
// Bepaalt of een serverfout bij Club, de ledenapp of AI Your Gym hoort, maakt
// er een korte, geschoonde melding van en een vaste fingerprint, zodat
// herhalingen van dezelfde fout optellen in plaats van de tabel te vullen.
//
// Hard: er gaat NOOIT een persoonsgegeven, token of body mee. De melding wordt
// geschoond (e-mail, uuid's, lange codes, cijfers, tekst tussen aanhalingstekens
// en waarden na "=") en ingekort. Een route bevat alleen het patroon
// (/club/leden/[id]) of een pad waarin id's en codes zijn vervangen.

import { createHash } from 'node:crypto'

export type FoutGebied = 'club' | 'leden' | 'aiyourgym'
export type FoutSoort = 'render' | 'route' | 'action' | 'proxy' | 'handmatig'

export const MAX_MELDING = 200
export const MAX_ROUTE = 160

/** De onderdelen die we registreren; de rest van de app (PT, LifeOS, webshop) niet. */
const GEBIEDEN: ReadonlyArray<{ prefix: string; gebied: FoutGebied }> = [
  // De ledenapp eerst: /api/club/lid valt anders onder /api/club.
  { prefix: '/api/club/lid', gebied: 'leden' },
  { prefix: '/mijn', gebied: 'leden' },
  { prefix: '/club', gebied: 'club' },
  { prefix: '/clubinloggen', gebied: 'club' },
  { prefix: '/api/club', gebied: 'club' },
  { prefix: '/aiyourgym', gebied: 'aiyourgym' },
  { prefix: '/api/aiyourgym', gebied: 'aiyourgym' },
]

function begintMet(pad: string, prefix: string): boolean {
  return pad === prefix || pad.startsWith(`${prefix}/`)
}

/** Het gebied van een route, of null als de fout niet bij Club of AI Your Gym hoort. */
export function gebiedVan(pad: string | null | undefined): FoutGebied | null {
  if (!pad) return null
  const schoon = pad.split(/[?#]/)[0]
  return GEBIEDEN.find((g) => begintMet(schoon, g.prefix))?.gebied ?? null
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
const UUID_DEEL = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL =/[^\s@'"()<>]+@[^\s@'"()<>]+\.[a-z]{2,}/gi
/** Codes en tokens: lange reeksen letters, cijfers, - en _ met minstens een cijfer. */
const CODE = /\b(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]{16,}\b/g

/**
 * Een pad zonder query en zonder id's of codes. Een routepatroon van Next
 * ([id], [code]) blijft zoals het is.
 */
export function schoonRoute(pad: string): string {
  const zonderQuery = pad.split(/[?#]/)[0] || '/'
  const delen = zonderQuery.split('/').map((deel) => {
    if (deel.startsWith('[') && deel.endsWith(']')) return deel
    if (UUID_DEEL.test(deel)) return ':id'
    if (/^\d+$/.test(deel)) return ':n'
    if (/^[A-Za-z0-9_-]{16,}$/.test(deel) && /\d/.test(deel)) return ':code'
    // Een inlogcode of afmeldtoken zonder cijfer (ongeveer 1 op 60) moet er ook uit.
    if (/^[A-Za-z0-9_-]{20,}$/.test(deel) && /[A-Z]/.test(deel)) return ':code'
    if (deel.includes('@')) return ':email'
    return deel
  })
  return delen.join('/').slice(0, MAX_ROUTE) || '/'
}

/** De melding van een fout, geschoond van alles wat naar een persoon of geheim kan wijzen. */
export function schoonMelding(ruw: string): string {
  const schoon = ruw
    .replace(EMAIL, '<email>')
    // Persoonlijke links en tokens in een pad: nooit meenemen, ook niet zonder cijfer.
    .replace(/\/(mijn\/start|clubinloggen(?:\/medewerker)?|inloggen(?:\/medewerker)?|club-afmelden)\/[A-Za-z0-9_-]+/g, '/$1/<code>')
    .replace(UUID, '<id>')
    .replace(CODE, '<code>')
    // Postgres: Key (email)=(jan@voorbeeld.nl) en "waarde=..." niet meenemen.
    .replace(/=\s*\([^)]*\)/g, '=(…)')
    .replace(/=\s*[^\s,;)]+/g, '=…')
    .replace(/"[^"]*"/g, '"…"')
    .replace(/'[^']*'/g, "'…'")
    .replace(/\d+/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
  if (!schoon) return 'Onbekende fout'
  return schoon.length > MAX_MELDING ? `${schoon.slice(0, MAX_MELDING - 1)}…` : schoon
}

/** Naam en melding uit wat er ook gegooid is (Error, tekst of iets anders). */
export function meldingVan(fout: unknown): string {
  if (fout instanceof Error) {
    const naam = fout.name && fout.name !== 'Error' ? `${fout.name}: ` : ''
    return schoonMelding(`${naam}${fout.message || 'zonder melding'}`)
  }
  if (typeof fout === 'string') return schoonMelding(fout)
  return 'Onbekende fout'
}

/** Vaste sleutel voor "dezelfde fout": gebied, route en geschoonde melding. */
export function fingerprintVan(gebied: FoutGebied, route: string, melding: string): string {
  return createHash('sha256').update(`${gebied}|${route}|${melding}`).digest('hex').slice(0, 16)
}

export interface FoutRegel {
  fingerprint: string
  gebied: FoutGebied
  route: string
  methode: string | null
  soort: FoutSoort
  sportschool: string | null
  melding: string
}

export interface FoutInvoer {
  fout: unknown
  /** Het routepatroon (bij voorkeur) of het pad. */
  route: string
  methode?: string | null
  soort: FoutSoort
  sportschool?: string | null
  /** Bij handmatige meldingen mag het gebied vast staan; anders volgt het uit de route. */
  gebied?: FoutGebied
}

const METHODE = /^[A-Z]{3,7}$/
const SPORTSCHOOL = /^[a-z0-9-]{3,60}$/i

/** De regel voor club_fouten, of null als de fout niet bij Club of AI Your Gym hoort. */
export function maakFoutRegel(invoer: FoutInvoer): FoutRegel | null {
  const gebied = invoer.gebied ?? gebiedVan(invoer.route)
  if (!gebied) return null
  const route = schoonRoute(invoer.route)
  const melding = meldingVan(invoer.fout)
  const methode = invoer.methode && METHODE.test(invoer.methode) ? invoer.methode : null
  const sportschool = invoer.sportschool && SPORTSCHOOL.test(invoer.sportschool) ? invoer.sportschool.toLowerCase() : null
  return { fingerprint: fingerprintVan(gebied, route, melding), gebied, route, methode, soort: invoer.soort, sportschool, melding }
}

/**
 * Rem tegen een stortvloed: per server hooguit `max` meldingen per venster.
 * Geeft een functie die true geeft als deze melding nog mag.
 */
export function maakRem(max: number, vensterMs: number): (nu?: number) => boolean {
  let tijden: number[] = []
  return (nu = Date.now()) => {
    tijden = tijden.filter((t) => nu - t < vensterMs)
    if (tijden.length >= max) return false
    tijden = [...tijden, nu]
    return true
  }
}
