// ─── Fit Factory Club, 3D-oefenbeelden: trap bar ─────────────────────────────
// Zeskantige trap bar (hex bar) van gepoedercoate buis: de sporter staat in het
// midden, de handvatten (knurling, neutrale greep) lopen van voor naar achter
// op 56 cm van elkaar en liggen in het vlak van het frame (lage handvatten, op
// ashoogte van de schijven). Aan de zijpunten een kraag en een verchroomde huls
// met bumperschijven en een sluiting. De oorsprong is het midden tussen de
// handvatten; de groep volgt de last (de handen). Schijven aan de kant van de
// camera worden doorzichtig zodra ze het lichaam afdekken, net als bij de stang.

import { Group, Vector3 } from 'three'
import type { GeoBak } from './vormen'
import { buisPad, cilinder, opX, opZ, schaduw, type MateriaalMaterialen, type Stuk } from './materiaal-delen'
import { losseSchijf, type StangKant } from './materiaal-vrij'
import { zetDoorzicht, type Zicht } from './materiaal-zicht'

/** Halve afstand tussen de handvatten (m); hoort bij `greep` in de oefening. */
export const TRAP_BAR_GREEP = 0.28

/** Hoeken van het zeskant (halve maten): zijpunt, voor- en achterhoeken. */
const ZIJ = 0.43
const HOEK_X = 0.25
const HOEK_Z = 0.33
const FRAME_STRAAL = 0.017
/** Huls: van de kraag tot het eind. */
const HULS_VAN = 0.6
const HULS_TOT = 1.06

/** Z waar de schuine zijde van het zeskant op x = `x` ligt (tussen zijpunt en hoek). */
function zOpSchuin(x: number): number {
  return (HOEK_Z * (ZIJ - x)) / (ZIJ - HOEK_X)
}

function frame(bak: GeoBak, m: MateriaalMaterialen): Group {
  const g = new Group()
  const p = (x: number, z: number) => new Vector3(x, 0, z)
  // Gesloten zeskant: begin en eind midden op de voorzijde, zodat elke hoek een ronde bocht krijgt.
  g.add(
    buisPad(
      bak,
      m.frame,
      [p(0, HOEK_Z), p(HOEK_X, HOEK_Z), p(ZIJ, 0), p(HOEK_X, -HOEK_Z), p(-HOEK_X, -HOEK_Z), p(-ZIJ, 0), p(-HOEK_X, HOEK_Z), p(0, HOEK_Z)],
      FRAME_STRAAL,
      0.06,
    ),
  )
  for (const kant of [1, -1]) {
    const x = TRAP_BAR_GREEP * kant
    const lengte = 2 * zOpSchuin(TRAP_BAR_GREEP)
    // Handvat: dunne buis met knurling in het midden, dikker frame naar de zijden.
    const greep = opZ(cilinder(bak, m.knurl, 0.0165, 0.15, 20))
    greep.position.x = x
    g.add(greep)
    for (const eind of [1, -1]) {
      const stuk = opZ(cilinder(bak, m.frame, 0.0175, (lengte - 0.15) / 2, 16))
      stuk.position.set(x, 0, (eind * (lengte + 0.15)) / 4)
      g.add(stuk)
    }
    // Uitloper van het frame naar de huls, met een kraag.
    const uit = opX(cilinder(bak, m.frame, 0.024, HULS_VAN - ZIJ, 18))
    uit.position.x = ((ZIJ + HULS_VAN) / 2) * kant
    g.add(uit)
    const kraag = opX(cilinder(bak, m.staal, 0.04, 0.018, 28))
    kraag.position.x = (HULS_VAN + 0.009) * kant
    g.add(kraag)
    const huls = opX(cilinder(bak, m.staal, 0.025, HULS_TOT - HULS_VAN, 28))
    huls.position.x = ((HULS_VAN + HULS_TOT) / 2) * kant
    g.add(huls)
  }
  return g
}

/** Schijven en sluiting aan een kant, met eigen materialen om te kunnen vervagen. */
function schijvenKant(bak: GeoBak, m: MateriaalMaterialen, aantal: number, kant: number): StangKant {
  const rubber = m.kopie(m.schijf)
  const naaf = m.kopie(m.staal)
  rubber.transparent = true
  naaf.transparent = true
  const eigen: MateriaalMaterialen = { ...m, schijf: rubber, staal: naaf }
  const groep = new Group()
  let x = HULS_VAN + 0.02
  for (let i = 0; i < aantal; i++) {
    const s = losseSchijf(bak, eigen, i)
    const dikte = s.userData.dikte as number
    opX(s)
    s.position.x = (x + dikte / 2) * kant
    groep.add(s)
    x += dikte + 0.002
  }
  const slot = opX(cilinder(bak, m.accent, 0.041, 0.034, 32))
  slot.position.x = (x + 0.018) * kant
  groep.add(slot)
  return { groep, materialen: [rubber, naaf], midden: new Vector3(((HULS_VAN + x) / 2) * kant, 0, 0), straal: 0.225 }
}

export function trapBar(bak: GeoBak, m: MateriaalMaterialen, schijven: number, zicht: Zicht): Stuk {
  const g = new Group()
  g.add(frame(bak, m))
  const kanten = [1, -1].map((kant) => schijvenKant(bak, m, schijven, kant))
  for (const k of kanten) g.add(k.groep)
  schaduw(g)
  return {
    groep: g,
    zet(f) {
      g.position.copy(f.last.pos)
      g.quaternion.copy(f.last.rot)
      zetDoorzicht(g, kanten, f, zicht)
    },
  }
}
