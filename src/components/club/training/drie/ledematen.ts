// ─── Fit Factory Club, 3D-oefenbeelden: armen en benen ──────────────────────
// Arm en been zijn elk een doorlopende huid van schouder of heup tot pols of
// enkel (geen losse stukken, dus geen naad bij elleboog en knie). De vorm komt
// uit `ledematen-vorm.ts`. Rond het gewricht hangt de huid aan het hulpbot dat
// half meedraait (zie skelet.ts), zodat knie en elleboog rond blijven.
// Kleding (mouw, broekspijp) is een eigen, strakke laag over de huid.

import { Vector3 } from 'three'
import type { Lichaamsdeel } from '@/lib/club/training/3d/typen'
import { glad, hoekVerschil, klok, raster, tabel, type Bouwer, type PuntInfo } from './bouwer'
import { BOVENARM, DIJ, ONDERARM, SCHEEN, type Lid } from './ledematen-vorm'
import { kleurMet, sterkteVan, type Palet } from './palet'
import { BOT } from './skelet'
import { MASKERS, type Masker } from './spiermaskers'

const ROND = 36
const MACHT = 2.3
const KAP = 10

interface Deel {
  readonly lid: Lid
  readonly bot: number
  readonly delen: readonly Lichaamsdeel[]
  /** Schaduw in plooien als functie van t en hoek. */
  readonly ao?: Masker
}

/** Een arm of been: twee delen met een hulpbot in het gewricht. */
interface Ketting {
  readonly boven: Deel
  readonly onder: Deel
  readonly gewricht: number
  /** Hulpbot in schouder of heup, met hoe sterk de bovenkant eraan hangt. */
  readonly kop: { readonly bot: number; readonly sterk: number; readonly tot: number }
  readonly kant: number
  readonly p: Palet
  /** Halve breedte van de zone rond het gewricht die meebuigt (m). */
  readonly meng: number
  /** Hoogte van een sok boven het uiteinde (alleen benen, m). */
  readonly sok?: number
}

interface RingDef {
  /** Hoogte langs de ketting in de bindhouding (m). */
  readonly y: number
  /** Schaal van de dop (1 buiten de doppen). */
  readonly k: number
  /** Extra dikte (kleding). */
  readonly extra: number
}

const grens = (x: number) => Math.min(1, Math.max(0, x))
const lengteVan = (k: Ketting) => k.boven.lid.lengte + k.onder.lid.lengte

/** Fractie langs het bovenste en het onderste deel. */
function fracties(k: Ketting, y: number): [number, number] {
  const lb = k.boven.lid.lengte
  return [y / lb, (y - lb) / k.onder.lid.lengte]
}

/** Maat uit de doorsnede (kolom 1 tot 3), vloeiend over het gewricht. */
function maat(k: Ketting, y: number, kolom: number): number {
  const [t1, t2] = fracties(k, y)
  const lb = k.boven.lid.lengte
  const a = tabel(k.boven.lid.doorsnede, grens(t1), kolom)
  const b = tabel(k.onder.lid.doorsnede, grens(t2), kolom)
  return a + (b - a) * glad(lb - 0.025, lb + 0.025, y)
}

function grootste(k: Ketting, y: number): number {
  return Math.max(maat(k, y, 1), maat(k, y, 2), maat(k, y, 3))
}

function bultOp(k: Ketting, y: number, hoek: number, kleding: boolean): number {
  const [t1, t2] = fracties(k, y)
  let som = 0
  for (const [lid, t] of [[k.boven.lid, t1], [k.onder.lid, t2]] as const) {
    for (const b of lid.bulten) {
      const h = kleding && b.h < 0 ? b.h * 0.3 : b.h
      som += h * klok((t - b.t) / b.dt) * klok(hoekVerschil(hoek, b.hoek) / b.dh)
    }
  }
  return som
}

/** Rijen dichter bij het gewricht, zodat de buiging glad blijft. */
function rijen(k: Ketting, tot: number): number[] {
  const lb = k.boven.lid.lengte
  const boord = k.sok ? lengteVan(k) - k.sok : -1
  const lijst: number[] = []
  let y = 0
  while (y < tot - 0.004) {
    lijst.push(y)
    const gewricht = 0.007 + 0.012 * glad(0.03, 0.09, Math.abs(y - lb))
    y += Math.min(gewricht, 0.004 + 0.015 * glad(0.008, 0.025, Math.abs(y - boord)))
  }
  lijst.push(tot)
  return lijst
}

