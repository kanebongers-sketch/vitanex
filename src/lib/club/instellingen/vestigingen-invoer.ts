// ─── Club: vestigingen beheren (PUUR) ───────────────────────────────────────
// Een sportschool voegt zelf vestigingen toe, hernoemt ze, zet ze in volgorde
// en kiest welke standaard open gaat. De sleutel (slug) is uniek over alle
// sportscholen, dus naast de naam krijgt hij een kort willekeurig achtervoegsel.

import { isVestigingSlug } from '@/lib/club/kern/vestigingen'

export type Uitslag<T> = { ok: true; waarde: T } | { ok: false; fout: string }

export const MAX_VESTIGING_NAAM = 60
export const MAX_ADRES = 160
export const MAX_VESTIGINGEN = 40

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
