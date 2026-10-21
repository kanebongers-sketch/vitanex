// ─── Fit Factory Club, 3D-oefenbeelden: vorm van het hoofd ──────────────────
// Het hoofd is een afstandsveld: schedel, voorhoofd, wenkbrauwboog,
// oogkassen, jukbeenderen, neus met neusvleugels, lippen, kaak, kin en nek
// als zachte vormen die vloeiend in elkaar overgaan. Het raster van de huid
// wordt vanuit het midden van het hoofd op dat veld geprojecteerd. Alles in
// hoofdruimte (meter), een keer berekend en daarna hergebruikt.

import type { Vector3 } from 'three'
import { glad, tabel } from './bouwer'

/** Midden van waaruit we projecteren. */
export const MIDDEN = { x: 0, y: 0.158, z: 0.012 } as const

/** Rechteroog (links gespiegeld): midden van de oogbol en straal. */
export const OOG = { x: 0.0318, y: 0.1565, z: 0.0705, r: 0.0118 } as const

function ell(px: number, py: number, pz: number, cx: number, cy: number, cz: number, rx: number, ry: number, rz: number): number {
  const x = (px - cx) / rx
  const y = (py - cy) / ry
  const z = (pz - cz) / rz
  const k0 = Math.sqrt(x * x + y * y + z * z)
  const k1 = Math.sqrt((x * x) / (rx * rx) + (y * y) / (ry * ry) + (z * z) / (rz * rz))
  return k1 < 1e-9 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1
}

function bol(px: number, py: number, pz: number, cx: number, cy: number, cz: number, r: number): number {
  return Math.hypot(px - cx, py - cy, pz - cz) - r
}

/** Afgeronde kegel van a (straal ra) naar b (straal rb). */
function kegel(
  px: number, py: number, pz: number,
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  ra: number, rb: number,
): number {
  const [qx, qy, qz] = [px - ax, py - ay, pz - az]
  const [vx, vy, vz] = [bx - ax, by - ay, bz - az]
  const h = Math.min(1, Math.max(0, (qx * vx + qy * vy + qz * vz) / (vx * vx + vy * vy + vz * vz)))
  return Math.hypot(qx - vx * h, qy - vy * h, qz - vz * h) - (ra + (rb - ra) * h)
}

function smin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k
  return Math.min(a, b) - h * h * k * 0.25
}

/** Zacht wegsnijden van b uit a. */
function weg(a: number, b: number, k: number): number {
  return -smin(-a, b, k)
}

function neus(x: number, ax: number, y: number, z: number): number {
  let n = kegel(x, y, z, 0, 0.162, 0.0895, 0, 0.1258, 0.1074, 0.0046, 0.0066)
  n = smin(n, bol(x, y, z, 0, 0.1202, 0.1074, 0.0077), 0.008)
  n = smin(n, ell(ax, y, z, 0.0101, 0.1134, 0.0975, 0.0052, 0.0052, 0.0066), 0.0075)
  return n
}

/** Lijn van de mondspleet (hoogte) en hoe ver de lippen naar voren staan, op breedte x. */
function mondLijn(ax: number): number {
  return 0.0866 - 0.0016 * (ax / 0.024) ** 2
}

