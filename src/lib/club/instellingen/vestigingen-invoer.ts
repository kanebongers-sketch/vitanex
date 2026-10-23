// ─── Club: vestigingen beheren (PUUR) ───────────────────────────────────────
// Een sportschool voegt zelf vestigingen toe, hernoemt ze, zet ze in volgorde
// en kiest welke standaard open gaat. De sleutel (slug) is uniek over alle
// sportscholen, dus naast de naam krijgt hij een kort willekeurig achtervoegsel.

import { isVestigingSlug } from '@/lib/club/kern/vestigingen'
import { openingstijdenNaarJson, openingstijdenUitJson } from '@/lib/club/rooster/openingstijden'

export type Uitslag<T> = { ok: true; waarde: T } | { ok: false; fout: string }

export const MAX_VESTIGING_NAAM = 60
export const MAX_ADRES = 160
export const MAX_VESTIGINGEN = 40

/**
 * De openingstijden die een nieuwe vestiging krijgt (ma tot en met vr 07:00 tot
 * 22:00, za en zo 09:00 tot 16:00). Een plaatshouder, geen keuze van de
 * sportschool: de startwizard telt ze daarom niet als "al ingesteld".
 */
export const STANDAARD_OPENINGSTIJDEN: Readonly<Record<string, [string, string]>> = Object.fromEntries(
  [1, 2, 3, 4, 5, 6, 7].map((d) => [String(d), d <= 5 ? ['07:00', '22:00'] : ['09:00', '16:00']]),
)

/** Staan er precies de openingstijden van een nieuwe vestiging (dus nog niets zelf gekozen)? */
export function isStandaardOpen(ruw: unknown): boolean {
  const dagen = openingstijdenNaarJson(openingstijdenUitJson(ruw))
  const standaard = Object.entries(STANDAARD_OPENINGSTIJDEN)
  return Object.keys(dagen).length === standaard.length && standaard.every(([d, [van, tot]]) => dagen[d]?.[0] === van && dagen[d]?.[1] === tot)
}

/** Heeft de sportschool zelf openingstijden gekozen (minstens een open dag, en niet de plaatshouder)? */
export function heeftEigenOpeningstijden(ruw: unknown): boolean {
  return openingstijdenUitJson(ruw).some((d) => d !== null) && !isStandaardOpen(ruw)
}

/** "Eindhoven Centrum" wordt "eindhoven-centrum-k3f9". */
export function maakVestigingSlug(naam: string, achtervoegsel: string): string {
  const basis = naam
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
  const slug = `${basis || 'vestiging'}-${achtervoegsel.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6)}`
  return isVestigingSlug(slug) ? slug : `vestiging-${Date.now().toString(36)}`
}

export interface NieuweVestiging {
  naam: string
  adres: string | null
}

function object(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function schoon(v: unknown): string {
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : ''
}

function leesNaam(v: unknown): Uitslag<string> {
  const naam = schoon(v)
  if (!naam) return { ok: false, fout: 'Vul de naam van de vestiging in.' }
  if (naam.length > MAX_VESTIGING_NAAM) return { ok: false, fout: `De naam mag maximaal ${MAX_VESTIGING_NAAM} tekens zijn.` }
  return { ok: true, waarde: naam }
}

function leesAdres(v: unknown): Uitslag<string | null> {
  const adres = schoon(v)
  if (adres.length > MAX_ADRES) return { ok: false, fout: `Het adres mag maximaal ${MAX_ADRES} tekens zijn.` }
  return { ok: true, waarde: adres || null }
}

export function leesNieuweVestiging(body: unknown): Uitslag<NieuweVestiging> {
  const o = object(body)
  if (!o) return { ok: false, fout: 'Ongeldige invoer.' }
  const naam = leesNaam(o.naam)
  if (!naam.ok) return naam
  const adres = leesAdres(o.adres)
  if (!adres.ok) return adres
  return { ok: true, waarde: { naam: naam.waarde, adres: adres.waarde } }
}

export interface VestigingWijziging {
  naam?: string
  adres?: string | null
  telefoon?: string | null
  email?: string | null
  /** Deze vestiging wordt de standaard (de andere niet meer). */
  standaard?: true
  /** Een plek omhoog (-1) of omlaag (1) in de lijst. */
  verplaats?: -1 | 1
}

export function leesVestigingWijziging(body: unknown): Uitslag<VestigingWijziging> {
  const o = object(body)
  if (!o) return { ok: false, fout: 'Ongeldige invoer.' }
  const uit: VestigingWijziging = {}
  if ('naam' in o) {
    const naam = leesNaam(o.naam)
    if (!naam.ok) return naam
    uit.naam = naam.waarde
  }
  if ('adres' in o) {
    const adres = leesAdres(o.adres)
    if (!adres.ok) return adres
    uit.adres = adres.waarde
  }
  if ('telefoon' in o) {
    const tel = schoon(o.telefoon)
    if (tel && !/^[0-9+() -]{6,20}$/.test(tel)) return { ok: false, fout: 'Vul een geldig telefoonnummer in.' }
    uit.telefoon = tel || null
  }
  if ('email' in o) {
    const email = schoon(o.email).toLowerCase()
    if (email && (email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return { ok: false, fout: 'Vul een geldig e-mailadres in.' }
    uit.email = email || null
  }
  if (o.standaard === true) uit.standaard = true
  if (o.verplaats === -1 || o.verplaats === 1) uit.verplaats = o.verplaats
  if (Object.keys(uit).length === 0) return { ok: false, fout: 'Er is niets om te wijzigen.' }
  return { ok: true, waarde: uit }
}

/** De nieuwe volgorde na een plek omhoog of omlaag: per sleutel een volgnummer vanaf 1. */
export function nieuweVolgorde(sleutels: readonly string[], sleutel: string, stap: -1 | 1): Map<string, number> {
  const lijst = [...sleutels]
  const i = lijst.indexOf(sleutel)
  const j = i + stap
  if (i !== -1 && j >= 0 && j < lijst.length) [lijst[i], lijst[j]] = [lijst[j], lijst[i]]
  return new Map(lijst.map((s, n) => [s, n + 1]))
}
