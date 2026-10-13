// ─── PT-app — kleding van PT'ers + voorraad in Eersel (PUUR) ───────────────
// Wat er is (artikelen met maten), hoeveel er in Eersel ligt, en wie wat kreeg.
// Alleen Kane registreert; Kane en de eigenaren kijken mee (zie zietKleding).
// Opslaan en de voorraad-bewaking zitten in de database (migratie 368); hier
// alleen de vorm, de invoercontrole en de afgeleide overzichten.

/** Standaardmaten, in de volgorde waarin ze getoond worden. Eigen maten mogen ook. */
export const STANDAARD_MATEN = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const

export interface KledingArtikel {
  id: string
  naam: string
  maten: string[]
}

export interface VoorraadRegel {
  artikelId: string
  maat: string
  aantal: number
}

export interface Uitgifte {
  id: string
  persoonId: string
  artikelId: string
  maat: string
  aantal: number
  /** YYYY-MM-DD */
  uitgegevenOp: string
  /** YYYY-MM-DD, of null zolang de PT'er het nog heeft. */
  terugOp: string | null
  notitie: string | null
}

// ─── Overzichten ─────────────────────────────────────────────────────────────

/** Voorraad als artikel → maat → aantal; ontbrekende maten tellen als 0. */
export function voorraadPerArtikel(artikelen: readonly KledingArtikel[], voorraad: readonly VoorraadRegel[]): Map<string, Map<string, number>> {
  const uit = new Map<string, Map<string, number>>()
  for (const a of artikelen) uit.set(a.id, new Map(a.maten.map((m) => [m, 0])))
  for (const v of voorraad) uit.get(v.artikelId)?.set(v.maat, v.aantal)
  return uit
}

export interface BezitRegel {
  artikelId: string
  maat: string
  aantal: number
  /** De openstaande uitgiftes waar dit uit bestaat (voor "terug"). */
  uitgiftes: Uitgifte[]
}

/**
 * Wat elke persoon nu in bezit heeft (alleen niet-teruggegeven uitgiftes),
 * per artikel + maat opgeteld. persoon_id → regels, gesorteerd op artikelvolgorde.
 */
export function bezitPerPersoon(uitgiftes: readonly Uitgifte[], artikelen: readonly KledingArtikel[]): Map<string, BezitRegel[]> {
  const volgorde = new Map(artikelen.map((a, i) => [a.id, i]))
  const uit = new Map<string, Map<string, BezitRegel>>()
  for (const u of uitgiftes) {
    if (u.terugOp !== null) continue
    const perPersoon = uit.get(u.persoonId) ?? new Map<string, BezitRegel>()
    const sleutel = `${u.artikelId}|${u.maat}`
    const regel = perPersoon.get(sleutel) ?? { artikelId: u.artikelId, maat: u.maat, aantal: 0, uitgiftes: [] }
    regel.aantal += u.aantal
    regel.uitgiftes.push(u)
    perPersoon.set(sleutel, regel)
    uit.set(u.persoonId, perPersoon)
  }
  return new Map(
    [...uit].map(([id, regels]) => [
      id,
      [...regels.values()].sort((a, b) => (volgorde.get(a.artikelId) ?? 0) - (volgorde.get(b.artikelId) ?? 0) || a.maat.localeCompare(b.maat)),
    ]),
  )
}

/** Totaal stuks in voorraad en totaal stuks uitgegeven (nog niet terug). */
export function kledingTotalen(voorraad: readonly VoorraadRegel[], uitgiftes: readonly Uitgifte[]): { opVoorraad: number; uitgegeven: number } {
  return {
    opVoorraad: voorraad.reduce((s, v) => s + v.aantal, 0),
    uitgegeven: uitgiftes.filter((u) => u.terugOp === null).reduce((s, u) => s + u.aantal, 0),
  }
}

// ─── Invoer (systeemgrens) ───────────────────────────────────────────────────

type Lees<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DAG = /^\d{4}-\d{2}-\d{2}$/

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function tekst(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.replace(/\s+/g, ' ').trim()
  return t.length === 0 ? null : t.slice(0, max)
}

function geheel(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'string' ? Number(v) : v
  return typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max ? n : null
}

/** Maten: standaard eerst (in hun volgorde), eigen maten erachter; zonder dubbelen. */
export function leesMaten(v: unknown): string[] {
  const ruw = (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [])
    .map((m) => (typeof m === 'string' ? m.trim().toUpperCase().slice(0, 12) : ''))
    .filter(Boolean)
  const uniek = [...new Set(ruw)]
  const standaard = STANDAARD_MATEN.filter((m) => uniek.includes(m))
  return [...standaard, ...uniek.filter((m) => !(STANDAARD_MATEN as readonly string[]).includes(m))].slice(0, 12)
}

export type KledingActie =
  | { actie: 'artikel'; naam: string; maten: string[] }
  | { actie: 'voorraad'; artikelId: string; maat: string; aantal: number }
  | { actie: 'uitgeven'; persoonId: string; artikelId: string; maat: string; aantal: number; datum: string; notitie: string | null }
  | { actie: 'terug'; uitgifteId: string; datum: string; opVoorraad: boolean }

/** Een actie uit de body van POST /api/lifeos/pt-kleding, of een leesbare fout. */
export function leesKledingActie(body: unknown, vandaag: string): Lees<KledingActie> {
  const o = obj(body)
  if (!o) return { ok: false, fout: 'Ongeldige invoer.' }
  const datum = typeof o.datum === 'string' && DAG.test(o.datum) ? o.datum : vandaag
  switch (o.actie) {
    case 'artikel': {
      const naam = tekst(o.naam, 60)
      const maten = leesMaten(o.maten)
      if (!naam) return { ok: false, fout: 'Vul de naam van het artikel in.' }
      if (maten.length === 0) return { ok: false, fout: 'Kies minstens één maat.' }
      return { ok: true, waarde: { actie: 'artikel', naam, maten } }
    }
    case 'voorraad': {
      const aantal = geheel(o.aantal, 0, 10000)
      const maat = tekst(o.maat, 12)
      if (typeof o.artikelId !== 'string' || !UUID.test(o.artikelId) || !maat) return { ok: false, fout: 'Ongeldig artikel of maat.' }
      if (aantal === null) return { ok: false, fout: 'Vul een aantal in (0 of meer).' }
      return { ok: true, waarde: { actie: 'voorraad', artikelId: o.artikelId, maat: maat.toUpperCase(), aantal } }
    }
    case 'uitgeven': {
      const aantal = geheel(o.aantal, 1, 50)
      const maat = tekst(o.maat, 12)
      if (typeof o.persoonId !== 'string' || !UUID.test(o.persoonId)) return { ok: false, fout: "Kies de PT'er." }
      if (typeof o.artikelId !== 'string' || !UUID.test(o.artikelId) || !maat) return { ok: false, fout: 'Kies artikel en maat.' }
      if (aantal === null) return { ok: false, fout: 'Vul een aantal in (1 tot 50).' }
      return { ok: true, waarde: { actie: 'uitgeven', persoonId: o.persoonId, artikelId: o.artikelId, maat: maat.toUpperCase(), aantal, datum, notitie: tekst(o.notitie, 300) } }
    }
    case 'terug': {
      if (typeof o.uitgifteId !== 'string' || !UUID.test(o.uitgifteId)) return { ok: false, fout: 'Ongeldige uitgifte.' }
      return { ok: true, waarde: { actie: 'terug', uitgifteId: o.uitgifteId, datum, opVoorraad: o.opVoorraad !== false } }
    }
    default:
      return { ok: false, fout: 'Onbekende actie.' }
  }
}
