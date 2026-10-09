// ─── Fit Factory PT — metingen door het traject (PUUR) ──────────────────────
// Velden volgen de startmeting van het intakeformulier: gewicht, vetpercentage en omtrekmaten,
// cardio- en krachttest, foto's. Geen normen of streefwaarden: we laten alleen
// zien wat er gemeten is en wat er sinds de start veranderd is.
// Opslag: pt_metingen (migratie 356), zie dossier-opslag.ts.

import type { MetingSoort } from './traject'

export const METING_SOORTEN = ['start', 'tussen', 'eind', 'weging'] as const satisfies readonly MetingSoort[]
export const METING_SOORT_LABEL: Record<MetingSoort, string> = { start: 'Startmeting', tussen: 'Tussenmeting', eind: 'Eindmeting', weging: 'Weging' }
/** De meetmomenten uit het traject (zonder de losse wegingen). */
export const CHECK_SOORTEN = ['start', 'tussen', 'eind'] as const satisfies readonly MetingSoort[]

export function isMetingSoort(v: unknown): v is MetingSoort {
  return typeof v === 'string' && (METING_SOORTEN as readonly string[]).includes(v)
}

export const MAAT_VELDEN = [
  { sleutel: 'gewichtKg', label: 'Gewicht', eenheid: 'kg', min: 20, max: 400 },
  { sleutel: 'vetPct', label: 'Vetpercentage', eenheid: '%', min: 2, max: 70 },
  { sleutel: 'tailleCm', label: 'Taille', eenheid: 'cm', min: 20, max: 300 },
  { sleutel: 'heupCm', label: 'Heup', eenheid: 'cm', min: 20, max: 300 },
  { sleutel: 'borstCm', label: 'Borst', eenheid: 'cm', min: 20, max: 300 },
  { sleutel: 'armCm', label: 'Arm', eenheid: 'cm', min: 10, max: 100 },
  { sleutel: 'beenCm', label: 'Been', eenheid: 'cm', min: 10, max: 150 },
] as const
export type MaatSleutel = (typeof MAAT_VELDEN)[number]['sleutel']

export const KRACHT_RM = [1, 5] as const
export type KrachtRm = (typeof KRACHT_RM)[number]

export interface Meting extends Record<MaatSleutel, number | null> {
  id: string
  /** YYYY-MM-DD */
  datum: string
  soort: MetingSoort
  cardiotest: string | null
  krachtOefening: string | null
  krachtRm: KrachtRm | null
  krachtKg: number | null
  fotosGemaakt: boolean
  notitie: string | null
}
export type MetingInvoer = Omit<Meting, 'id'>

// ─── Invoer (systeemgrens) ────────────────────────────────────────────────────

type Lees<T> = { ok: true; waarde: T } | { ok: false; fout: string }
const DAG = /^\d{4}-\d{2}-\d{2}$/

function tekst(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.replace(/\s+/g, ' ').trim()
  return t.length === 0 ? null : t.slice(0, max)
}

/** Leeg → null; anders een getal binnen [min, max] op 0,1 nauwkeurig, of 'fout'. */
function maat(v: unknown, min: number, max: number): number | null | 'fout' {
  if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) return null
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(',', '.')) : NaN
  if (!Number.isFinite(n) || n < min || n > max) return 'fout'
  return Math.round(n * 10) / 10
}

function leesMaten(o: Record<string, unknown>): Lees<Record<MaatSleutel, number | null>> {
  const uit = {} as Record<MaatSleutel, number | null>
  for (const v of MAAT_VELDEN) {
    const w = maat(o[v.sleutel], v.min, v.max)
    if (w === 'fout') return { ok: false, fout: `${v.label}: vul een getal tussen ${v.min} en ${v.max} ${v.eenheid} in.` }
    uit[v.sleutel] = w
  }
  return { ok: true, waarde: uit }
}

/** Formulier → meting, of een leesbare fout. `vandaag` weert datums in de toekomst. */
export function leesMetingInvoer(body: unknown, vandaag?: string): Lees<MetingInvoer> {
  if (typeof body !== 'object' || body === null) return { ok: false, fout: 'Ongeldige invoer.' }
  const o = body as Record<string, unknown>
  if (typeof o.datum !== 'string' || !DAG.test(o.datum) || Number.isNaN(Date.parse(`${o.datum}T12:00:00Z`))) {
    return { ok: false, fout: 'Kies de datum van de meting.' }
  }
  if (vandaag && o.datum > vandaag) return { ok: false, fout: 'Een meting kan niet in de toekomst liggen.' }
  if (!isMetingSoort(o.soort)) return { ok: false, fout: 'Kies het soort meting.' }
  const maten = leesMaten(o)
  if (!maten.ok) return maten
  const krachtKg = maat(o.krachtKg, 0, 500)
  if (krachtKg === 'fout') return { ok: false, fout: 'Krachttest: vul een gewicht tussen 0 en 500 kg in.' }
  const krachtRm = o.krachtRm === 1 || o.krachtRm === 5 ? o.krachtRm : null
  const waarde: MetingInvoer = {
    datum: o.datum,
    soort: o.soort,
    ...maten.waarde,
    cardiotest: tekst(o.cardiotest, 80),
    krachtOefening: krachtKg === null ? null : tekst(o.krachtOefening, 80),
    krachtRm: krachtKg === null ? null : krachtRm,
    krachtKg,
    fotosGemaakt: o.fotosGemaakt === true,
    notitie: tekst(o.notitie, 500),
  }
  const iets = MAAT_VELDEN.some((v) => waarde[v.sleutel] !== null) || waarde.cardiotest || waarde.krachtKg !== null || waarde.fotosGemaakt
  return iets ? { ok: true, waarde } : { ok: false, fout: 'Vul minstens één meetwaarde in.' }
}

