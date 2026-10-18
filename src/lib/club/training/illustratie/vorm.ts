// ─── Fit Factory Club, illustraties: vormen als SVG-paden (PUUR) ────────────
// Alle vormen zijn gladde krommen (Catmull-Rom omgezet naar kubische Bezier) of
// ellipsen uit vier Bezier-bogen. Belangrijk voor de animatie: een vorm heeft
// in elke stand precies dezelfde opbouw van commando's, zodat de browser de
// paden vloeiend in elkaar kan laten overgaan (SVG animate op het d-attribuut).

import { punt, richting, type Assen, type Vec } from './vec'

/** Getal kort genoteerd: een decimaal is ruim genoeg (1 eenheid = 1 cm). */
export function getal(n: number): string {
  const r = Math.round(n * 10) / 10
  return Object.is(r, -0) ? '0' : String(r)
}

function p(a: Vec): string {
  return `${getal(a.x)} ${getal(a.y)}`
}

/** Een gesloten gladde vorm door alle punten. `k` = spanning (1 = Catmull-Rom). */
export function gladGesloten(punten: readonly Vec[], k = 1): string {
  const n = punten.length
  if (n < 3) throw new Error('Een gesloten vorm heeft minstens drie punten nodig.')
  let d = `M${p(punten[0])}`
  for (let i = 0; i < n; i++) {
    const p0 = punten[(i - 1 + n) % n]
    const p1 = punten[i]
    const p2 = punten[(i + 1) % n]
    const p3 = punten[(i + 2) % n]
    const c1 = { x: p1.x + ((p2.x - p0.x) / 6) * k, y: p1.y + ((p2.y - p0.y) / 6) * k }
    const c2 = { x: p2.x - ((p3.x - p1.x) / 6) * k, y: p2.y - ((p3.y - p1.y) / 6) * k }
    d += `C${p(c1)} ${p(c2)} ${p(p2)}`
  }
  return `${d}Z`
}

/** Een open gladde lijn door alle punten. */
export function gladOpen(punten: readonly Vec[], k = 1): string {
  const n = punten.length
  if (n < 2) throw new Error('Een lijn heeft minstens twee punten nodig.')
  let d = `M${p(punten[0])}`
  for (let i = 0; i < n - 1; i++) {
    const p0 = punten[Math.max(0, i - 1)]
    const p1 = punten[i]
    const p2 = punten[i + 1]
    const p3 = punten[Math.min(n - 1, i + 2)]
    const c1 = { x: p1.x + ((p2.x - p0.x) / 6) * k, y: p1.y + ((p2.y - p0.y) / 6) * k }
    const c2 = { x: p2.x - ((p3.x - p1.x) / 6) * k, y: p2.y - ((p3.y - p1.y) / 6) * k }
    d += `C${p(c1)} ${p(c2)} ${p(p2)}`
  }
  return d
}

/** Een veelhoek met rechte zijden. */
export function veelhoek(punten: readonly Vec[]): string {
  return `M${punten.map(p).join('L')}Z`
}

/** Een rechte lijn (voor kabels, als lijnstuk met een rand). */
export function lijnstuk(a: Vec, b: Vec): string {
  return `M${p(a)}L${p(b)}`
}

const KAPPA = 0.5523

/** Ellips met middelpunt, stralen en draaiing (graden, met de klok mee). */
export function ellips(c: Vec, rx: number, ry: number, draai = 0): string {
  const a = { o: c, u: richting(draai + 90), n: richting(draai + 180), hoek: draai + 90 }
  const q = (x: number, y: number) => p(punt(a, x, y))
  const kx = rx * KAPPA
  const ky = ry * KAPPA
  return (
    `M${q(rx, 0)}` +
    `C${q(rx, ky)} ${q(kx, ry)} ${q(0, ry)}` +
    `C${q(-kx, ry)} ${q(-rx, ky)} ${q(-rx, 0)}` +
    `C${q(-rx, -ky)} ${q(-kx, -ry)} ${q(0, -ry)}` +
    `C${q(kx, -ry)} ${q(rx, -ky)} ${q(rx, 0)}Z`
  )
}

/** Afgeronde rechthoek rond een middelpunt, breedte langs de hoek `draai` (0 = horizontaal). */
export function rondeRechthoek(c: Vec, b: number, h: number, r: number, draai = 0): string {
  const a = { o: c, u: richting(draai + 90), n: richting(draai + 180), hoek: draai + 90 }
  const q = (x: number, y: number) => p(punt(a, x, y))
  const hb = b / 2
  const hh = h / 2
  const rr = Math.min(r, hb, hh)
  const k = rr * (1 - KAPPA)
  return (
    `M${q(-hb + rr, -hh)}L${q(hb - rr, -hh)}` +
    `C${q(hb - k, -hh)} ${q(hb, -hh + k)} ${q(hb, -hh + rr)}` +
    `L${q(hb, hh - rr)}` +
    `C${q(hb, hh - k)} ${q(hb - k, hh)} ${q(hb - rr, hh)}` +
    `L${q(-hb + rr, hh)}` +
    `C${q(-hb + k, hh)} ${q(-hb, hh - k)} ${q(-hb, hh - rr)}` +
    `L${q(-hb, -hh + rr)}` +
    `C${q(-hb, -hh + k)} ${q(-hb + k, -hh)} ${q(-hb + rr, -hh)}Z`
  )
}

