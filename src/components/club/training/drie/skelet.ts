// ─── Fit Factory Club, 3D-oefenbeelden: skelet ──────────────────────────────
// Vierentwintig botten die per beeld de stand uit de kinematica overnemen. Het
// lichaam is een SkinnedMesh: de videokaart buigt de huid, de processor zet
// alleen de botten (geen nieuwe objecten per beeld).
//
// Arm en been zijn elk een doorlopende huid over twee botten. Knie en elleboog
// hebben een hulpbot dat precies half meedraait: de huid rond het gewricht
// hangt daaraan, zodat het gewricht rond en vol blijft en er geen naad is.
// Romp en nek mengen tussen bekken, onderrug, borst en hoofd, zodat de rug
// vloeiend buigt.

import { Bone, Matrix4, Skeleton, Vector3 } from 'three'
import type { Figuur, Frame, Ledemaat } from '@/lib/club/training/3d/kinematica'
import { MATEN } from '@/lib/club/training/3d/maten'
import type { Oefening3d, Vec3 } from '@/lib/club/training/3d/typen'

export const BOT = {
  bekken: 0,
  lende: 1,
  borst: 2,
  hoofd: 3,
  dij: [4, 5],
  scheen: [6, 7],
  voet: [8, 9],
  bovenarm: [10, 11],
  onderarm: [12, 13],
  hand: [14, 15],
  /** Hulpbotten die half meedraaien met knie en elleboog. */
  knie: [16, 17],
  elleboog: [18, 19],
  /**
   * Hulpbotten in schouder en heup: half tussen de rusthouding (arm of been
   * recht omlaag langs de romp) en de echte stand. De schouderkop en de
   * bovenkant van de dij hangen er deels aan, zodat ze bij geheven armen of een
   * diepe squat op de romp blijven liggen in plaats van als bol uit te steken.
   */
  schouder: [20, 21],
  heup: [22, 23],
} as const

const AANTAL = 24

/** Bindhouding van de wervelkolom (rechtop), zoals de kinematica die opbouwt. */
export const BIND = {
  lende: new Vector3(0, MATEN.bekkenNaarLende.y, MATEN.bekkenNaarLende.z),
  borst: new Vector3(0, MATEN.bekkenNaarLende.y + MATEN.lende, MATEN.bekkenNaarLende.z),
  hoofd: new Vector3(0, MATEN.bekkenNaarLende.y + MATEN.lende + MATEN.borst, MATEN.bekkenNaarLende.z - 0.005),
} as const

/**
 * Bindhouding van arm en been: gestrekt langs +y in de ruimte van het bovenste
 * bot. Het onderste bot en het hulpbot beginnen dan op de lengte van het
 * bovenste deel.
 */
export const LID_BIND = { been: MATEN.dij, arm: MATEN.bovenarm } as const

/** Van hoofdruimte naar bindruimte. */
export const HOOFD_NAAR_BIND = new Matrix4().makeTranslation(BIND.hoofd.x, BIND.hoofd.y, BIND.hoofd.z)

export interface Skelet {
  readonly skelet: Skeleton
  readonly botten: readonly Bone[]
  zet(f: Figuur): void
}

function richting(v: Vec3, spiegel: number, teken: number): Vector3 {
  return new Vector3(v.x * spiegel, v.y, v.z).normalize().multiplyScalar(teken)
}

const RUST_Y = new Vector3()
const RUST_Z = new Vector3()
const RUST_X = new Vector3()
const RUST = new Matrix4()
const ty = new Vector3()
const tz = new Vector3()
const tx = new Vector3()
const basis = new Matrix4()

function zetFrame(bot: Bone, f: Frame): void {
  bot.position.copy(f.pos)
  bot.quaternion.copy(f.rot)
}

/**
 * Een bot langs een lidmaat: y van `van` naar `naar`, z naar de voorkant
 * (`voor` loodrecht op de as), x volgt daaruit.
 */
function zetLid(bot: Bone, van: Vector3, naar: Vector3, voor: Vector3): void {
  ty.copy(naar).sub(van).normalize()
  tz.copy(voor).addScaledVector(ty, -voor.dot(ty))
  if (tz.lengthSq() < 1e-8) tz.set(0, 0, 1).addScaledVector(ty, -ty.z)
  tz.normalize()
  tx.crossVectors(ty, tz)
  basis.makeBasis(tx, ty, tz)
  bot.position.copy(van)
  bot.quaternion.setFromRotationMatrix(basis)
}

