// ─── LifeOS — beleggingen: invoer aan de systeemgrens (PUUR) ────────────────
// Narrowen, nooit casten. Een fout geeft een leesbare Nederlandse melding.

export type Lees<T> = { ok: true; waarde: T } | { ok: false; fout: string }

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

/** Een positief getal; komma als decimaal mag ("6,28"). */
export function leesBedrag(v: unknown, veld: string, { leegMag = false, nulMag = false } = {}): Lees<number | null> {
  if (v === null || v === undefined || v === '') return leegMag ? { ok: true, waarde: null } : { ok: false, fout: `${veld} ontbreekt.` }
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(/\s/g, '').replace(',', '.')) : Number.NaN
  if (!Number.isFinite(n) || n < 0 || (!nulMag && n === 0)) return { ok: false, fout: `${veld} moet een positief getal zijn.` }
  if (n > 1e12) return { ok: false, fout: `${veld} is onwaarschijnlijk groot.` }
  return { ok: true, waarde: n }
}

const SYMBOOL = /^[A-Za-z0-9.^=\-]{1,20}$/

export interface NieuweInvoer {
  symbool: string
  aantal: number
  aankoopprijs: number | null
  inlegEur: number | null
}

export function leesNieuwePositie(body: unknown): Lees<NieuweInvoer> {
  const o = obj(body)
  if (!o) return { ok: false, fout: 'Ongeldige invoer.' }
  const symbool = typeof o.symbool === 'string' ? o.symbool.trim().toUpperCase() : ''
  if (!SYMBOOL.test(symbool)) return { ok: false, fout: 'Kies een aandeel of ETF uit de zoekresultaten.' }
  const aantal = leesBedrag(o.aantal, 'Aantal')
  if (!aantal.ok) return aantal
  const prijs = leesBedrag(o.aankoopprijs, 'Aankoopprijs', { leegMag: true })
  if (!prijs.ok) return prijs
  const inleg = leesBedrag(o.inlegEur, 'Inleg in euro', { leegMag: true })
  if (!inleg.ok) return inleg
  return { ok: true, waarde: { symbool, aantal: aantal.waarde as number, aankoopprijs: prijs.waarde, inlegEur: inleg.waarde } }
}

export interface Wijziging {
  aantal?: number
  aankoopprijs?: number | null
  inlegEur?: number | null
}

export function leesWijziging(body: unknown): Lees<Wijziging> {
  const o = obj(body)
  if (!o) return { ok: false, fout: 'Ongeldige invoer.' }
  const uit: Wijziging = {}
  if ('aantal' in o) {
    const a = leesBedrag(o.aantal, 'Aantal')
    if (!a.ok) return a
    uit.aantal = a.waarde as number
  }
  if ('aankoopprijs' in o) {
    const p = leesBedrag(o.aankoopprijs, 'Aankoopprijs', { leegMag: true })
    if (!p.ok) return p
    uit.aankoopprijs = p.waarde
  }
  if ('inlegEur' in o) {
    const i = leesBedrag(o.inlegEur, 'Inleg in euro', { leegMag: true })
    if (!i.ok) return i
    uit.inlegEur = i.waarde
  }
  if (Object.keys(uit).length === 0) return { ok: false, fout: 'Niets om te wijzigen.' }
  return { ok: true, waarde: uit }
}
