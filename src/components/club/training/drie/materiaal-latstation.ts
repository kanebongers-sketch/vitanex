// ─── Fit Factory Club, 3D-oefenbeelden: latstation met een andere greep ─────
// Het latstation (materiaal-kabels) hangt standaard met de brede latstang. Voor
// varianten met een andere greep aan dezelfde kabel (V-greep, touw, handvat)
// tekenen we het station zoals het is, verbergen we de latstang en hangen we de
// gekozen greep aan de kabel. Het station legt de kabel naar het haakpunt van
// zijn eigen stang; we geven het daarom een figuur waarin die stang precies op
// het haakpunt van de nieuwe greep hangt. Zo loopt de kabel naar de juiste
// greep en gaat de stapel even ver omhoog als de kabel uitgetrokken wordt.

import { Group, Vector3 } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { Houding, KabelGreep } from '@/lib/club/training/3d/typen'
import type { GeoBak } from './vormen'
import type { MateriaalMaterialen, Stuk } from './materiaal-delen'
import { maakGreep } from './materiaal-grepen'
import { kabelstation } from './materiaal-kabels'
import type { Zicht } from './materiaal-zicht'

/** Voorste katrol van het latstation ten opzichte van `plek` (zie `kabelstation`). */
const VOORSTE_KATROL = new Vector3(0, 2.2, -0.075)

/** Afstand van het midden van de latstang tot zijn haakpunt, langs de kabel (zie `latStang`). */
const LAT_HAAK = 0.055

export function latstationMetGreep(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3, soort: KabelGreep, zicht: Zicht): Stuk {
  const station = kabelstation(bak, m, plek, zicht)
  // De latstang is het laatste kind van het station (na vast deel, toren en kabelroute).
  const latStang = station.groep.children[station.groep.children.length - 1]
  latStang.visible = false
  const greep = maakGreep(bak, m, soort)
  const groep = new Group()
  groep.add(station.groep, greep.groep)
  const katrol = VOORSTE_KATROL.clone().add(plek)
  const midden = new Vector3()
  const naar = new Vector3()
  const stangPlek = new Vector3()

  /** Het figuur met de (onzichtbare) latstang zo dat zijn haakpunt op dat van de greep ligt. */
  const voorStation = (f: Figuur): Figuur => {
    greep.zet(f, katrol)
    midden.copy(f.handen[0].pos).add(f.handen[1].pos).multiplyScalar(0.5)
    naar.copy(katrol).sub(midden).normalize()
    stangPlek.copy(greep.haak).addScaledVector(naar, -LAT_HAAK)
    return { ...f, last: { pos: stangPlek, rot: f.last.rot } }
  }

  return {
    groep,
    meet(f: Figuur, h: Houding) {
      station.meet?.(voorStation(f), h)
    },
    zet(f: Figuur, h: Houding) {
      station.zet(voorStation(f), h)
    },
  }
}