/** Ringen van boven (met dop) tot `tot` (m), met een dop onderaan als `dicht`. */
function ringen(k: Ketting, tot: number, dicht: boolean, extra: (y: number) => number): RingDef[] {
  const lijst: RingDef[] = []
  // Een kledinglaag krijgt een eigen, iets grotere dop (geen samenvallende vlakken).
  const kb = (grootste(k, 0) + extra(0) * 1.6) * k.boven.lid.kapBoven
  for (let i = 1; i < KAP; i++) {
    const a = (i / KAP) * (Math.PI / 2)
    lijst.push({ y: -kb * Math.cos(a), k: Math.sin(a), extra: extra(0) })
  }
  for (const y of rijen(k, tot)) lijst.push({ y, k: 1, extra: extra(y) })
  if (dicht) {
    const l = lengteVan(k)
    const ko = grootste(k, l) * k.onder.lid.kapOnder
    for (let i = KAP - 1; i >= 1; i--) {
      const a = (i / KAP) * (Math.PI / 2)
      lijst.push({ y: l + ko * Math.cos(a), k: Math.sin(a), extra: extra(l) })
    }
  }
  return lijst
}

function macht(x: number): number {
  return Math.sign(x) * Math.abs(x) ** (2 / MACHT)
}

/** Punt op de ketting: hoek in graden, kleding dempt de groeven. */
function kettingPunt(k: Ketting, r: RingDef, hoek: number, schaal: number, uit: Vector3): Vector3 {
  const y = Math.min(lengteVan(k), Math.max(0, r.y))
  const rad = (hoek * Math.PI) / 180
  const s = Math.sin(rad)
  const c = Math.cos(rad)
  const bult = bultOp(k, r.y, hoek, r.extra > 0)
  const m = (maat(k, y, 1) * macht(s) + s * bult) * schaal + s * r.extra
  const z = ((c >= 0 ? maat(k, y, 2) : maat(k, y, 3)) * macht(c) + c * bult) * schaal + c * r.extra
  return uit.set(k.kant * m * r.k, r.y, z * r.k)
}

/** Aan welke botten een punt hangt: rond het gewricht aan het hulpbot. */
function botten(k: Ketting, y: number): { a: number; b?: number; w?: number } {
  const d = y - k.boven.lid.lengte
  if (y < k.kop.tot) return { a: k.boven.bot, b: k.kop.bot, w: k.kop.sterk * (1 - glad(-0.02, k.kop.tot, y)) }
  if (d <= -k.meng) return { a: k.boven.bot }
  if (d < 0) return { a: k.boven.bot, b: k.gewricht, w: glad(-k.meng, 0, d) }
  if (d < k.meng) return { a: k.gewricht, b: k.onder.bot, w: glad(0, k.meng, d) }
  return { a: k.onder.bot }
}

function deelWaarde(p: Palet, d: Deel, t: number, hoek: number): number {
  let m = 0
  for (const naam of d.delen) {
    const f = MASKERS[naam]
    const sterk = f ? sterkteVan(p, naam) : 0
    if (f && sterk > 0) m = Math.max(m, sterk * f(t, hoek))
  }
  return m
}

/** Spierwaarde en plooischaduw op hoogte y, vloeiend over het gewricht. */
function kenmerken(k: Ketting, y: number, hoek: number): { spier: number; ao: number } {
  const [t1, t2] = fracties(k, y)
  const s = glad(k.boven.lid.lengte - 0.01, k.boven.lid.lengte + 0.01, y)
  const mb = deelWaarde(k.p, k.boven, grens(t1), hoek)
  const mo = deelWaarde(k.p, k.onder, grens(t2), hoek)
  const ab = k.boven.ao?.(grens(t1), hoek) ?? 0
  const ao = k.onder.ao?.(grens(t2), hoek) ?? 0
  return { spier: mb + (mo - mb) * s, ao: ab + (ao - ab) * s }
}

/** Sok over de enkel: van de onderkant tot `sok` m erboven, met een geribde boord. */
function sokOp(k: Ketting, y: number): number {
  if (!k.sok) return 0
  return glad(lengteVan(k) - k.sok - 0.002, lengteVan(k) - k.sok + 0.002, y)
}

function huid(b: Bouwer, k: Ketting): void {
  const l = lengteVan(k)
  const lijst = ringen(k, l, true, (y) => {
    const sok = sokOp(k, y)
    return sok > 0 ? 0.0012 * sok + 0.0014 * klok((y - (l - (k.sok ?? 0) + 0.005)) / 0.006) : 0
  })
  const sokKleur = k.p.zool.clone().multiplyScalar(0.94)
  raster(b, {
    ringen: lijst.length,
    rond: ROND,
    punt: (i, j, uit) => kettingPunt(k, lijst[i], (j / ROND) * 360, 1, uit),
    info: (i, j): PuntInfo => {
      const y = lijst[i].y
      const { spier, ao } = kenmerken(k, y, (j / ROND) * 360)
      const sok = sokOp(k, y)
      if (sok > 0.5) return { kleur: sokKleur.clone().multiplyScalar(1 - ao * 0.5), spier: 0, ...botten(k, y) }
      return { kleur: kleurMet(k.p.huid, k.p, spier, false, ao), spier, ...botten(k, y) }
    },
  })
}

