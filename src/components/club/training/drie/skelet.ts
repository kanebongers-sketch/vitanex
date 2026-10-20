// ─── Fit Factory Club, 3D-oefenbeelden: skelet ──────────────────────────────
// Zestien botten die per beeld de stand uit de kinematica overnemen. Het
// lichaam is een SkinnedMesh: de videokaart buigt de huid, de processor zet
// alleen de botten (geen nieuwe objecten per beeld).
//
// Ledematen hangen elk aan een bot (stijf, met overlappende ronde gewrichten).
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
} as const

const AANTAL = 16

/** Bindhouding van de wervelkolom (rechtop), zoals de kinematica die opbouwt. */
export const BIND = {
  lende: new Vector3(0, MATEN.bekkenNaarLende.y, MATEN.bekkenNaarLende.z),
  borst: new Vector3(0, MATEN.bekkenNaarLende.y + MATEN.lende, MATEN.bekkenNaarLende.z),
  hoofd: new Vector3(0, MATEN.bekkenNaarLende.y + MATEN.lende + MATEN.borst, MATEN.bekkenNaarLende.z - 0.005),
} as const

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

export function maakSkelet(o: Oefening3d): Skelet {
  const botten = Array.from({ length: AANTAL }, () => new Bone())
  const inverse = botten.map(() => new Matrix4())
  inverse[BOT.lende].makeTranslation(-BIND.lende.x, -BIND.lende.y, -BIND.lende.z)
  inverse[BOT.borst].makeTranslation(-BIND.borst.x, -BIND.borst.y, -BIND.borst.z)
  inverse[BOT.hoofd].makeTranslation(-BIND.hoofd.x, -BIND.hoofd.y, -BIND.hoofd.z)
  const skelet = new Skeleton(botten, inverse)
  // Voorkant van dij en scheen wijst naar de knie, van de arm weg van de elleboog.
  const knie = [richting(o.knieRichting, 1, 1), richting(o.knieRichting, -1, 1)]
  const arm = [richting(o.elleboogRichting, 1, -1), richting(o.elleboogRichting, -1, -1)]
  const pols = new Vector3()

  const zetBeen = (b: Ledemaat, i: number) => {
    zetLid(botten[BOT.dij[i]], b.begin, b.midden, knie[i])
    zetLid(botten[BOT.scheen[i]], b.midden, b.eind, knie[i])
  }
  const zetArm = (a: Ledemaat, i: number) => {
    zetLid(botten[BOT.bovenarm[i]], a.begin, a.midden, arm[i])
    pols.copy(a.eind).sub(a.midden).normalize().multiplyScalar(MATEN.onderarm).add(a.midden)
    zetLid(botten[BOT.onderarm[i]], a.midden, pols, arm[i])
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
