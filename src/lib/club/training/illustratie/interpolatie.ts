// ─── Fit Factory Club, illustraties: mengen en tempo (PUUR) ─────────────────
// Een tussenstand is het begin en het eind gemengd: elk getal (hoek, plek)
// lineair, de rest moet gelijk zijn. Het tempo volgt de training: de zware
// (concentrische) fase gaat iets sneller dan de zakkende (excentrische), met
// een korte rust in het begin en onderin of bovenin.

import type { Richting } from './typen'

/** Meng twee waarden met dezelfde vorm. Getallen lineair, andere waarden moeten gelijk zijn. */
export function meng<T>(a: T, b: T, t: number): T {
  if (typeof a === 'number' && typeof b === 'number') return (a + (b - a) * t) as T
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) throw new Error('Begin en eind hebben een andere lengte.')
    return a.map((x, i) => meng(x, b[i], t)) as T
  }
  if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object') {
    const sleutels = Object.keys(a)
    if (sleutels.length !== Object.keys(b).length) throw new Error('Begin en eind hebben andere velden.')
    const uit: Record<string, unknown> = {}
    for (const k of sleutels) {
      if (!(k in b)) throw new Error(`Veld ${k} ontbreekt in het eind.`)
      uit[k] = meng((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], t)
    }
    return uit as T
  }
  if (a !== b) throw new Error(`Begin en eind verschillen in een vaste waarde (${String(a)} en ${String(b)}).`)
  return a
}

/** Zacht op gang en zacht tot stilstand (quintisch, symmetrisch: f(1 - x) = 1 - f(x)). */
export function zacht(x: number): number {
  const s = Math.min(1, Math.max(0, x))
  return s * s * s * (s * (s * 6 - 15) + 10)
}

/** Duur in seconden van elke fase. */
export const TEMPO = {
  concentrisch: 0.95,
  excentrisch: 1.55,
  rustBegin: 0.5,
  rustEind: 0.3,
} as const

export interface TempoProfiel {
  /** Duur van begin naar eind. */
  readonly heen: number
  readonly terug: number
  readonly rustBegin: number
  readonly rustEind: number
  readonly totaal: number
}

export function tempoProfiel(heen: Richting): TempoProfiel {
  const h = heen === 'concentrisch' ? TEMPO.concentrisch : TEMPO.excentrisch
  const t = heen === 'concentrisch' ? TEMPO.excentrisch : TEMPO.concentrisch
  return { heen: h, terug: t, rustBegin: TEMPO.rustBegin, rustEind: TEMPO.rustEind, totaal: TEMPO.rustBegin + h + TEMPO.rustEind + t }
}

/** De menging (0 = begin, 1 = eind) op tijdstip `sec` in een herhaling die zich herhaalt. */
export function mengOpTijd(sec: number, p: TempoProfiel): number {
  const t = ((sec % p.totaal) + p.totaal) % p.totaal
  if (t < p.rustBegin) return 0
  const naHeen = p.rustBegin + p.heen
  if (t < naHeen) return zacht((t - p.rustBegin) / p.heen)
  if (t < naHeen + p.rustEind) return 1
  return 1 - zacht((t - naHeen - p.rustEind) / p.terug)
}

export interface Tijdlijn {
  /** De mengingen waarvoor een beeld nodig is (oplopend, 0 tot en met 1). */
  readonly mengingen: readonly number[]
  /** Per sleutelmoment: welk beeld (index in mengingen). */
  readonly beelden: readonly number[]
  /** Per sleutelmoment: tijd als fractie van de herhaling (voor SVG keyTimes). */
  readonly momenten: readonly number[]
  readonly duur: number
}

/**
 * Een tijdlijn voor een SVG-animatie: `stappen` beelden per fase, gelijk verdeeld
 * in de tijd. Omdat `zacht` symmetrisch is, gebruiken heen en terug dezelfde beelden.
 */
export function tijdlijn(heen: Richting, stappen = 12): Tijdlijn {
  const p = tempoProfiel(heen)
  const mengingen = Array.from({ length: stappen + 1 }, (_, i) => zacht(i / stappen))
  const beelden: number[] = [0]
  const momenten: number[] = [0]
  const zet = (sec: number, beeld: number) => {
    beelden.push(beeld)
    momenten.push(sec / p.totaal)
  }
  zet(p.rustBegin, 0)
  for (let i = 1; i <= stappen; i++) zet(p.rustBegin + (p.heen * i) / stappen, i)
  const naHeen = p.rustBegin + p.heen
  zet(naHeen + p.rustEind, stappen)
  for (let i = 1; i <= stappen; i++) zet(naHeen + p.rustEind + (p.terug * i) / stappen, stappen - i)
  momenten[momenten.length - 1] = 1
  return { mengingen, beelden, momenten, duur: p.totaal }
}
