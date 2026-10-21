// ─── Fit Factory Club, 3D-oefenbeelden: ogen en oogleden ────────────────────
// Echte oogbollen (wit, iris, pupil, licht bol hoornvlies) met een rustige
// blik recht vooruit. Boven- en onderooglid liggen als dunne schelpen over
// de bol, met een afgeronde rand; de bovenste rand is donker (wimpers) en
// werpt een zachte schaduw op het oog. De buitenkant van de leden verdwijnt
// vanzelf onder de huid, zo ontstaat de plooi van het ooglid.

import { Color, Vector3 } from 'three'
import { glad, raster, type Bouwer, type PuntInfo } from './bouwer'
import { vel } from './hoofd-vel'
import { huidZonderOog, naarHuid, normaal, OOG, occlusie } from './hoofd-vorm'
import { BOT, HOOFD_NAAR_BIND } from './skelet'

const GRAAD = Math.PI / 180

const KLEUR = {
  pupil: new Color('#0b0908'),
  irisBinnen: new Color('#4a2f1c'),
  iris: new Color('#6d4a2c'),
  limbus: new Color('#24180f'),
  wit: new Color('#d9cfc3'),
  witAchter: new Color('#b7a99c'),
  wimper: new Color('#1f1712'),
  lidRand: new Color('#b0726a'),
} as const

/** Ooghoeken (graden): binnen (neuskant) en buiten. */
const HOEK = { binnen: -55, buiten: 59, binnenH: -5.5, buitenH: -1.5 } as const

function hoekHoogte(a: number): number {
  const t = Math.min(1, Math.max(0, (a - HOEK.binnen) / (HOEK.buiten - HOEK.binnen)))
  return HOEK.binnenH + (HOEK.buitenH - HOEK.binnenH) * t
}

/** Hoogte (graden) van de rand van het boven- (kant 1) of onderlid (kant -1). */
export function lidRand(a: number, kant: 1 | -1): number {
  const t = (a - HOEK.binnen) / (HOEK.buiten - HOEK.binnen)
  const basis = hoekHoogte(a)
  if (t <= 0 || t >= 1) return basis
  if (kant === 1) return basis + 23.8 * Math.sin(Math.PI * t ** 0.86) ** 0.8
  return basis - 21.5 * Math.sin(Math.PI * t ** 1.2) ** 0.95
}

function richting(a: number, e: number, zij: number, uit: Vector3): Vector3 {
  return uit.set(zij * Math.sin(a * GRAAD) * Math.cos(e * GRAAD), Math.sin(e * GRAAD), Math.cos(a * GRAAD) * Math.cos(e * GRAAD))
}

/** Ringen van de oogbol: hoek vanaf het midden van de pupil (radialen). */
const BOL_RINGEN = [0.07, 0.15, 0.19, 0.27, 0.38, 0.49, 0.545, 0.6, 0.78, 1.05, 1.45, 1.95, 2.55] as const

function bolKleur(theta: number, phi: number): Color {
  if (theta < 0.17) return KLEUR.pupil.clone()
  if (theta < 0.52) {
    const s = (theta - 0.17) / 0.35
    const k = KLEUR.irisBinnen.clone().lerp(KLEUR.iris, glad(0, 0.55, s) * (0.8 + 0.2 * Math.sin(phi * 7)))
    return k.lerp(KLEUR.limbus, glad(0.7, 1, s))
  }
  return KLEUR.wit.clone().lerp(KLEUR.limbus, 0.5 * glad(0.6, 0.53, theta)).lerp(KLEUR.witAchter, glad(0.7, 1.5, theta))
}

