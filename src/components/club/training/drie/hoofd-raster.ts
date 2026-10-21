// ─── Fit Factory Club, 3D-oefenbeelden: raster van de huid van het hoofd ────
// Ringen van de kruin naar de hals, met de meeste ringen bij neus, mond en
// kin, en de meeste punten rond aan de voorkant. Per kolom wordt het pad over
// de huid eerst fijn gemeten: waar een straal over een plooi heen springt
// (onder de onderlip, langs de neusvleugels) komen extra ringen, die daarna
// precies op de huid worden gelegd. Zo ontstaan geen lange smalle driehoeken.
// Alles wordt een keer berekend en daarna hergebruikt.

import { Vector3 } from 'three'
import { naarHuid, normaal, occlusie, projecteer, STRAAL } from './hoofd-vorm'

export const RINGEN = 74
export const ROND = 64

/** Fijne stappen per ring bij het meten. */
const FIJN = 3

/** Hoek vanaf de kruin (graden) per ring (0 tot 1). */
const POLAIR: readonly (readonly number[])[] = [
  [0, 5],
  [0.12, 58],
  [0.22, 86],
  [0.32, 104],
  [0.66, 138],
  [0.8, 150],
  [1, 168],
]

function lineair(rijen: readonly (readonly number[])[], x: number): number {
  for (let k = 1; k < rijen.length; k++) {
    if (x <= rijen[k][0]) {
      const t = (x - rijen[k - 1][0]) / (rijen[k][0] - rijen[k - 1][0])
      return rijen[k - 1][1] + (rijen[k][1] - rijen[k - 1][1]) * t
    }
  }
  return rijen[rijen.length - 1][1]
}

/** Verdeling met meer punten aan de voorkant (u van 0 tot 1). */
function dichter(u: number, c: number): number {
  const w = (x: number) => x - (c * Math.sin(2 * Math.PI * x)) / (2 * Math.PI)
  return w(u) / w(1)
}

const polair = (u: number) => (lineair(POLAIR, u) * Math.PI) / 180

export interface Huidvorm {
  readonly punten: Float32Array
  readonly schaduw: Float32Array
}

let VORM: Huidvorm | null = null

/** Extra ringen rond de lippen, de neuspunt en de ogen, waar de vorm het fijnst is. */
function detail(p: Vector3): number {
  if (p.z < 0.06) return 1
  const breed = Math.exp(-((p.x / 0.03) ** 2))
  const lip = Math.exp(-(((p.y - 0.087) / 0.011) ** 2))
  const neus = Math.exp(-(((p.y - 0.114) / 0.009) ** 2))
  const oog = Math.exp(-(((Math.abs(p.x) - 0.033) / 0.02) ** 2) - ((p.y - 0.156) / 0.011) ** 2)
  return 1 + breed * (1.7 * lip + 0.5 * neus) + 0.7 * oog
}

/** Meet een kolom fijn en geeft de opgetelde kosten per fijn punt. */
function meetKolom(b: number, fijn: Vector3[], kosten: Float64Array): void {
  const n = fijn.length
  for (let k = 0; k < n; k++) {
    const a = polair(k / (n - 1))
    const start = k === 0 ? 0.16 : Math.min(0.16, STRAAL.t + 0.03)
    projecteer(Math.sin(a) * Math.sin(b), Math.cos(a), Math.sin(a) * Math.cos(b), 0, fijn[k], start)
  }
  kosten[0] = 0
  for (let k = 1; k < n; k++) {
    const verwacht = 0.1 * (polair(k / (n - 1)) - polair((k - 1) / (n - 1)))
    kosten[k] = kosten[k - 1] + Math.max(1, fijn[k].distanceTo(fijn[k - 1]) / (1.8 * verwacht)) * detail(fijn[k])
  }
}

/** Fractionele fijne index waar de kost `doel` bereikt wordt. */
function indexBij(doel: number, kosten: Float64Array): number {
  let k = 1
  while (k < kosten.length - 1 && kosten[k] < doel) k++
  const t = (doel - kosten[k - 1]) / (kosten[k] - kosten[k - 1] || 1)
  return k - 1 + Math.min(1, Math.max(0, t))
}

/** Verzacht de plek van de ringen over naburige kolommen, zodat ringen niet zigzaggen. */
function verzacht(plek: Float64Array): Float64Array {
  const uit = new Float64Array(plek.length)
  const gewicht = [1, 2, 3, 2, 1]
  for (let i = 0; i < RINGEN; i++) {
    for (let j = 0; j < ROND; j++) {
      let som = 0
      for (let d = -2; d <= 2; d++) som += gewicht[d + 2] * plek[i * ROND + ((j + d + ROND) % ROND)]
      uit[i * ROND + j] = som / 9
    }
  }
  return uit
}

/** Rekent de huid een keer uit: punten en schaduw in plooien. */
export function huidvorm(): Huidvorm {
  if (VORM) return VORM
  const aantalFijn = (RINGEN - 1) * FIJN + 1
  const kolommen = Array.from({ length: ROND }, () => Array.from({ length: aantalFijn }, () => new Vector3()))
  const kosten = new Float64Array(aantalFijn)
  const plek = new Float64Array(RINGEN * ROND)
  for (let j = 0; j < ROND; j++) {
    meetKolom(dichter(j / ROND, 0.78) * Math.PI * 2, kolommen[j], kosten)
    const totaal = kosten[aantalFijn - 1]
    for (let i = 0; i < RINGEN; i++) plek[i * ROND + j] = indexBij((totaal * i) / (RINGEN - 1), kosten)
  }
  const zacht = verzacht(plek)
  const punten = new Float32Array(RINGEN * ROND * 3)
  const schaduw = new Float32Array(RINGEN * ROND)
  const q = new Vector3()
  const n = new Vector3()
  for (let i = 0; i < RINGEN; i++) {
    for (let j = 0; j < ROND; j++) {
      const k = i * ROND + j
      const f = i === 0 || i === RINGEN - 1 ? plek[k] : zacht[k]
      const a = Math.min(aantalFijn - 2, Math.floor(f))
      q.copy(kolommen[j][a]).lerp(kolommen[j][a + 1], f - a)
      naarHuid(q)
      punten.set([q.x, q.y, q.z], k * 3)
      schaduw[k] = occlusie(q, normaal(q, n))
    }
  }
  VORM = { punten, schaduw }
  return VORM
}
