// ─── Fit Factory Club, 3D-oefenbeelden: beweging tussen sleutels (PUUR) ──────
// Een lus door alle sleutels. Op een sleutel met pauze (vast > 0) komt de
// beweging rustig tot stilstand en vertrekt ze weer rustig; een tussensleutel
// zonder pauze wordt vloeiend doorlopen (Catmull-Rom, kubische Hermite).

import { KANALEN, type Houding, type Kanaal, type Sleutel } from './typen'

export function lusDuur(sleutels: readonly Sleutel[]): number {
  return sleutels.reduce((som, s) => som + s.vast + s.naarVolgende, 0)
}

function helling(sleutels: readonly Sleutel[], i: number, k: Kanaal): number {
  const n = sleutels.length
  const s = sleutels[i]
  if (s.vast > 0) return 0
  const vorige = sleutels[(i - 1 + n) % n]
  const volgende = sleutels[(i + 1) % n]
  const tijd = vorige.naarVolgende + s.naarVolgende
  return tijd > 0 ? (volgende.houding[k] - vorige.houding[k]) / tijd : 0
}

function hermite(p0: number, p1: number, m0: number, m1: number, s: number): number {
  const s2 = s * s
  const s3 = s2 * s
  return (2 * s3 - 3 * s2 + 1) * p0 + (s3 - 2 * s2 + s) * m0 + (-2 * s3 + 3 * s2) * p1 + (s3 - s2) * m1
}

/** De houding op tijd `t` (seconden, loopt eindeloos door). */
export function houdingOp(sleutels: readonly Sleutel[], t: number): Houding {
  const duur = lusDuur(sleutels)
  if (sleutels.length === 0 || duur <= 0) throw new Error('Een oefening heeft sleutels met tijd nodig')
  let rest = ((t % duur) + duur) % duur
  for (let i = 0; i < sleutels.length; i++) {
    const s = sleutels[i]
    if (rest < s.vast) return s.houding
    rest -= s.vast
    if (rest < s.naarVolgende) {
      const j = (i + 1) % sleutels.length
      const v = sleutels[j]
      const fractie = rest / s.naarVolgende
      const uit = {} as Record<Kanaal, number>
      for (const k of KANALEN) {
        const m0 = helling(sleutels, i, k) * s.naarVolgende
        const m1 = helling(sleutels, j, k) * s.naarVolgende
        uit[k] = hermite(s.houding[k], v.houding[k], m0, m1, fractie)
      }
      return uit
    }
    rest -= s.naarVolgende
  }
  return sleutels[0].houding
}

/** Het moment waarop sleutel `i` bereikt wordt (begin van de pauze erop). */
export function sleutelTijd(sleutels: readonly Sleutel[], i: number): number {
  let t = 0
  for (let j = 0; j < i && j < sleutels.length; j++) t += sleutels[j].vast + sleutels[j].naarVolgende
  return t
}

/** Tijd van de begin- en de eindhouding (de sleutel halverwege de lus). */
export function standTijd(sleutels: readonly Sleutel[], stand: 'begin' | 'eind'): number {
  return stand === 'begin' ? 0 : sleutelTijd(sleutels, Math.floor(sleutels.length / 2))
}