/** Een ledemaat-profiel: per fractie t van de lengte de breedte aan de plus- en minkant (normaal n). */
export type Profiel = readonly (readonly [t: number, plusKant: number, minKant: number])[]

/** Breedte op fractie t, lineair tussen de sleutels. */
export function breedte(profiel: Profiel, t: number, kant: 1 | -1): number {
  const kol = kant === 1 ? 1 : 2
  if (t <= profiel[0][0]) return profiel[0][kol]
  for (let i = 1; i < profiel.length; i++) {
    const [t1] = profiel[i]
    if (t <= t1) {
      const [t0] = profiel[i - 1]
      const f = (t - t0) / (t1 - t0)
      return profiel[i - 1][kol] + (profiel[i][kol] - profiel[i - 1][kol]) * f
    }
  }
  return profiel[profiel.length - 1][kol]
}

const STAPPEN = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] as const

/** De omtrek van een ledemaat: plus-kant heen, ronde kop, min-kant terug, ronde voet. */
export function ledemaatOmtrek(a: Assen, l: number, profiel: Profiel): Vec[] {
  const heen = STAPPEN.map((t) => punt(a, t * l, breedte(profiel, t, 1)))
  const terug = [...STAPPEN].reverse().map((t) => punt(a, t * l, -breedte(profiel, t, -1)))
  const rEind = (breedte(profiel, 1, 1) + breedte(profiel, 1, -1)) / 2
  const rBegin = (breedte(profiel, 0, 1) + breedte(profiel, 0, -1)) / 2
  const midEind = (breedte(profiel, 1, 1) - breedte(profiel, 1, -1)) / 2
  const midBegin = (breedte(profiel, 0, 1) - breedte(profiel, 0, -1)) / 2
  return [
    ...heen,
    punt(a, l + rEind * 0.72, midEind + rEind * 0.62),
    punt(a, l + rEind * 0.72, midEind - rEind * 0.62),
    ...terug,
    punt(a, -rBegin * 0.72, midBegin - rBegin * 0.62),
    punt(a, -rBegin * 0.72, midBegin + rBegin * 0.62),
  ]
}

/**
 * Een spierbuik als lens langs de rand van een ledemaat: de buitenrand volgt de
 * omtrek (net binnen de rand), de binnenrand buigt naar binnen tot `diepte`
 * (fractie van de breedte aan die kant; boven 1 voorbij de middellijn).
 */
export function spierLens(a: Assen, l: number, profiel: Profiel, kant: 1 | -1, t0: number, t1: number, diepte: number): Vec[] {
  const n = 7
  const ts = Array.from({ length: n }, (_, i) => t0 + ((t1 - t0) * i) / (n - 1))
  const buiten = ts.map((t) => punt(a, t * l, kant * breedte(profiel, t, kant) * 0.97))
  const binnen = ts
    .slice(1, -1)
    .reverse()
    .map((t, j) => {
      const s = (n - 2 - j) / (n - 1)
      const w = breedte(profiel, t, kant)
      return punt(a, t * l, kant * w * (0.97 - diepte * Math.sin(Math.PI * s) ** 0.8))
    })
  return [...buiten, ...binnen]
}

/** Een band dwars over het hele ledemaat (bijvoorbeeld de schouderkap), van t0 tot t1. */
export function spierBand(a: Assen, l: number, profiel: Profiel, t0: number, t1: number): Vec[] {
  const n = 5
  const ts = Array.from({ length: n }, (_, i) => t0 + ((t1 - t0) * i) / (n - 1))
  const plusKant = ts.map((t) => punt(a, t * l, breedte(profiel, t, 1) * 0.97))
  const tip = punt(a, (t1 + 0.04) * l, (breedte(profiel, t1, 1) - breedte(profiel, t1, -1)) / 2)
  const minKant = [...ts].reverse().map((t) => punt(a, t * l, -breedte(profiel, t, -1) * 0.97))
  const kap = punt(a, t0 * l - breedte(profiel, t0, 1) * 0.6, 0)
  return [...plusKant, tip, ...minKant, kap]
}

/** Schaduw aan een kant van een ledemaat: een smalle maan langs de rand. */
export function schaduwMaan(a: Assen, l: number, profiel: Profiel, kant: 1 | -1, dikte: number): Vec[] {
  const ts = [0.04, 0.2, 0.4, 0.6, 0.8, 0.96]
  const buiten = ts.map((t) => punt(a, t * l, kant * breedte(profiel, t, kant) * 0.995))
  const binnen = ts
    .slice(1, -1)
    .reverse()
    .map((t) => {
      const w = breedte(profiel, t, kant)
      return punt(a, t * l, kant * w * (1 - dikte))
    })
  return [...buiten, ...binnen]
}
