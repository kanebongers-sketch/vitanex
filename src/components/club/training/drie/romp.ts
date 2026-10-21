// ─── Fit Factory Club, 3D-oefenbeelden: romp, nek en kleding ────────────────
// De romp is een vorm van ringen langs de wervelkolom (kruis tot in het hoofd),
// in de bindhouding: rechtop, heupgewrichten op hoogte 0. Per hoogte een
// doorsnede plus spieren als zachte bulten: borst, buikspieren, schuine
// buikspieren, lats, rugstrekkers, schouderbladen, monnikskap en bilspieren.
// Het skelet mengt elke ring tussen bekken, onderrug, borst en hoofd, zodat de
// rug vloeiend buigt. Het shirt en de broek zijn eigen lagen over de huid.

import { Vector3 } from 'three'
import { glad, hoekVerschil, klok, raster, tabel, type Bouwer, type PuntInfo } from './bouwer'
import { nekKleur } from './hoofd'
import type { Lichaamsdeel } from '@/lib/club/training/3d/typen'
import { kleurMet, sterkteVan, type Palet } from './palet'
import { BIND, BOT } from './skelet'

/** Rijen [hoogte s, halve breedte, voorkant, achterkant, midden voor/achter]. */
const DOORSNEDE: readonly (readonly number[])[] = [
  [-0.115, 0.05, 0.035, 0.045, -0.01],
  [-0.095, 0.125, 0.068, 0.092, -0.012],
  [-0.05, 0.165, 0.088, 0.122, -0.012],
  [0.0, 0.17, 0.094, 0.118, -0.012],
  [0.06, 0.158, 0.094, 0.098, -0.012],
  [0.12, 0.145, 0.096, 0.086, -0.012],
  [0.18, 0.146, 0.1, 0.086, -0.013],
  [0.25, 0.158, 0.108, 0.091, -0.014],
  [0.32, 0.173, 0.118, 0.1, -0.016],
  [0.38, 0.186, 0.124, 0.106, -0.018],
  [0.43, 0.186, 0.116, 0.106, -0.021],
  // Schouders: de monnikskap loopt in een vloeiende, licht bolle lijn van de nek
  // naar de schouderkop, zodat er bij geheven armen geen knik of knop ontstaat.
  [0.47, 0.18, 0.1, 0.101, -0.024],
  [0.5, 0.164, 0.076, 0.091, -0.026],
  [0.525, 0.136, 0.06, 0.078, -0.026],
  [0.548, 0.098, 0.052, 0.066, -0.022],
  [0.565, 0.06, 0.05, 0.057, -0.018],
  [0.58, 0.051, 0.05, 0.054, -0.016],
  [0.63, 0.048, 0.048, 0.052, -0.012],
  [0.67, 0.045, 0.044, 0.047, -0.01],
]

interface Bult {
  readonly s: number
  readonly ds: number
  readonly hoek: number
  readonly dh: number
  readonly h: number
  /** Ook aan de andere kant (hoek gespiegeld). */
  readonly paar?: boolean
}

const BULTEN: readonly Bult[] = [
  // Borst, borstbeen, sleutelbeenderen
  { s: 0.398, ds: 0.072, hoek: 30, dh: 34, h: 0.017, paar: true },
  { s: 0.325, ds: 0.024, hoek: 32, dh: 36, h: -0.004, paar: true },
  { s: 0.4, ds: 0.075, hoek: 0, dh: 8, h: -0.004 },
  { s: 0.482, ds: 0.016, hoek: 24, dh: 30, h: 0.004, paar: true },
  // Buikspieren, witte lijn, schuine buikspieren
  { s: 0.276, ds: 0.026, hoek: 12, dh: 10, h: 0.0035, paar: true },
  { s: 0.216, ds: 0.026, hoek: 12, dh: 10, h: 0.0035, paar: true },
  { s: 0.156, ds: 0.026, hoek: 12, dh: 10, h: 0.003, paar: true },
  { s: 0.095, ds: 0.032, hoek: 11, dh: 11, h: 0.0022, paar: true },
  { s: 0.2, ds: 0.13, hoek: 0, dh: 5, h: -0.003 },
  { s: 0.1, ds: 0.07, hoek: 72, dh: 25, h: 0.006, paar: true },
  { s: 0.3, ds: 0.04, hoek: 62, dh: 12, h: 0.003, paar: true },
  // Rug: lats, wervelgroef, rugstrekkers, schouderbladen, monnikskap
  { s: 0.34, ds: 0.11, hoek: 118, dh: 32, h: 0.015, paar: true },
  { s: 0.25, ds: 0.22, hoek: 180, dh: 9, h: -0.007 },
  { s: 0.14, ds: 0.1, hoek: 166, dh: 12, h: 0.006, paar: true },
  { s: 0.41, ds: 0.06, hoek: 148, dh: 22, h: 0.007, paar: true },
  { s: 0.505, ds: 0.05, hoek: 140, dh: 46, h: 0.01, paar: true },
  // Deltaspier en schouderdak op de romp: blijft staan als de arm omhoog gaat.
  { s: 0.478, ds: 0.045, hoek: 90, dh: 34, h: 0.009, paar: true },
  // Bilspieren en bilplooi
  { s: -0.03, ds: 0.068, hoek: 152, dh: 33, h: 0.022, paar: true },
  { s: -0.085, ds: 0.02, hoek: 160, dh: 40, h: -0.006, paar: true },
]

