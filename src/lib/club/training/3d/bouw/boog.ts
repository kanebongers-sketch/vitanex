// ─── Fit Factory Club, 3D-oefenbeelden: bouwsteen boogarm (PUUR) ────────────
// Fly, pec deck en cable crossover: de arm is een vaste boog (elleboog licht
// gebogen, die buiging blijft de hele herhaling gelijk) die als geheel om de
// schouder draait. De bovenarm volgt een echte cirkelboog om een as door de
// schouder en de onderarm draait mee. Zo beschrijft de hand een cirkel, zoals
// een trainer het voordoet ("omarm een groot vat"), in plaats van een rechte
// drukbaan.

import { Quaternion, Vector3 } from 'three'
import { schouderIn } from '../kinematica'
import { ARM_GREEP, MATEN } from '../maten'
import type { Blik, Camera, Houding, Lichaamsdeel, Materiaal, Oefening3d, Vec3 } from '../typen'
import { balanceer, houding, lus, metMoment, STAAND, staandeBlik, TEMPO, type Tempo } from './basis'

const GRAAD = Math.PI / 180

export interface BoogOpties {
  readonly naam: string
  /** Romp, bekken en voeten; ligt stil tijdens de beweging. */
  readonly lichaam: Partial<Houding>
  /** Richting van de linkerbovenarm in de wereld aan het begin en aan het eind. */
  readonly van: Vec3
  readonly naar: Vec3
  /**
   * Draaias in de wereld. Zonder: de kortste boog (grote cirkel) van `van` naar
   * `naar`. Met: de arm draait om deze as (een kegel, zoals de arm van een pec
   * deck om een verticale as) en `naar` bepaalt alleen de eindhoek.
   */
  readonly as?: Vec3
  /** Vaste buiging van de elleboog (graden). */
  readonly elleboog: number
  /** Richting waarin de onderarm aan het begin buigt (wereld, linkerarm); draait mee met de arm. */
  readonly buig: Vec3
  /** Zet het zwaartepunt boven deze z (staande oefeningen). */
  readonly balans?: number
  readonly enkel?: Vec3
  readonly enkelRechts?: Vec3
  readonly voet?: { readonly kanteling: number; readonly uitdraai: number }
  readonly voetRechts?: { readonly kanteling: number; readonly uitdraai: number }
  readonly knieRichting?: Vec3
  readonly elleboogRichting: Vec3
  readonly greepRichting?: Vec3
  readonly materiaal: readonly Materiaal[]
  readonly spieren: readonly Lichaamsdeel[]
  readonly spierenSecundair?: readonly Lichaamsdeel[]
  readonly camera: Camera
  readonly tempo?: Tempo
  /** Tussenstanden per richting (standaard 3: een ronde boog). */
  readonly tussen?: number
  /** Blik in de wereld; standaard bij staan (met `balans`) vooruit. Null = hoofd volgt de romp. */
  readonly blik?: Blik | null
  /** Fractie van de lus waarop de eindstand valt (standaard de helft). */
  readonly moment?: number
}

function vec(p: Vec3): Vector3 {
  return new Vector3(p.x, p.y, p.z)
}

/** As en hoek (radialen) van de draaiing van de bovenarm. */
export function boogDraaiing(op: Pick<BoogOpties, 'van' | 'naar' | 'as'>): { as: Vector3; hoek: number } {
  const a = vec(op.van).normalize()
  const b = vec(op.naar).normalize()
  if (!op.as) return { as: a.clone().cross(b).normalize(), hoek: a.angleTo(b) }
  const as = vec(op.as).normalize()
  const pa = a.projectOnPlane(as)
  const pb = b.projectOnPlane(as)
  const hoek = pa.angleTo(pb)
  return { as, hoek: pa.cross(pb).dot(as) < 0 ? -hoek : hoek }
}

/** Waar de linkerhand zit ten opzichte van de linkerschouder, op fractie `f` van de boog. */
export function boogHand(op: Pick<BoogOpties, 'van' | 'naar' | 'as' | 'elleboog' | 'buig'>, f: number): Vector3 {
  const d = boogDraaiing(op)
  const q = new Quaternion().setFromAxisAngle(d.as, d.hoek * f)
  const boven = vec(op.van).normalize().applyQuaternion(q)
  const buig = vec(op.buig).applyQuaternion(q)
  const loodrecht = buig.sub(boven.clone().multiplyScalar(buig.dot(boven))).normalize()
  const e = op.elleboog * GRAAD
  const onder = boven.clone().multiplyScalar(Math.cos(e)).addScaledVector(loodrecht, Math.sin(e))
  return boven.multiplyScalar(MATEN.bovenarm).addScaledVector(onder, ARM_GREEP)
}

function metHand(h: Houding, hand: Vector3): Houding {
  const s = schouderIn(h)
  return { ...h, lastY: s.y + hand.y, lastZ: s.z + hand.z, greep: s.x + hand.x }
}

function meng(a: Houding, b: Houding, f: number): Houding {
  const uit = { ...a } as Record<keyof Houding, number>
  for (const k of Object.keys(a) as (keyof Houding)[]) uit[k] = a[k] + (b[k] - a[k]) * f
  return uit
}

/** Een oefening waarin beide armen als vaste boog om de schouders draaien. */
export function boogOefening(op: BoogOpties): Oefening3d {
  const blik = op.blik === undefined ? (op.balans === undefined ? undefined : staandeBlik(op.lichaam.kantel ?? 0)) : (op.blik ?? undefined)
  const o: Oefening3d = {
    naam: op.naam,
    sleutels: [],
    last: 'wereld',
    handen: 'greep',
    enkel: op.enkel ?? STAAND.enkel,
    voet: op.voet ?? STAAND.voet,
    knieRichting: op.knieRichting ?? STAAND.knieRichting,
    elleboogRichting: op.elleboogRichting,
    ...(op.enkelRechts ? { enkelRechts: op.enkelRechts } : {}),
    ...(op.voetRechts ? { voetRechts: op.voetRechts } : {}),
    ...(op.greepRichting ? { greepRichting: op.greepRichting } : {}),
    materiaal: op.materiaal,
    spieren: op.spieren,
    ...(op.spierenSecundair ? { spierenSecundair: op.spierenSecundair } : {}),
    camera: op.camera,
    ...(blik ? { blik } : {}),
  }
  const zet = (f: number) => {
    const h = metHand(houding(op.lichaam), boogHand(op, f))
    return op.balans === undefined ? h : balanceer(o, h, op.balans)
  }
  const begin = zet(0)
  const eind = zet(1)
  const maak = (p: { f: number }) => metHand(meng(begin, eind, p.f), boogHand(op, p.f))
  return metMoment({ ...o, sleutels: lus({ f: 0 }, { f: 1 }, maak, op.tempo ?? TEMPO.trekken, op.tussen ?? 3) }, op.moment)
}