export function leesMeting(ruw: unknown): Meting | null {
  if (typeof ruw !== 'object' || ruw === null) return null
  const o = ruw as Record<string, unknown>
  if (typeof o.id !== 'string') return null
  const r = leesMetingInvoer(o)
  return r.ok ? { id: o.id, ...r.waarde } : null
}

// ─── Afgeleiden ───────────────────────────────────────────────────────────────

const SOORT_VOLGORDE: Record<MetingSoort, number> = { start: 0, weging: 1, tussen: 2, eind: 3 }

/** Oud → nieuw; op dezelfde dag start vóór tussen vóór eind. */
export function sorteer(metingen: readonly Meting[]): Meting[] {
  return [...metingen].sort((a, b) => a.datum.localeCompare(b.datum) || SOORT_VOLGORDE[a.soort] - SOORT_VOLGORDE[b.soort])
}

export interface Verschil {
  label: string
  eenheid: string
  van: { datum: string; waarde: number }
  naar: { datum: string; waarde: number }
  verschil: number
}

function verschil(label: string, eenheid: string, van: Meting, naar: Meting, a: number, b: number): Verschil {
  return { label, eenheid, van: { datum: van.datum, waarde: a }, naar: { datum: naar.datum, waarde: b }, verschil: Math.round((b - a) * 10) / 10 }
}

/**
 * Per maat: de startwaarde (uit een startmeting, anders de oudste meting met die
 * maat) tegenover de laatst gemeten waarde. Alleen als er twee verschillende
 * metingen zijn. Kracht alleen bij dezelfde oefening en hetzelfde RM.
 */
export function verschilSindsStart(metingen: readonly Meting[]): Verschil[] {
  const reeks = sorteer(metingen)
  const uit: Verschil[] = []
  for (const v of MAAT_VELDEN) {
    const met = reeks.filter((m) => m[v.sleutel] !== null)
    const van = met.find((m) => m.soort === 'start') ?? met[0]
    const naar = met.at(-1)
    if (!van || !naar || van === naar || naar.datum < van.datum) continue
    uit.push(verschil(v.label, v.eenheid, van, naar, van[v.sleutel] as number, naar[v.sleutel] as number))
  }
  const kracht = reeks.filter((m) => m.krachtKg !== null)
  const kVan = kracht.find((m) => m.soort === 'start') ?? kracht[0]
  const zelfde = (m: Meting) => m.krachtRm === kVan?.krachtRm && (m.krachtOefening ?? '').toLowerCase() === (kVan?.krachtOefening ?? '').toLowerCase()
  const kNaar = kracht.filter(zelfde).at(-1)
  if (kVan && kNaar && kVan !== kNaar && kNaar.datum >= kVan.datum) {
    const naam = [kVan.krachtOefening, kVan.krachtRm ? `${kVan.krachtRm}RM` : null].filter(Boolean).join(' ')
    uit.push(verschil(naam ? `Kracht (${naam})` : 'Kracht', 'kg', kVan, kNaar, kVan.krachtKg as number, kNaar.krachtKg as number))
  }
  return uit
}

/** "82,4" — één decimaal alleen als die er is. */
export function getalNl(n: number): string {
  return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 }).format(n)
}

/** "+1,5 kg", "−0,8 cm", "0 kg" */
export function verschilTekst(v: Pick<Verschil, 'verschil' | 'eenheid'>): string {
  const teken = v.verschil > 0 ? '+' : v.verschil < 0 ? '−' : ''
  return `${teken}${getalNl(Math.abs(v.verschil))} ${v.eenheid}`
}

export interface LijnPunt {
  x: number
  y: number
  datum: string
  waarde: number
}

/**
 * Gewicht door de tijd als punten in een vlak van `breedte` × `hoogte`
 * (x naar datum, y naar waarde, met wat lucht boven en onder). Minder dan twee
 * metingen met gewicht → leeg.
 */
export function gewichtLijn(metingen: readonly Meting[], breedte: number, hoogte: number): LijnPunt[] {
  const reeks = sorteer(metingen).filter((m) => m.gewichtKg !== null)
  if (reeks.length < 2) return []
  const t = reeks.map((m) => Date.parse(`${m.datum}T12:00:00Z`))
  const w = reeks.map((m) => m.gewichtKg as number)
  const [t0, t1] = [t[0], t[t.length - 1]]
  const lucht = Math.max(0.5, (Math.max(...w) - Math.min(...w)) * 0.15)
  const [lo, hi] = [Math.min(...w) - lucht, Math.max(...w) + lucht]
  return reeks.map((m, i) => ({
    x: t1 === t0 ? (i / (reeks.length - 1)) * breedte : ((t[i] - t0) / (t1 - t0)) * breedte,
    y: hoogte - ((w[i] - lo) / (hi - lo)) * hoogte,
    datum: m.datum,
    waarde: w[i],
  }))
}
