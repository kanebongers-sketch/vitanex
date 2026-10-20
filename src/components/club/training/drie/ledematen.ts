// ─── Fit Factory Club, 3D-oefenbeelden: armen en benen ──────────────────────
// Elk lidmaat is een gevormde buis langs zijn bot: per hoogte een doorsnede
// (breedte, voorkant, achterkant) plus spierbuiken als zachte bulten op een
// plek en hoek (quadriceps, hamstrings, kuit, deltaspier, biceps, triceps).
// Hoek 0 is de voorkant, 90 de binnenkant, -90 de buitenkant, 180 de achterkant.
// Kleding (mouw, broekspijp) is een eigen laag over de huid.

import { Vector3 } from 'three'
import { MATEN } from '@/lib/club/training/3d/maten'
import type { Lichaamsdeel } from '@/lib/club/training/3d/typen'
import { glad, hoekVerschil, klok, raster, tabel, type Bouwer, type PuntInfo } from './bouwer'
import { kleurMet, werkt, type Palet } from './palet'
import { BOT } from './skelet'

interface Bult {
  readonly t: number
  readonly dt: number
  readonly hoek: number
  readonly dh: number
  readonly h: number
}

interface Lid {
  readonly lengte: number
  /** Rijen [t, halve breedte, voorkant, achterkant] in meter. */
  readonly doorsnede: readonly (readonly number[])[]
  readonly bulten: readonly Bult[]
  /** Lengte van de ronde doppen als deel van de straal. */
  readonly kapBoven: number
  readonly kapOnder: number
  readonly ringen: number
}

const DIJ: Lid = {
  lengte: MATEN.dij,
  doorsnede: [
    [0, 0.092, 0.0899, 0.0942],
    [0.12, 0.0899, 0.0877, 0.092],
    [0.35, 0.0824, 0.0813, 0.0803],
    [0.6, 0.0728, 0.0706, 0.0663],
    [0.82, 0.0599, 0.0578, 0.0535],
    [0.94, 0.0535, 0.0503, 0.0492],
    [1, 0.0524, 0.0481, 0.0481],
  ],
  bulten: [
    { t: 0.55, dt: 0.38, hoek: -72, dh: 55, h: 0.011 },
    { t: 0.84, dt: 0.14, hoek: 52, dh: 42, h: 0.013 },
    { t: 0.42, dt: 0.36, hoek: -4, dh: 34, h: 0.008 },
    { t: 0.5, dt: 0.4, hoek: 180, dh: 62, h: 0.007 },
    { t: 0.2, dt: 0.26, hoek: 102, dh: 42, h: 0.008 },
    { t: 1.0, dt: 0.08, hoek: 0, dh: 30, h: 0.013 },
    { t: 0.62, dt: 0.3, hoek: -108, dh: 14, h: -0.003 },
  ],
  kapBoven: 0.7,
  kapOnder: 0.8,
  ringen: 24,
}

const SCHEEN: Lid = {
  lengte: MATEN.scheen,
  doorsnede: [
    [0, 0.0515, 0.0473, 0.0483],
    [0.12, 0.0525, 0.041, 0.0588],
    [0.3, 0.0483, 0.0357, 0.063],
    [0.55, 0.0389, 0.0315, 0.0441],
    [0.8, 0.0305, 0.0273, 0.0305],
    [1, 0.0326, 0.0305, 0.0315],
  ],
  bulten: [
    { t: 0.28, dt: 0.21, hoek: 142, dh: 45, h: 0.012 },
    { t: 0.25, dt: 0.17, hoek: -145, dh: 40, h: 0.009 },
    { t: 0.36, dt: 0.3, hoek: -38, dh: 30, h: 0.005 },
    { t: 0.03, dt: 0.08, hoek: 0, dh: 50, h: 0.005 },
    { t: 0.985, dt: 0.05, hoek: 90, dh: 30, h: 0.007 },
    { t: 0.99, dt: 0.05, hoek: -90, dh: 30, h: 0.006 },
  ],
  kapBoven: 0.85,
  kapOnder: 0.6,
  ringen: 22,
}

const BOVENARM: Lid = {
  lengte: MATEN.bovenarm,
  doorsnede: [
    [0, 0.047, 0.048, 0.05],
    [0.2, 0.044, 0.045, 0.048],
    [0.5, 0.041, 0.045, 0.046],
    [0.8, 0.038, 0.038, 0.04],
    [1, 0.036, 0.033, 0.036],
  ],
  bulten: [
    { t: 0.1, dt: 0.3, hoek: -90, dh: 80, h: 0.011 },
    { t: 0.08, dt: 0.22, hoek: -30, dh: 45, h: 0.008 },
    { t: 0.08, dt: 0.22, hoek: -150, dh: 45, h: 0.007 },
    { t: 0.58, dt: 0.3, hoek: 5, dh: 50, h: 0.01 },
    { t: 0.4, dt: 0.36, hoek: 172, dh: 45, h: 0.009 },
    { t: 0.36, dt: 0.25, hoek: -138, dh: 35, h: 0.007 },
    { t: 0.42, dt: 0.08, hoek: -90, dh: 30, h: -0.003 },
  ],
  kapBoven: 0.9,
  kapOnder: 0.8,
  ringen: 20,
}

