// ─── Voeding — huishoudmaten ────────────────────────────────────────────────
// Laagdrempelig loggen: naast grammen kun je een huishoudmaat kiezen (1 snee,
// 1 stuk, 1 glas…). Dit zijn TYPISCHE gemiddelden — bewust een gemak, geen exacte
// waarde per product. De gebruiker kan de gram daarna altijd fijn bijstellen,
// dus we verzinnen geen precisie die er niet is (eerlijkheidsregel).

export interface Huishoudmaat {
  id: string
  /** Enkelvoud, zoals op de chip. */
  label: string
  /** Typisch gewicht van één eenheid in gram. */
  gram: number
}

/** Een compacte, herkenbare set. Volgorde = hoe vaak je 'm vermoedelijk kiest. */
export const HUISHOUDMATEN: readonly Huishoudmaat[] = [
  { id: 'stuk', label: 'stuk', gram: 100 },
  { id: 'snee', label: 'snee', gram: 35 },
  { id: 'portie', label: 'portie', gram: 150 },
  { id: 'handje', label: 'handje', gram: 30 },
  { id: 'glas', label: 'glas', gram: 250 },
  { id: 'kop', label: 'kop', gram: 240 },
  { id: 'eetlepel', label: 'eetlepel', gram: 15 },
  { id: 'theelepel', label: 'theelepel', gram: 5 },
] as const

/** Het gewicht in gram voor een aantal van een maat, of null bij een onbekende maat. */
export function gramVoor(maatId: string, aantal: number): number | null {
  const maat = HUISHOUDMATEN.find((m) => m.id === maatId)
  if (!maat) return null
  const n = Number.isFinite(aantal) && aantal > 0 ? aantal : 1
  return Math.round(maat.gram * n)
}