function mond(d: number, x: number, ax: number, y: number, z: number): number {
  // Bovenlip, de twee bultjes onder de cupidoboog en de onderlip.
  // De lippen buigen mee met de tandboog: naar de mondhoeken toe naar achteren.
  const zb = z + 0.011 * (ax / 0.024) ** 2
  let m = smin(d, ell(x, y, zb, 0, 0.0914, 0.0934, 0.0236, 0.0054, 0.0072), 0.006)
  m = smin(m, ell(ax, y, zb, 0.0046, 0.0946, 0.0938, 0.006, 0.0022, 0.0046), 0.004)
  m = smin(m, ell(x, y, zb, 0, 0.0812, 0.0906, 0.0202, 0.0062, 0.0078), 0.006)
  // Mondhoeken, gootje boven de lip en de kuil onder de onderlip.
  m = weg(m, bol(ax, y, z, 0.0242, 0.0866, 0.0838, 0.0017), 0.003)
  m = weg(m, ell(x, y, z, 0, 0.1032, 0.0995, 0.003, 0.0062, 0.003), 0.003)
  m = weg(m, ell(x, y, z, 0, 0.0712, 0.0952, 0.013, 0.0034, 0.0016), 0.006)
  // Mondspleet: een ondiepe groef die de lippen volgt.
  const groef = ell(x, y - mondLijn(ax) + 0.0866, z + 0.011 * (ax / 0.024) ** 2, 0, 0.0866, 0.1012, 0.0242, 0.0009, 0.0062)
  return weg(m, groef, 0.0014)
}

/** Nek: [hoogte, halve breedte, voorkant, achterkant, midden]; volgt de nek van de romp (romp.ts). */
const NEK: readonly (readonly number[])[] = [
  [0.025, 0.066, 0.05, 0.058, -0.002],
  [0.045, 0.0585, 0.0495, 0.0565, 0.002],
  [0.06, 0.0515, 0.0505, 0.0545, 0.004],
  [0.11, 0.0485, 0.0485, 0.0525, 0.008],
  [0.15, 0.0455, 0.0445, 0.0475, 0.01],
]

/** Zelfde vorm als de romp: een superellips met macht 2,6. */
const NEK_MACHT = 2.6

function nek(x: number, y: number, z: number): number {
  const dz = z - tabel(NEK, y, 4)
  const hx = tabel(NEK, y, 1)
  const hz = dz > 0 ? tabel(NEK, y, 2) : tabel(NEK, y, 3)
  const r = (Math.abs(x / hx) ** NEK_MACHT + Math.abs(dz / hz) ** NEK_MACHT) ** (1 / NEK_MACHT)
  return Math.max((r - 1) * Math.min(hx, hz), y - 0.17, 0.005 - y)
}

/** Hoe sterk een punt in de mondspleet ligt (0 tot 1). */
export function mondGewicht(x: number, y: number, z: number): number {
  const lijn = mondLijn(Math.abs(x))
  const ax = Math.abs(x)
  const breed = glad(0.0252, 0.021, ax) * (1 - 0.35 * glad(0.018, 0.025, ax))
  const voor = Math.min(1, Math.max(0, (z + 0.011 * (ax / 0.024) ** 2 - 0.083) / 0.008))
  return Math.exp(-(((y - lijn) / (0.0012 + 0.0006 * glad(0.012, 0.024, ax))) ** 2)) * breed * voor
}

/** Afstand tot de huid (negatief = binnen). */
export function afstand(x: number, y: number, z: number): number {
  return Math.min(huidZonderOog(x, y, z), bol(Math.abs(x), y, z, OOG.x, OOG.y, OOG.z, OOG.r - 0.0012))
}