/**
 * Hulpbot in schouder of heup: op het gewricht, half gedraaid tussen de
 * rusthouding (langs de -y van de romp, zelfde voorkant als het lid) en het lid.
 */
function zetKop(hulp: Bone, lid: Bone, romp: Bone): void {
  RUST_Y.set(0, -1, 0).applyQuaternion(romp.quaternion)
  RUST_Z.set(0, 0, 1).applyQuaternion(lid.quaternion)
  RUST_Z.addScaledVector(RUST_Y, -RUST_Z.dot(RUST_Y))
  if (RUST_Z.lengthSq() < 1e-6) RUST_Z.set(0, 0, 1).applyQuaternion(romp.quaternion)
  RUST_Z.normalize()
  RUST_X.crossVectors(RUST_Y, RUST_Z)
  RUST.makeBasis(RUST_X, RUST_Y, RUST_Z)
  hulp.position.copy(lid.position)
  hulp.quaternion.setFromRotationMatrix(RUST).slerp(lid.quaternion, 0.5)
}

export function maakSkelet(o: Oefening3d): Skelet {
  const botten = Array.from({ length: AANTAL }, () => new Bone())
  const inverse = botten.map(() => new Matrix4())
  inverse[BOT.lende].makeTranslation(-BIND.lende.x, -BIND.lende.y, -BIND.lende.z)
  inverse[BOT.borst].makeTranslation(-BIND.borst.x, -BIND.borst.y, -BIND.borst.z)
  inverse[BOT.hoofd].makeTranslation(-BIND.hoofd.x, -BIND.hoofd.y, -BIND.hoofd.z)
  for (let i = 0; i < 2; i++) {
    for (const k of [BOT.scheen[i], BOT.knie[i]]) inverse[k].makeTranslation(0, -LID_BIND.been, 0)
    for (const k of [BOT.onderarm[i], BOT.elleboog[i]]) inverse[k].makeTranslation(0, -LID_BIND.arm, 0)
  }
  const skelet = new Skeleton(botten, inverse)
  // Voorkant van dij en scheen wijst naar de knie, van de arm weg van de elleboog.
  const knie = [richting(o.knieRichting, 1, 1), richting(o.knieRichting, -1, 1)]
  const arm = [richting(o.elleboogRichting, 1, -1), richting(o.elleboogRichting, -1, -1)]
  const pols = new Vector3()

  /** Het hulpbot staat in het gewricht en draait half zo ver als het onderste bot. */
  const zetGewricht = (hulp: Bone, boven: Bone, onder: Bone) => {
    hulp.position.copy(onder.position)
    hulp.quaternion.copy(boven.quaternion).slerp(onder.quaternion, 0.5)
  }
  const zetBeen = (b: Ledemaat, i: number) => {
    zetLid(botten[BOT.dij[i]], b.begin, b.midden, knie[i])
    zetLid(botten[BOT.scheen[i]], b.midden, b.eind, knie[i])
    zetGewricht(botten[BOT.knie[i]], botten[BOT.dij[i]], botten[BOT.scheen[i]])
    zetKop(botten[BOT.heup[i]], botten[BOT.dij[i]], botten[BOT.bekken])
  }
  const zetArm = (a: Ledemaat, i: number) => {
    zetLid(botten[BOT.bovenarm[i]], a.begin, a.midden, arm[i])
    pols.copy(a.eind).sub(a.midden).normalize().multiplyScalar(MATEN.onderarm).add(a.midden)
    zetLid(botten[BOT.onderarm[i]], a.midden, pols, arm[i])
    zetGewricht(botten[BOT.elleboog[i]], botten[BOT.bovenarm[i]], botten[BOT.onderarm[i]])
    zetKop(botten[BOT.schouder[i]], botten[BOT.bovenarm[i]], botten[BOT.borst])
  }

  return {
    skelet,
    botten,
    zet(f: Figuur) {
      zetFrame(botten[BOT.bekken], f.bekken)
      zetFrame(botten[BOT.lende], f.lende)
      zetFrame(botten[BOT.borst], f.borst)
      zetFrame(botten[BOT.hoofd], f.hoofd)
      zetBeen(f.benen[0], 0)
      zetBeen(f.benen[1], 1)
      zetArm(f.armen[0], 0)
      zetArm(f.armen[1], 1)
      for (let i = 0; i < 2; i++) {
        zetFrame(botten[BOT.voet[i]], f.voeten[i])
        zetFrame(botten[BOT.hand[i]], f.handen[i])
      }
    },
  }
}
