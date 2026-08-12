// ─── Cross-pijler verbanden (puur) ───────────────────────────────────────────
// Vita's differentiator: eerlijke verbanden tussen pijlers (slaap ↔ stemming,
// stappen ↔ stemming, …). Aanpak: koppel twee dagreeksen op datum (optioneel met
// een dag vertraging, bv. slaap-nacht → volgende dag), splits de "driver" op zijn
// mediaan en vergelijk het gemiddelde van de uitkomst tussen beide helften.
//
// EERLIJK: dit is een waargenomen associatie, GEEN oorzaak. We melden alleen bij
// genoeg dagen in beide groepen én een merkbaar verschil, en formuleren voorzichtig.

export interface DagWaarde {
  datum: string // YYYY-MM-DD
  waarde: number
}

/** Verschuift een YYYY-MM-DD met N dagen (kan negatief). Puur, tijdzone-neutraal. */
export function verschuifDatum(datum: string, dagen: number): string {
  const [j, m, d] = datum.split('-').map(Number)
  const t = Date.UTC(j, m - 1, d) + dagen * 86_400_000
  return new Date(t).toISOString().slice(0, 10)
}

/**
 * Groepeert ruwe rijen naar één waarde per dag (gemiddelde). Het datumveld mag
 * een YYYY-MM-DD of een ISO-timestamp zijn (we nemen de datum ervan). Rijen
 * zonder geldige datum/waarde vallen weg. Resultaat is chronologisch gesorteerd.
 */
export function dagGemiddelde(rijen: readonly unknown[], datumVeld: string, waardeVeld: string): DagWaarde[] {
  const perDag = new Map<string, { som: number; n: number }>()
  for (const rij of rijen) {
    if (typeof rij !== 'object' || rij === null) continue
    const r = rij as Record<string, unknown>
    const rd = r[datumVeld]
    const rv = r[waardeVeld]
    if (typeof rd !== 'string' || typeof rv !== 'number' || !Number.isFinite(rv)) continue
    const datum = rd.slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) continue
    const huidig = perDag.get(datum) ?? { som: 0, n: 0 }
    perDag.set(datum, { som: huidig.som + rv, n: huidig.n + 1 })
  }
  return [...perDag.entries()]
    .map(([datum, { som, n }]) => ({ datum, waarde: som / n }))
    .sort((a, b) => a.datum.localeCompare(b.datum))
}

export interface Paar {
  driver: number
  uitkomst: number
}

/**
 * Koppelt twee dagreeksen op datum. `lag` = de uitkomst wordt `lag` dagen ná de
 * driver gezocht (lag 1 = slaap vannacht → stemming morgen). Alleen dagen met
 * beide waarden tellen mee.
 */
export function koppel(driver: readonly DagWaarde[], uitkomst: readonly DagWaarde[], lag = 0): Paar[] {
  const uitMap = new Map(uitkomst.map((x) => [x.datum, x.waarde]))
  const paren: Paar[] = []
  for (const dr of driver) {
    const doel = lag === 0 ? dr.datum : verschuifDatum(dr.datum, lag)
    const u = uitMap.get(doel)
    if (u !== undefined) paren.push({ driver: dr.waarde, uitkomst: u })
  }
  return paren
}

function mediaan(waarden: number[]): number {
  const s = [...waarden].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid]
}
function gemiddelde(waarden: number[]): number {
  return waarden.reduce((a, b) => a + b, 0) / waarden.length
}

export interface SplitResultaat {
  laagGem: number // gemiddelde uitkomst bij lage driver
  hoogGem: number // gemiddelde uitkomst bij hoge driver
  nLaag: number
  nHoog: number
  verschil: number // hoogGem - laagGem
}

/**
 * Splitst de paren op de mediaan van de driver en vergelijkt de gemiddelde
 * uitkomst. null als er te weinig dagen in een groep zitten (geen ruis melden).
 */
export function splitsVergelijk(paren: readonly Paar[], minPerGroep = 4): SplitResultaat | null {
  if (paren.length < minPerGroep * 2) return null
  const med = mediaan(paren.map((p) => p.driver))
  const laag = paren.filter((p) => p.driver < med).map((p) => p.uitkomst)
  const hoog = paren.filter((p) => p.driver >= med).map((p) => p.uitkomst)
  if (laag.length < minPerGroep || hoog.length < minPerGroep) return null
  const laagGem = gemiddelde(laag)
  const hoogGem = gemiddelde(hoog)
  return { laagGem, hoogGem, nLaag: laag.length, nHoog: hoog.length, verschil: hoogGem - laagGem }
}

export interface Verband {
  tekst: string
  sterkte: number // |verschil|, om het sterkste verband te kiezen
  dagen: number
}

export interface VerbandDef {
  driver: readonly DagWaarde[]
  uitkomst: readonly DagWaarde[]
  lag?: number
  minVerschil: number // drempel op |verschil| voordat we iets durven te zeggen
  /** Bouwt de zin uit het resultaat; teken van `verschil` bepaalt de richting. */
  formatteer: (res: SplitResultaat) => string
}

/** Berekent één verband, of null als er te weinig data of te klein verschil is. */
export function berekenVerband(def: VerbandDef): Verband | null {
  const paren = koppel(def.driver, def.uitkomst, def.lag ?? 0)
  const res = splitsVergelijk(paren)
  if (!res) return null
  if (Math.abs(res.verschil) < def.minVerschil) return null
  return { tekst: def.formatteer(res), sterkte: Math.abs(res.verschil), dagen: res.nLaag + res.nHoog }
}

/** Kiest het sterkste verband uit een lijst definities (of null). */
export function kiesSterksteVerband(defs: readonly VerbandDef[]): Verband | null {
  const gevonden = defs.map(berekenVerband).filter((v): v is Verband => v !== null)
  if (gevonden.length === 0) return null
  return gevonden.reduce((beste, v) => (v.sterkte > beste.sterkte ? v : beste))
}