/** Afstand tot de huid zonder de oogbollen (voor oogleden die in de huid opgaan). */
export function huidZonderOog(x: number, y: number, z: number): number {
  const ax = Math.abs(x)
  let d = ell(x, y, z, 0, 0.19, -0.01, 0.0735, 0.082, 0.097)
  d = smin(d, ell(x, y, z, 0, 0.193, 0.028, 0.063, 0.06, 0.068), 0.03)
  d = smin(d, ell(x, y, z, 0, 0.132, 0.032, 0.0555, 0.052, 0.06), 0.03)
  d = smin(d, ell(ax, y, z, 0.0465, 0.1405, 0.057, 0.02, 0.0125, 0.022), 0.016)
  d = smin(d, ell(ax, y, z, 0.0515, 0.157, 0.062, 0.011, 0.019, 0.013), 0.012)
  d = smin(d, ell(ax, y, z, 0.026, 0.1725, 0.079, 0.027, 0.0095, 0.017), 0.014)
  // Mondpartij en de ronding naast de mond.
  d = smin(d, ell(x, y, z, 0, 0.1, 0.05, 0.036, 0.032, 0.046), 0.024)
  d = smin(d, ell(ax, y, z, 0.021, 0.088, 0.0625, 0.014, 0.019, 0.019), 0.016)
  // Onderkaak: van de kaakhoek naar de kin, en omhoog naar voor het oor.
  d = smin(d, kegel(ax, y, z, 0.0418, 0.0815, -0.004, 0.0185, 0.0556, 0.0705, 0.0094, 0.0102), 0.013)
  d = smin(d, kegel(ax, y, z, 0.0425, 0.0835, -0.0045, 0.0448, 0.124, 0.0055, 0.0082, 0.0088), 0.012)
  d = smin(d, ell(ax, y, z, 0.0375, 0.115, 0.026, 0.015, 0.029, 0.036), 0.018)
  d = smin(d, ell(ax, y, z, 0.031, 0.124, 0.062, 0.019, 0.021, 0.026), 0.018)
  d = smin(d, ell(x, y, z, 0, 0.0605, 0.0812, 0.0185, 0.0142, 0.0158), 0.016)
  // Nek: aan de voorkant een strakke hoek onder de kin, achter vloeiend.
  d = smin(d, nek(x, y, z), 0.011 + 0.015 * glad(0.045, -0.01, z))
  d = weg(d, ell(ax, y, z, 0.075, 0.177, 0.038, 0.01, 0.02, 0.022), 0.015)
  d = weg(d, ell(ax, y, z, OOG.x, 0.158, 0.0875, 0.0178, 0.0125, 0.015), 0.008)
  d = weg(d, ell(x, y, z, 0, 0.1665, 0.1005, 0.009, 0.0075, 0.0055), 0.007)
  d = smin(d, neus(x, ax, y, z), 0.01)
  d = weg(d, ell(ax, y, z, 0.0058, 0.1086, 0.1052, 0.0028, 0.0019, 0.0054), 0.002)
  return mond(d, x, ax, y, z)
}

interface LipMaat {
  /** Hoeveel het punt binnen het rode deel ligt (meter, negatief = erbuiten). */
  readonly binnen: number
  /** 1 aan de voorkant van het gezicht, 0 naar binnen. */
  readonly voor: number
  /** Boven (1) of onder (0) de mondspleet. */
  readonly boven: number
}

function lipMaat(x: number, y: number, z: number): LipMaat {
  const ax = Math.abs(x)
  const lijn = mondLijn(ax)
  const boog = Math.exp(-(((ax - 0.0052) / 0.0042) ** 2)) - 0.45 * Math.exp(-((ax / 0.0022) ** 2))
  const boven = lijn + (0.0054 + 0.0016 * boog) * Math.sqrt(Math.max(0, 1 - (ax / 0.024) ** 2))
  const onder = lijn - 0.0082 * Math.sqrt(Math.max(0, 1 - (ax / 0.0206) ** 2))
  return {
    binnen: Math.min(boven - y, y - onder),
    voor: Math.min(1, Math.max(0, (z + 0.011 * (ax / 0.024) ** 2 - 0.083) / 0.006)),
    boven: y > lijn ? 1 : 0,
  }
}

/** Hoe sterk een punt op de lippen ligt (0 tot 1): het rode deel, met cupidoboog. */
export function lipGewicht(x: number, y: number, z: number): number {
  const m = lipMaat(x, y, z)
  const rand = 0.0009
  const t = Math.min(1, Math.max(0, (m.binnen + rand) / (2 * rand)))
  return t * t * (3 - 2 * t) * m.voor * glad(0.0235, 0.0185, Math.abs(x))
}

/** Lichte rand net buiten het rode deel (vooral langs de bovenlip). */
export function lipRand(x: number, y: number, z: number): number {
  const m = lipMaat(x, y, z)
  return Math.exp(-(((m.binnen + 0.0014) / 0.0008) ** 2)) * m.voor * (0.45 + 0.55 * m.boven)
}