const ROND = 64

/**
 * Hoe hoekig de doorsnede is: de romp is wat vierkant, de schouders ronder. De
 * nek weer als het hoofd (macht 2,6, zie hoofd-vorm.ts), zodat de nek van romp
 * en hoofd precies samenvallen.
 */
function machtOp(s: number): number {
  return 2.6 - 0.45 * glad(0.43, 0.5, s) * (1 - glad(0.515, 0.545, s))
}

function macht(x: number, m: number): number {
  return Math.sign(x) * Math.abs(x) ** (2 / m)
}

/** Hoe sterk bulten en groeven door een laag heen te zien zijn. */
interface Demping {
  readonly bult: number
  readonly groef: number
}

const HUID: Demping = { bult: 1, groef: 1 }
const STOF: Demping = { bult: 0.85, groef: 0.25 }

function bultOp(s: number, hoek: number, d: Demping): number {
  let som = 0
  for (const b of BULTEN) {
    const sterk = b.h > 0 ? d.bult : d.groef
    const hs = klok((s - b.s) / b.ds)
    if (hs === 0) continue
    let hh = klok(hoekVerschil(hoek, b.hoek) / b.dh)
    if (b.paar) hh = Math.max(hh, klok(hoekVerschil(hoek, -b.hoek) / b.dh))
    som += b.h * sterk * hs * hh
  }
  return som
}

/** Punt op de romp in bindruimte. */
function rompPunt(s: number, hoek: number, extra: number, d: Demping, uit: Vector3): Vector3 {
  const r = (hoek * Math.PI) / 180
  const sx = Math.sin(r)
  const cz = Math.cos(r)
  const b = bultOp(s, hoek, d) + extra
  const diepte = cz >= 0 ? tabel(DOORSNEDE, s, 2) : tabel(DOORSNEDE, s, 3)
  const m = machtOp(s)
  return uit.set(tabel(DOORSNEDE, s, 1) * macht(sx, m) + sx * b, s, tabel(DOORSNEDE, s, 4) + diepte * macht(cz, m) + cz * b)
}

/**
 * Aan welke botten een punt hangt (overgangen rond de wervels). Hoog en opzij
 * (monnikskap en schouderdak) hangt de romp deels aan het schouderdak, dat met
 * een geheven arm meegaat; de nek volgt het hoofd.
 */
function botten(s: number, x = 0): { a: number; b: number; w: number } {
  const opzij = Math.abs(x)
  // Schouderdak: hoog en opzij hangt de romp deels aan het schoudergewricht.
  const dak = glad(0.4, 0.47, s) * glad(0.095, 0.16, opzij)
  if (dak > 0) return { a: BOT.borst, b: BOT.dak[x > 0 ? 0 : 1], w: dak }
  if (s > 0.5) return { a: BOT.borst, b: BOT.hoofd, w: glad(0.53, 0.585, s) }
  if (s > 0.16) return { a: BOT.lende, b: BOT.borst, w: glad(BIND.borst.y - 0.05, BIND.borst.y + 0.05, s) }
  return { a: BOT.bekken, b: BOT.lende, w: glad(BIND.lende.y - 0.05, BIND.lende.y + 0.05, s) }
}

type Zone = (s: number, a: number) => number

/**
 * Waar een werkende spier op de romp ligt: s is de hoogte, a de hoek vanaf de
 * voorkant (0 voor, 90 opzij, 180 achter, beide kanten gelijk).
 */
const ZONES: Partial<Record<Lichaamsdeel, Zone>> = {
  romp: (s, a) => glad(0.05, 0.1, s) * (1 - glad(0.3, 0.34, s)) * klok(a / 75),
  borst: (s, a) => klok((s - 0.4) / 0.095) * klok((a - 26) / 52),
  // Lats als een V die naar de taille smaller wordt, plus monnikskap en
  // ruitvormige spieren tussen de schouderbladen.
  rug: (s, a) =>
    Math.max(
      klok((s - 0.33) / 0.14) * klok((a - (160 - 48 * glad(0.2, 0.43, s))) / 40),
      klok((s - 0.44) / 0.11) * glad(122, 152, a),
    ),
  // Rugstrekkers: twee strengen naast de wervelkolom, van het bekken tot de
  // onderste ribben.
  onderrug: (s, a) => klok((s - 0.12) / 0.115) * klok((a - 180) / 36),
  // Bilspier: van de bekkenkam tot de bilplooi, het dikste deel achter het heupgewricht.
  bil: (s, a) => klok((s + 0.03) / 0.1) * glad(100, 135, a),
  schouder: (s, a) => klok((s - 0.48) / 0.05) * klok((a - 90) / 35),
}