interface Laag {
  readonly tot: number
  readonly dikte: number
  /** Extra wijdte naar de zoom toe. */
  readonly wijd: number
  readonly kleur: 'shirt' | 'broek'
  /** Welke werkende spieren door deze laag heen kleuren. */
  readonly delen: readonly Lichaamsdeel[]
  /** Plooien: [hoek, diepte] van zachte, schuine plooien in de stof. */
  readonly plooien: readonly (readonly [number, number])[]
}

/** Zachte plooien als lichte golving in de dikte van de stof. */
function plooi(laag: Laag, y: number, hoek: number): number {
  let som = 0
  const t = y / laag.tot
  for (const [h, diep] of laag.plooien) {
    som += diep * klok(hoekVerschil(hoek - t * 25, h) / 22) * klok((t - 0.55) / 0.5)
  }
  return som
}

/** Een strakke kledinglaag met een omgeslagen zoom en een stiksel erboven. */
function kleding(b: Bouwer, k: Ketting, laag: Laag): void {
  const extra = (y: number) => laag.dikte + laag.wijd * glad(laag.tot * 0.45, laag.tot, y)
  const lijst = ringen(k, laag.tot, false, extra)
  const zoom = lijst.length
  lijst.push({ y: laag.tot + 0.0015, k: 1, extra: 0.0012 })
  const basis = laag.kleur === 'shirt' ? k.p.shirt : k.p.broek
  raster(b, {
    ringen: lijst.length,
    rond: ROND,
    openEind: true,
    punt: (i, j, uit) => {
      const hoek = (j / ROND) * 360
      const r = lijst[i]
      const vouw = r.y > 0 && i < zoom ? plooi(laag, r.y, hoek) : 0
      return kettingPunt(k, { ...r, extra: r.extra + vouw }, hoek, 1, uit)
    },
    info: (i, j): PuntInfo => {
      const hoek = (j / ROND) * 360
      const y = lijst[i].y
      const t = grens(y / k.boven.lid.lengte)
      const spier = 0.75 * deelWaarde(k.p, { ...k.boven, delen: laag.delen }, t, hoek)
      // Stiksel net boven de zoom (lichte lijn), de zoom zelf iets donkerder.
      const vanZoom = laag.tot - y
      const stiksel = klok((vanZoom - 0.014) / 0.0035)
      const ao = i >= zoom ? 0.12 : 0.04 * glad(0.006, 0, vanZoom) - 0.18 * stiksel
      return { kleur: kleurMet(basis, k.p, spier, true, ao), spier, ...botten(k, y) }
    },
  })
}

const AO_DIJ: Masker = (t, h) => 0.22 * klok(t / 0.2) * klok(hoekVerschil(h, 95) / 60)
const AO_KNIEHOLTE: Masker = (t, h) => 0.14 * klok(t / 0.12) * klok(hoekVerschil(h, 180) / 55)
const AO_OKSEL: Masker = (t, h) => 0.26 * klok(t / 0.22) * klok(hoekVerschil(h, 90) / 55)
const AO_ELLEBOOG: Masker = (t, h) => 0.1 * klok(t / 0.1) * klok(hoekVerschil(h, 0) / 50)

export function bouwBenen(b: Bouwer, stof: Bouwer, p: Palet): void {
  ;[1, -1].forEach((kant, i) => {
    const been: Ketting = {
      boven: { lid: DIJ, bot: BOT.dij[i], delen: ['dij', 'hamstring', 'bil'], ao: AO_DIJ },
      onder: { lid: SCHEEN, bot: BOT.scheen[i], delen: ['kuit'], ao: AO_KNIEHOLTE },
      gewricht: BOT.knie[i],
      kop: { bot: BOT.heup[i], sterk: 0.4, tot: 0.12 },
      kant,
      p,
      meng: 0.055,
      sok: 0.06,
    }
    huid(b, been)
    kleding(stof, been, {
      tot: DIJ.lengte * 0.4,
      dikte: 0.0045,
      wijd: 0.007,
      kleur: 'broek',
      delen: ['dij', 'hamstring', 'bil'],
      plooien: [[-70, 0.0022], [60, 0.0018], [175, 0.0016]],
    })
  })
}

export function bouwArmen(b: Bouwer, stof: Bouwer, p: Palet): void {
  ;[1, -1].forEach((kant, i) => {
    const arm: Ketting = {
      boven: { lid: BOVENARM, bot: BOT.bovenarm[i], delen: ['bovenarm', 'schouder'], ao: AO_OKSEL },
      onder: { lid: ONDERARM, bot: BOT.onderarm[i], delen: ['onderarm'], ao: AO_ELLEBOOG },
      gewricht: BOT.elleboog[i],
      kop: { bot: BOT.schouder[i], sterk: 0.6, tot: 0.1 },
      kant,
      p,
      meng: 0.045,
    }
    huid(b, arm)
    kleding(stof, arm, {
      tot: BOVENARM.lengte * 0.37,
      dikte: 0.0028,
      wijd: 0.0035,
      kleur: 'shirt',
      delen: ['schouder'],
      plooien: [[60, 0.0016], [-120, 0.0012]],
    })
  })
}