/**
 * Punt op de huid in richting (dx, dy, dz) vanuit het midden, plus `extra`
 * langs die richting. Loopt van buiten naar binnen tot de huid.
 */
/** Lengte van de laatst geprojecteerde straal (om de volgende sneller te laten starten). */
export const STRAAL = { t: 0.16 }

export function projecteer(dx: number, dy: number, dz: number, extra: number, uit: Vector3, start = 0.16): Vector3 {
  // Voor neus en mond kijken we vanuit een lager punt, zodat de stralen niet
  // langs de neusvleugels en lippen schampen.
  // Het punt hangt alleen af van de hoek vanaf de kruin: rond het hoofd
  // delen de stralen een oorsprong, zo kunnen ze elkaar niet kruisen.
  const polair = Math.acos(Math.max(-1, Math.min(1, dy)))
  const f = stap(1.35, 2.3, polair)
  const g = stap(1.95, 2.45, polair)
  const [ox, oy, oz] = [MIDDEN.x, MIDDEN.y - 0.03 * f - 0.025 * g, MIDDEN.z + 0.012 * f + 0.012 * g]
  let t = start
  if (t < 0.16 && afstand(ox + dx * t, oy + dy * t, oz + dz * t) < 0) t = 0.16
  let vorige = t
  for (let k = 0; k < 400 && t > 0.005; k++) {
    const d = afstand(ox + dx * t, oy + dy * t, oz + dz * t)
    if (d < 0) {
      let [a, b] = [t, vorige]
      for (let s = 0; s < 16; s++) {
        const m = (a + b) / 2
        if (afstand(ox + dx * m, oy + dy * m, oz + dz * m) < 0) a = m
        else b = m
      }
      t = b
      break
    }
    vorige = t
    t -= Math.min(0.003, Math.max(d * 0.5, 0.00025))
  }
  STRAAL.t = t
  t += extra
  return uit.set(ox + dx * t, oy + dy * t, oz + dz * t)
}

function stap(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const E = 0.0004

/** Normaal van het veld in p (genormaliseerd). */
export function normaal(p: Vector3, uit: Vector3): Vector3 {
  const nx = afstand(p.x + E, p.y, p.z) - afstand(p.x - E, p.y, p.z)
  const ny = afstand(p.x, p.y + E, p.z) - afstand(p.x, p.y - E, p.z)
  const nz = afstand(p.x, p.y, p.z + E) - afstand(p.x, p.y, p.z - E)
  return uit.set(nx, ny, nz).normalize()
}

const N = { x: 0, y: 0, z: 0 }

type Veld = (x: number, y: number, z: number) => number

/** Legt punt p (in plaats) precies op de huid, langs de normaal van het veld. */
export function naarHuid(p: Vector3, veld: Veld = afstand): Vector3 {
  for (let k = 0; k < 6; k++) {
    const d = veld(p.x, p.y, p.z)
    if (Math.abs(d) < 0.00002) break
    N.x = veld(p.x + E, p.y, p.z) - veld(p.x - E, p.y, p.z)
    N.y = veld(p.x, p.y + E, p.z) - veld(p.x, p.y - E, p.z)
    N.z = veld(p.x, p.y, p.z + E) - veld(p.x, p.y, p.z - E)
    const l = Math.hypot(N.x, N.y, N.z) || 1
    p.set(p.x - (N.x / l) * d, p.y - (N.y / l) * d, p.z - (N.z / l) * d)
  }
  return p
}

/** Omgevingsschaduw in plooien en kuilen (0 = open, 1 = diep). */
export function occlusie(p: Vector3, n: Vector3): number {
  let som = 0
  let w = 1
  for (let k = 1; k <= 5; k++) {
    const h = 0.0032 * k
    som += w * (h - afstand(p.x + n.x * h, p.y + n.y * h, p.z + n.z * h))
    w *= 0.7
  }
  return Math.min(1, Math.max(0, som * 8))
}
