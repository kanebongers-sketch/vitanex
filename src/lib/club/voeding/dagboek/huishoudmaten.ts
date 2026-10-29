// ─── Club, voedingsdagboek: huishoudmaten (PUUR) ────────────────────────────
// Geporteerd uit MentaForce. Naast grammen kies je een huishoudmaat (1 snee,
// 1 glas). Dit zijn TYPISCHE gemiddelden, een gemak en geen exacte waarde per
// product; het lid kan de gram daarna altijd bijstellen (eerlijkheidsregel).
// De namen staan in het woordenboek (VOEDING_DAGBOEK.maten), hier alleen de ids.

export interface Huishoudmaat {
  id: string
  /** Typisch gewicht van een eenheid in gram. */
  gram: number
}

/** Een compacte, herkenbare set. Volgorde = hoe vaak je hem vermoedelijk kiest. */
export const HUISHOUDMATEN = [
  { id: 'stuk', gram: 100 },
  { id: 'snee', gram: 35 },
  { id: 'portie', gram: 150 },
  { id: 'handje', gram: 30 },
  { id: 'glas', gram: 250 },
  { id: 'kop', gram: 240 },
  { id: 'eetlepel', gram: 15 },
  { id: 'theelepel', gram: 5 },
] as const satisfies readonly Huishoudmaat[]

export type MaatId = (typeof HUISHOUDMATEN)[number]['id']

export function isMaatId(v: unknown): v is MaatId {
  return typeof v === 'string' && HUISHOUDMATEN.some((m) => m.id === v)
}

/** Het gewicht in gram voor een aantal van een maat, of null bij een onbekende maat. */
export function gramVoor(maatId: string, aantal: number): number | null {
  const maat = HUISHOUDMATEN.find((m) => m.id === maatId)
  if (!maat) return null
  const n = Number.isFinite(aantal) && aantal > 0 ? aantal : 1
  return Math.round(maat.gram * n)
}
