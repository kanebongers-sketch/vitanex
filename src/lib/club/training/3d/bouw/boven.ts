// ─── Fit Factory Club, 3D-oefenbeelden: bouwstenen bovenlichaam (PUUR) ──────
// Een bovenlichaam-oefening is een vaste (of langzaam meebewegende) romp plus
// een handbaan. De handen staan als plek ten opzichte van de linkerschouder
// (drukken, roeien: een rechte baan) of als gewrichtshoeken (curl, raise,
// extensie: een echte boog om schouder en elleboog).

import { schouderIn } from '../kinematica'
import type { Camera, HandModus, Houding, LastBevestiging, Lichaamsdeel, Materiaal, Oefening3d, Vec3 } from '../typen'
import { balanceer, handPlek, HEUP_STAAND, houding, lus, STAAND, TEMPO, type ArmStand, type Tempo } from './basis'

/** Hand ten opzichte van de linkerschouder (m): opzij, omhoog, naar voren. */
export interface HandRelatief {
  readonly dx: number
  readonly dy: number
  readonly dz: number
}

export type HandDoel = HandRelatief | ArmStand

function isArmStand(d: HandDoel): d is ArmStand {
  return 'heffen' in d
}

function mengGetal(a: number, b: number, f: number): number {
  return a + (b - a) * f
}

function mengDoel(a: HandDoel, b: HandDoel, f: number): HandDoel {
  if (isArmStand(a) && isArmStand(b)) {
    return { heffen: mengGetal(a.heffen, b.heffen, f), opzij: mengGetal(a.opzij, b.opzij, f), elleboog: mengGetal(a.elleboog, b.elleboog, f), buig: a.buig }
  }
  if (!isArmStand(a) && !isArmStand(b)) return { dx: mengGetal(a.dx, b.dx, f), dy: mengGetal(a.dy, b.dy, f), dz: mengGetal(a.dz, b.dz, f) }
  throw new Error('Begin en eind van de hand moeten hetzelfde soort doel zijn')
}

function mengHouding(a: Houding, b: Houding, f: number): Houding {
  const uit = { ...a } as Record<keyof Houding, number>
  for (const k of Object.keys(a) as (keyof Houding)[]) uit[k] = mengGetal(a[k], b[k], f)
  return uit
}

export interface ArmOpties {
  readonly naam: string
  /** Romp, bekken en voeten aan het begin; `lichaamEind` als de romp meebeweegt. */
  readonly lichaam: Partial<Houding>
  readonly lichaamEind?: Partial<Houding>
  readonly van: HandDoel
  readonly naar: HandDoel
  /** Zet het zwaartepunt boven deze z (staande oefeningen). */
  readonly balans?: number
  readonly enkel?: Vec3
  readonly voet?: { readonly kanteling: number; readonly uitdraai: number }
  readonly knieRichting?: Vec3
  readonly elleboogRichting: Vec3
  readonly greepRichting?: Vec3
  readonly handen?: HandModus
  readonly materiaal: readonly Materiaal[]
  readonly spieren: readonly Lichaamsdeel[]
  readonly camera: Camera
  readonly tempo?: Tempo
  /** Tussenstanden per richting; meer bij een boog. */
  readonly tussen?: number
}

function handKanalen(h: Houding, doel: HandDoel, plat: boolean): Pick<Houding, 'lastY' | 'lastZ' | 'greep'> {
  if (isArmStand(doel)) return handPlek(h, doel, plat)
  const s = schouderIn(h)
  return { lastY: s.y + doel.dy, lastZ: s.z + doel.dz, greep: s.x + doel.dx }
}

/** Een oefening met een vaste of meebewegende romp en een handbaan. */
export function armOefening(op: ArmOpties): Oefening3d {
  const o: Oefening3d = {
    naam: op.naam,
    sleutels: [],
    last: 'wereld' satisfies LastBevestiging,
    handen: op.handen ?? 'greep',
    enkel: op.enkel ?? STAAND.enkel,
    voet: op.voet ?? STAAND.voet,
    knieRichting: op.knieRichting ?? STAAND.knieRichting,
    elleboogRichting: op.elleboogRichting,
    ...(op.greepRichting ? { greepRichting: op.greepRichting } : {}),
    materiaal: op.materiaal,
    spieren: op.spieren,
    camera: op.camera,
  }
  const plat = o.handen === 'plat'
  const zet = (lichaam: Partial<Houding>, hand: HandDoel) => {
    let h = houding(lichaam)
    if (op.balans !== undefined) {
      h = balanceer(o, { ...h, ...handKanalen(h, hand, plat) }, op.balans)
    }
    return h
  }
  const begin = zet(op.lichaam, op.van)
  const eind = zet(op.lichaamEind ?? op.lichaam, op.naar)
  const maak = (p: { f: number }) => {
    const h = mengHouding(begin, eind, p.f)
    return { ...h, ...handKanalen(h, mengDoel(op.van, op.naar, p.f), plat) }
  }
  return { ...o, sleutels: lus({ f: 0 }, { f: 1 }, maak, op.tempo ?? TEMPO.trekken, op.tussen ?? 2) }
}

// ── Lichaamshoudingen die vaak terugkomen ───────────────────────────────────

export const LICHAAM = {
  staand: { bekkenY: HEUP_STAAND, kantel: 3, schouders: -0.005 },
  /** Licht voorover met zachte knieen (kabel, pushdown). */
  staandLicht: { bekkenY: 0.93, kantel: 12, lende: 0, nek: -6, schouders: -0.01 },
  /** Voorovergebogen vanuit de heupen (row). */
  voorover: { bekkenY: 0.86, kantel: 58, lende: -1, nek: -24, schouders: -0.01 },
  /** Op de rug op een vlakke bank. */
  bankLig: { bekkenY: 0.535, bekkenZ: 0.24, kantel: -90, schouders: -0.015 },
  /** Rechtop zittend op een bank of machine (hoogte zitvlak ongeveer 0,45 m). */
  zittend: { bekkenY: 0.555, kantel: -10, schouders: -0.005 },
} as const satisfies Record<string, Partial<Houding>>

/** Standaardcamera's: schuin van voren, van opzij en van boven-opzij voor liggen. */
export const CAMERA = {
  schuin: { hoek: 36, hoogte: 9, afstand: 4.2, doel: { x: 0, y: 1.0, z: 0.05 } },
  opzij: { hoek: 72, hoogte: 9, afstand: 4.2, doel: { x: 0, y: 0.95, z: 0.05 } },
  liggend: { hoek: 34, hoogte: 26, afstand: 4.4, doel: { x: 0, y: 0.62, z: -0.08 } },
} as const satisfies Record<string, Camera>