function oogbol(b: Bouwer, zij: number): void {
  const rond = 16
  const midden = new Vector3(zij * OOG.x, OOG.y, OOG.z)
  raster(b, {
    ringen: BOL_RINGEN.length,
    rond,
    naarBind: HOOFD_NAAR_BIND,
    punt: (i, j, uit) => {
      const t = BOL_RINGEN[i]
      const f = (j / rond) * Math.PI * 2
      const r = OOG.r + 0.0011 * glad(0.62, 0, t)
      return uit.set(Math.sin(t) * Math.cos(f), Math.sin(t) * Math.sin(f), Math.cos(t)).multiplyScalar(r).add(midden)
    },
    info: (i, j, p): PuntInfo => {
      const t = BOL_RINGEN[i]
      const f = (j / rond) * Math.PI * 2
      const k = bolKleur(t, f)
      // Schaduw van het bovenlid en de oogkas.
      const a = Math.atan2(zij * (p.x - midden.x), p.z - midden.z) / GRAAD
      const e = Math.asin(Math.max(-1, Math.min(1, (p.y - midden.y) / OOG.r))) / GRAAD
      const boven = glad(lidRand(a, 1) - 14, lidRand(a, 1), e)
      const hoek = glad(40, 62, Math.abs(a))
      return { kleur: k.multiplyScalar(1 - 0.42 * boven - 0.3 * hoek), spier: 0, a: BOT.hoofd }
    },
  })
}

/** Doorsnede van een lid: [graden voorbij de rand, extra straal, binnenkant 0/1]. */
const DOORSNEDE: readonly (readonly number[])[] = [
  [78, 0.0012, 1],
  [3, 0.0007, 1],
  [0, 0.0003, 0],
  [0.9, 0.0016, 0],
  [3.2, 0.0025, 0],
  [9, 0.0029, 0],
  [22, 0.003, 0],
  [45, 0.0029, 0],
  [78, 0.0026, 0],
]

const LID_RINGEN = 14
const H = new Vector3()

/** Kleur van de huid op een punt met schaduw (gedeeld met het gezicht). */
export type HuidKleur = (q: Vector3, ao: number) => Color

function lid(b: Bouwer, huid: HuidKleur, zij: number, kant: 1 | -1): void {
  const midden = new Vector3(zij * OOG.x, OOG.y, OOG.z)
  const hoekVan = (i: number) => -94 + (196 * i) / (LID_RINGEN - 1)
  const dikte = kant === 1 ? 1 : 0.62
  const n = new Vector3()
  vel(b, {
    rijen: LID_RINGEN,
    kolommen: DOORSNEDE.length,
    binnen: midden,
    ijk: [LID_RINGEN >> 1, 5],
    naarBind: HOOFD_NAAR_BIND,
    punt: (i, j, uit) => {
      const a = hoekVan(i)
      const [voorbij, extra, binnen] = DOORSNEDE[j]
      const e = lidRand(a, kant) + kant * voorbij
      const r = OOG.r + (binnen ? -extra : extra * dikte)
      richting(a, e, zij, uit).multiplyScalar(r).add(midden)
      // Voorbij de rand gaat het lid vloeiend op in de huid (net eronder),
      // zo ontstaat een zachte plooi in plaats van een rafelige snijlijn.
      const op = binnen ? 0 : glad(4, 20, voorbij)
      if (op === 0) return uit
      naarHuid(H.copy(uit), huidZonderOog)
      normaal(H, n)
      return uit.lerp(H.addScaledVector(n, -0.00035), op)
    },
    info: (i, j, q): PuntInfo => {
      const a = hoekVan(i)
      const voorbij = DOORSNEDE[j][0]
      // Schaduw zoals op de huid ernaast, zodat de kleur doorloopt.
      if (DOORSNEDE[j][2]) n.copy(q).sub(midden).normalize()
      else normaal(H.copy(q), n)
      const ao = occlusie(q, n)
      const k = huid(q, ao).lerp(KLEUR.lidRand, 0.12 * glad(14, 3, voorbij)).multiplyScalar(1 - 0.1 * glad(5, 16, voorbij))
      const rand = glad(4.5, 0.8, voorbij) * glad(HOEK.binnen - 4, HOEK.binnen + 8, a) * glad(HOEK.buiten + 4, HOEK.buiten - 6, a)
      if (kant === 1) k.lerp(KLEUR.wimper, 0.88 * rand)
      else k.lerp(KLEUR.lidRand, 0.3 * rand).multiplyScalar(1 - 0.12 * rand)
      return { kleur: k, spier: 0, a: BOT.hoofd }
    },
  })
}

export function bouwOgen(b: Bouwer, huid: HuidKleur): void {
  for (const zij of [1, -1]) {
    oogbol(b, zij)
    lid(b, huid, zij, 1)
    lid(b, huid, zij, -1)
  }
}
