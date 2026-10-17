// ─── Club, voortgang: schaal voor de eigen SVG-grafiek (PUUR) ────────────────
// De x-as volgt de tijd (metingen liggen niet op vaste afstand), de y-as krijgt
// een ronde onder- en bovengrens met wat lucht, zodat kleine schommelingen niet
// als grote sprongen ogen.

export interface GrafiekPunt {
  x: number
  y: number
  waarde: number
  datum: string
}

export interface GrafiekSchaal {
  punten: GrafiekPunt[]
  /** Hulplijnen op de y-as, onderste eerst. */
  raster: { y: number; waarde: number }[]
}

export interface Vlak {
  breedte: number
  hoogte: number
  /** Ruimte links (voor de getallen) en rondom. */
  links: number
  marge: number
}

const DAG = 86_400_000

function dagNummer(datum: string): number {
  return Math.round(Date.parse(`${datum.slice(0, 10)}T12:00:00Z`) / DAG)
}

/** Een mooie stap voor de y-as: 1, 2 of 5 maal een macht van tien. */
export function mooieStap(bereik: number, delen = 3): number {
  if (!(bereik > 0)) return 1
  const ruw = bereik / delen
  const macht = 10 ** Math.floor(Math.log10(ruw))
  const factor = [1, 2, 5, 10].find((f) => f * macht >= ruw) ?? 10
  return factor * macht
}

/** Onder- en bovengrens van de y-as, op de stap afgerond, met minstens een stap ruimte. */
export function yBereik(waarden: readonly number[]): { min: number; max: number; stap: number } {
  const laag = Math.min(...waarden)
  const hoog = Math.max(...waarden)
  const stap = mooieStap(Math.max(hoog - laag, Math.abs(hoog) * 0.02, 1))
  const min = Math.floor(laag / stap) * stap
  const max = Math.ceil(hoog / stap) * stap
  return max === min ? { min: min - stap, max: max + stap, stap } : { min, max, stap }
}

/** Zet een reeks (oudste eerst) om naar punten in het vlak. */
export function schaal(reeks: readonly { datum: string; waarde: number }[], vlak: Vlak): GrafiekSchaal {
  if (reeks.length === 0) return { punten: [], raster: [] }
  const { min, max, stap } = yBereik(reeks.map((r) => r.waarde))
  const eerste = dagNummer(reeks[0].datum)
  const laatste = dagNummer(reeks[reeks.length - 1].datum)
  const breed = vlak.breedte - vlak.links - vlak.marge
  const hoog = vlak.hoogte - 2 * vlak.marge
  const yVan = (w: number) => vlak.marge + hoog * (1 - (w - min) / (max - min))
  const punten = reeks.map((r) => ({
    x: laatste === eerste ? vlak.links + breed / 2 : vlak.links + (breed * (dagNummer(r.datum) - eerste)) / (laatste - eerste),
    y: yVan(r.waarde),
    waarde: r.waarde,
    datum: r.datum,
  }))
  const raster: { y: number; waarde: number }[] = []
  for (let w = min; w <= max + stap / 1000; w += stap) raster.push({ y: yVan(w), waarde: Math.round(w * 100) / 100 })
  return { punten, raster }
}

/** Het pad voor de lijn en het vlak eronder (voor een zachte vulling). */
export function paden(punten: readonly GrafiekPunt[], onderkant: number): { lijn: string; vlak: string } {
  if (punten.length === 0) return { lijn: '', vlak: '' }
  const lijn = punten.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const eerste = punten[0]
  const laatste = punten[punten.length - 1]
  return { lijn, vlak: `${lijn} L${laatste.x.toFixed(1)} ${onderkant} L${eerste.x.toFixed(1)} ${onderkant} Z` }
}