const ONDERARM: Lid = {
  lengte: MATEN.onderarm,
  doorsnede: [
    [0, 0.038, 0.034, 0.038],
    [0.2, 0.042, 0.036, 0.037],
    [0.5, 0.035, 0.03, 0.03],
    [0.8, 0.029, 0.022, 0.022],
    [1, 0.028, 0.018, 0.019],
  ],
  bulten: [
    { t: 0.24, dt: 0.26, hoek: -62, dh: 45, h: 0.009 },
    { t: 0.3, dt: 0.3, hoek: 60, dh: 50, h: 0.006 },
    { t: 0.0, dt: 0.09, hoek: 180, dh: 35, h: 0.008 },
  ],
  kapBoven: 0.85,
  kapOnder: 0.55,
  ringen: 16,
}

const ROND = 36
const MACHT = 2.3
const KAP = 10

interface RingDef {
  /** Hoogte langs het bot (m). */
  readonly y: number
  /** Schaal van de dop (1 buiten de doppen). */
  readonly k: number
  /** Extra dikte (kleding). */
  readonly extra: number
}

function grootste(l: Lid, t: number): number {
  return Math.max(tabel(l.doorsnede, t, 1), tabel(l.doorsnede, t, 2), tabel(l.doorsnede, t, 3))
}

/** Ringen van boven (met dop) tot `tot` (m), met een dop onderaan als `dicht`. */
function ringen(l: Lid, tot: number, dicht: boolean, extra: (y: number) => number): RingDef[] {
  const lijst: RingDef[] = []
  // Een kledinglaag krijgt een eigen, iets grotere dop (geen samenvallende vlakken).
  const kb = (grootste(l, 0) + extra(0) * 1.6) * l.kapBoven
  for (let i = 1; i < KAP; i++) {
    const a = (i / KAP) * (Math.PI / 2)
    lijst.push({ y: -kb * Math.cos(a), k: Math.sin(a), extra: extra(0) })
  }
  const stappen = Math.max(4, Math.round((l.ringen * tot) / l.lengte))
  for (let i = 0; i <= stappen; i++) {
    const y = (i / stappen) * tot
    lijst.push({ y, k: 1, extra: extra(y) })
  }
  if (dicht) {
    const ko = grootste(l, 1) * l.kapOnder
    for (let i = KAP - 1; i >= 1; i--) {
      const a = (i / KAP) * (Math.PI / 2)
      lijst.push({ y: l.lengte + ko * Math.cos(a), k: Math.sin(a), extra: extra(l.lengte) })
    }
  }
  return lijst
}

function macht(x: number): number {
  return Math.sign(x) * Math.abs(x) ** (2 / MACHT)
}

/** Punt op het lid: hoek in graden, stof dempt de groeven. */
function lidPunt(l: Lid, r: RingDef, hoek: number, kant: number, schaal: number, uit: Vector3): Vector3 {
  const t = Math.min(1, Math.max(0, r.y / l.lengte))
  const rad = (hoek * Math.PI) / 180
  const s = Math.sin(rad)
  const c = Math.cos(rad)
  let bult = 0
  for (const b of l.bulten) {
    const h = r.extra > 0 && b.h < 0 ? b.h * 0.3 : b.h
    bult += h * klok((t - b.t) / b.dt) * klok(hoekVerschil(hoek, b.hoek) / b.dh)
  }
  const m = (tabel(l.doorsnede, t, 1) * macht(s) + s * bult) * schaal + s * r.extra
  const z = ((c >= 0 ? tabel(l.doorsnede, t, 2) : tabel(l.doorsnede, t, 3)) * macht(c) + c * bult) * schaal + c * r.extra
  return uit.set(kant * m * r.k, r.y, z * r.k)
}

type Masker = (t: number, hoek: number) => number

const MASKERS: Partial<Record<Lichaamsdeel, Masker>> = {
  dij: (t) => glad(0.04, 0.22, t) * (1 - glad(0.78, 0.93, t)),
  kuit: (t, h) => klok((t - 0.36) / 0.3) * klok(hoekVerschil(h, 180) / 100),
  bovenarm: (t) => glad(0.24, 0.4, t) * (1 - glad(0.76, 0.92, t)),
  schouder: (t, h) => klok((t - 0.04) / 0.4) * (1 - 0.85 * klok(hoekVerschil(h, 90) / 75)),
  onderarm: (t) => glad(0.1, 0.24, t) * (1 - glad(0.74, 0.9, t)),
}

