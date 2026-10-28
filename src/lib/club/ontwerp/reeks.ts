// ─── Club: rekenwerk voor het designsysteem (PUUR) ──────────────────────────
// Sparklijnen, voortgangsringen en de kleine tellingen die de schermen erbij
// tonen. Alleen echte cijfers uit data die er al is; een ontbrekende waarde
// blijft null en wordt een gat in de lijn, nooit een verzonnen nul.

import { dagSleutel, maandagVan } from '@/lib/club/cijfers/tijd'

export interface SparkPunt {
  x: number
  y: number
}

/** Het bereik van een reeks zonder de gaten; null als er geen enkele waarde is. */
export function bereikVan(waarden: readonly (number | null)[]): { laag: number; hoog: number } | null {
  const echt = waarden.filter((w): w is number => typeof w === 'number' && Number.isFinite(w))
  if (echt.length === 0) return null
  return { laag: Math.min(...echt), hoog: Math.max(...echt) }
}

/**
 * De lijnstukken van een sparklijn in een vak van breedte x hoogte (met een
 * marge voor de lijndikte). Een null breekt de lijn: elk stuk is een eigen
 * reeks punten. Een vlakke reeks staat in het midden, niet tegen de rand.
 */
export function sparkStukken(waarden: readonly (number | null)[], breedte: number, hoogte: number, marge = 2): SparkPunt[][] {
  const b = bereikVan(waarden)
  if (!b || waarden.length === 0) return []
  const stap = waarden.length > 1 ? (breedte - marge * 2) / (waarden.length - 1) : 0
  const span = b.hoog - b.laag
  const y = (w: number) => (span === 0 ? hoogte / 2 : marge + (1 - (w - b.laag) / span) * (hoogte - marge * 2))
  const stukken: SparkPunt[][] = []
  let huidig: SparkPunt[] = []
  waarden.forEach((w, i) => {
    if (typeof w !== 'number' || !Number.isFinite(w)) {
      if (huidig.length) stukken.push(huidig)
      huidig = []
      return
    }
    huidig = [...huidig, { x: waarden.length > 1 ? marge + i * stap : breedte / 2, y: y(w) }]
  })
  if (huidig.length) stukken.push(huidig)
  return stukken
}

/** Een SVG-pad van rechte stukken (geen gladde curve: die verzint waarden). */
export function padVan(punten: readonly SparkPunt[]): string {
  return punten.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
}

/** Het deel van een ring (0 tot 1), afgekapt, voor een voortgangsring. */
export function ringDeel(gedaan: number, totaal: number): number {
  if (!Number.isFinite(gedaan) || !Number.isFinite(totaal) || totaal <= 0) return 0
  return Math.min(1, Math.max(0, gedaan / totaal))
}

/** De maand (jjjj-mm) van een dagsleutel, en de maand ervoor. */
export function maandVan(dag: string): string {
  return dag.slice(0, 7)
}

export function vorigeMaand(maand: string): string {
  const [j, m] = maand.split('-').map(Number)
  return m === 1 ? `${j - 1}-12` : `${j}-${String(m - 1).padStart(2, '0')}`
}

export interface MaandBezoek {
  /** Dagen met een bezoek in de lopende kalendermaand. */
  dezeMaand: number
  /** Dagen met een bezoek in de hele vorige kalendermaand. */
  vorigeMaand: number
}

/**
 * Bezoeken per kalendermaand (regel Kane: cijfers altijd per kalendermaand).
 * Een dag met een check-in telt als een bezoek, zoals elders in Club. De
 * bezoeken moeten de vorige maand helemaal dekken (de ledenkaart leest 12 weken).
 */
export function bezoekPerMaand(bezoeken: readonly Date[], nu: Date): MaandBezoek {
  const deze = maandVan(dagSleutel(nu))
  const vorige = vorigeMaand(deze)
  const dagen = new Set(bezoeken.map((b) => dagSleutel(b)))
  let dezeMaand = 0
  let vorigeMaandAantal = 0
  for (const d of dagen) {
    if (maandVan(d) === deze) dezeMaand += 1
    else if (maandVan(d) === vorige) vorigeMaandAantal += 1
  }
  return { dezeMaand, vorigeMaand: vorigeMaandAantal }
}

export interface Ronde {
  /** Trainingsdagen van het schema (A, B, C, ...) die deze week al gedaan zijn. */
  gedaan: number
  /** Hoeveel trainingsdagen het schema heeft. */
  totaal: number
  /** Per dag van het schema: deze week gedaan of niet. */
  dagen: { dag: number; gedaan: boolean }[]
}

interface RondeLog {
  schemaId: string | null
  dag: number | null
  op: string
}

/**
 * Hoeveel van de trainingsdagen van het schema het lid deze kalenderweek
 * (maandag tot en met zondag) heeft gedaan. Alleen gelogde trainingen tellen.
 */
export function rondeDezeWeek(dagen: readonly { dag: number }[], logs: readonly RondeLog[], schemaId: string, nu: Date): Ronde {
  const maandag = maandagVan(dagSleutel(nu))
  const gedaanDagen = new Set(
    logs
      .filter((l) => l.schemaId === schemaId && l.dag !== null)
      .filter((l) => {
        const d = dagSleutel(new Date(l.op))
        return d >= maandag && d <= dagSleutel(nu)
      })
      .map((l) => l.dag),
  )
  const perDag = dagen.map((d) => ({ dag: d.dag, gedaan: gedaanDagen.has(d.dag) }))
  return { gedaan: perDag.filter((d) => d.gedaan).length, totaal: perDag.length, dagen: perDag }
}

/** Bezetting van de lessen die doorgaan: geboekte plekken van de capaciteit (0 tot 1), of null zonder plekken. */
export function bezettingVan(lessen: readonly { capaciteit: number; geboekt: number; geannuleerd: boolean }[]): number | null {
  const door = lessen.filter((l) => !l.geannuleerd && l.capaciteit > 0)
  const plekken = door.reduce((s, l) => s + l.capaciteit, 0)
  if (plekken === 0) return null
  return Math.min(1, door.reduce((s, l) => s + Math.min(l.geboekt, l.capaciteit), 0) / plekken)
}