function spierOp(p: Palet, s: number, hoek: number): number {
  const a = Math.abs(hoekVerschil(hoek, 0))
  let m = 0
  for (const [deel, zone] of Object.entries(ZONES) as [Lichaamsdeel, Zone][]) {
    const sterk = sterkteVan(p, deel)
    if (sterk > 0) m = Math.max(m, sterk * zone(s, a))
  }
  return m
}

function oksel(s: number, hoek: number): number {
  const a = Math.abs(hoekVerschil(hoek, 0))
  return 0.22 * klok((s - 0.44) / 0.06) * klok((a - 92) / 22)
}

const hoekVan = (j: number) => (j / ROND) * 360
const NEK_Q = new Vector3()

/** Huid van de borst omhoog, met nek tot in het hoofd. */
function huid(b: Bouwer, p: Palet): void {
  const van = 0.36
  const tot = 0.67
  const n = 22
  raster(b, {
    ringen: n,
    rond: ROND,
    openBegin: true,
    punt: (i, j, uit) => rompPunt(van + ((tot - van) * i) / (n - 1), hoekVan(j), 0, HUID, uit),
    info: (i, j, q): PuntInfo => {
      const s = van + ((tot - van) * i) / (n - 1)
      const m = spierOp(p, s, hoekVan(j))
      // In de nek dezelfde huidkleur en schaduw als het hoofd: geen naad.
      const nek = glad(0.54, 0.556, s)
      const basis = nek > 0 ? p.huid.clone().lerp(nekKleur(p, NEK_Q.copy(q).sub(BIND.hoofd)), nek) : p.huid
      return { kleur: kleurMet(basis, p, m, false, oksel(s, hoekVan(j))), spier: m, ...botten(s, q.x) }
    },
  })
}

/** Halslijn: voor iets lager dan achter. */
function hals(hoek: number): number {
  const a = Math.abs(hoekVerschil(hoek, 0)) / 180
  return 0.538 + 0.014 * a * a
}

function shirt(b: Bouwer, p: Palet): void {
  const zoom = 0.068
  const n = 34
  const extra = (s: number) => 0.005 + 0.008 * (1 - glad(0.07, 0.24, s))
  // Ring 0 en de laatste ring zijn de binnenrand van zoom en kraag.
  const hoogte = (i: number, hoek: number) => {
    if (i === 0) return zoom + 0.004
    if (i === n - 1) return hals(hoek) - 0.006
    return zoom + ((hals(hoek) - zoom) * (i - 1)) / (n - 3)
  }
  raster(b, {
    ringen: n,
    rond: ROND,
    openBegin: true,
    openEind: true,
    punt: (i, j, uit) => {
      const s = hoogte(i, hoekVan(j))
      const rand = i === 0 || i === n - 1
      return rompPunt(s, hoekVan(j), rand ? 0.0015 : extra(s) + (i === n - 2 ? 0.002 : 0), STOF, uit)
    },
    info: (i, j, q): PuntInfo => {
      const s = hoogte(i, hoekVan(j))
      const m = spierOp(p, s, hoekVan(j))
      const rand = i <= 1 || i >= n - 2 ? 0.16 : 0
      return { kleur: kleurMet(p.shirt, p, m, true, rand + oksel(s, hoekVan(j))), spier: m * 0.7, ...botten(s, q.x) }
    },
  })
}

function broek(b: Bouwer, p: Palet): void {
  const top = 0.118
  const onder = -0.112
  const n = 20
  const hoogte = (i: number) => (i === 0 ? top - 0.004 : top - ((top - onder) * (i - 1)) / (n - 2))
  raster(b, {
    ringen: n,
    rond: ROND,
    openBegin: true,
    punt: (i, j, uit) => {
      const s = hoogte(i)
      const band = i === 0 ? 0.0015 : 0.008 + 0.004 * glad(top - 0.03, top - 0.01, s)
      return rompPunt(s, hoekVan(j), band, STOF, uit)
    },
    info: (i, j): PuntInfo => {
      const s = hoogte(i)
      const m = spierOp(p, s, hoekVan(j))
      const band = i <= 2 ? 0.12 : 0
      return { kleur: kleurMet(p.broek, p, m, true, band), spier: m * 0.7, ...botten(s) }
    },
  })
}

export function bouwRomp(b: Bouwer, p: Palet): void {
  huid(b, p)
}

export function bouwKleding(b: Bouwer, p: Palet): void {
  shirt(b, p)
  broek(b, p)
}