interface LidOpties {
  readonly lid: Lid
  readonly bot: number
  readonly kant: number
  readonly delen: readonly Lichaamsdeel[]
  readonly p: Palet
  /** Schaduw in plooien als functie van t en hoek. */
  readonly ao?: Masker
}

function spierOp(o: LidOpties, t: number, hoek: number): number {
  let m = 0
  for (const d of o.delen) {
    const f = MASKERS[d]
    if (f && werkt(o.p, d)) m = Math.max(m, f(t, hoek))
  }
  return m
}

function huid(b: Bouwer, o: LidOpties): void {
  const lijst = ringen(o.lid, o.lid.lengte, true, () => 0)
  raster(b, {
    ringen: lijst.length,
    rond: ROND,
    punt: (i, j, uit) => lidPunt(o.lid, lijst[i], (j / ROND) * 360, o.kant, 1, uit),
    info: (i, j): PuntInfo => {
      const t = Math.min(1, Math.max(0, lijst[i].y / o.lid.lengte))
      const hoek = (j / ROND) * 360
      const m = spierOp(o, t, hoek)
      return { kleur: kleurMet(o.p.huid, o.p, m, false, o.ao?.(t, hoek) ?? 0), spier: m, a: o.bot }
    },
  })
}

interface Laag {
  readonly tot: number
  readonly dikte: number
  readonly wijd: number
  readonly schaal: number
}

/** Een kledinglaag met een zoom (dubbele rand) aan de onderkant. */
function kleding(b: Bouwer, o: LidOpties, laag: Laag): void {
  const extra = (y: number) => laag.dikte + laag.wijd * glad(laag.tot * 0.4, laag.tot, y)
  const lijst = ringen(o.lid, laag.tot, false, extra)
  lijst.push({ y: laag.tot + 0.002, k: 1, extra: 0.0015 })
  raster(b, {
    ringen: lijst.length,
    rond: ROND,
    openEind: true,
    punt: (i, j, uit) => lidPunt(o.lid, lijst[i], (j / ROND) * 360, o.kant, laag.schaal, uit),
    info: (i, j): PuntInfo => {
      const t = Math.min(1, Math.max(0, lijst[i].y / o.lid.lengte))
      const hoek = (j / ROND) * 360
      const m = spierOp(o, t, hoek)
      const zoom = i >= lijst.length - 2 ? 0.18 : 0
      const kleur = o.bot === BOT.bovenarm[0] || o.bot === BOT.bovenarm[1] ? o.p.shirt : o.p.broek
      return { kleur: kleurMet(kleur, o.p, m, true, zoom), spier: m * 0.7, a: o.bot }
    },
  })
}

export function bouwBenen(b: Bouwer, stof: Bouwer, p: Palet): void {
  ;[1, -1].forEach((kant, i) => {
    const dij: LidOpties = {
      lid: DIJ,
      bot: BOT.dij[i],
      kant,
      delen: ['dij'],
      p,
      ao: (t, h) => 0.28 * klok(t / 0.22) * klok(hoekVerschil(h, 95) / 60) + 0.15 * klok((t - 1) / 0.12) * klok(hoekVerschil(h, 180) / 50),
    }
    huid(b, dij)
    kleding(stof, dij, { tot: DIJ.lengte * 0.4, dikte: 0.006, wijd: 0.008, schaal: 1.03 })
    huid(b, {
      lid: SCHEEN,
      bot: BOT.scheen[i],
      kant,
      delen: ['kuit'],
      p,
      ao: (t, h) => 0.15 * klok(t / 0.12) * klok(hoekVerschil(h, 180) / 50),
    })
  })
}

export function bouwArmen(b: Bouwer, stof: Bouwer, p: Palet): void {
  ;[1, -1].forEach((kant, i) => {
    const boven: LidOpties = {
      lid: BOVENARM,
      bot: BOT.bovenarm[i],
      kant,
      delen: ['bovenarm', 'schouder'],
      p,
      ao: (t, h) => 0.3 * klok(t / 0.25) * klok(hoekVerschil(h, 90) / 55),
    }
    huid(b, boven)
    kleding(stof, boven, { tot: BOVENARM.lengte * 0.36, dikte: 0.004, wijd: 0.005, schaal: 1.0 })
    huid(b, { lid: ONDERARM, bot: BOT.onderarm[i], kant, delen: ['onderarm'], p })
  })
}
