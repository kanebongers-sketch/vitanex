// ─── Fit Factory Club, 3D-oefenbeelden: smith machine ───────────────────────
// Frame met aan elke kant twee staanders en een verchroomde geleidestang
// ertussen. De stang (los materiaal 'stang') loopt met een slede over de
// geleidestangen recht omhoog en omlaag; de slede heeft een haak om de stang
// weg te draaien. Veiligheidsstops staan vanzelf net onder het laagste punt
// van de beweging, zoals de coaching vraagt. Staanders aan de kant van de
// camera worden doorzichtig als ze het lichaam afdekken.

import { Group, Vector3 } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { GeoBak } from './vormen'
import { blok, cilinder, schaduw, voegSamen, type MateriaalMaterialen, type Stuk } from './materiaal-delen'
import { maakAfdekker, zetAfdekker, type Afdekker, type Zicht } from './materiaal-zicht'

/** Geleidestangen op x = +-0,6: net binnen de schijven en buiten de handen. */
const RAIL_X = 0.6
const DIEPTE = 0.32
const HOOGTE = 2.25

export function smithMachine(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3, zicht: Zicht): Stuk {
  const g = new Group()
  const z = plek.z
  const vast = new Group()
  const staanders: Group[] = []
  for (const s of [1, -1]) {
    const x = s * RAIL_X
    for (const dz of [DIEPTE, -DIEPTE]) {
      const paal = new Group()
      paal.add(blok(bak, m.frame, [0.08, HOOGTE, 0.08], [x, HOOGTE / 2, z + dz], 0.02))
      paal.add(blok(bak, m.greep, [0.09, 0.014, 0.09], [x, 0.007, z + dz], 0.005))
      staanders.push(paal)
    }
    // Bovenligger en voetligger langs de diepte, geleidestang met eindblokken.
    vast.add(blok(bak, m.frame, [0.08, 0.08, 2 * DIEPTE + 0.08], [x, HOOGTE, z], 0.02))
    vast.add(blok(bak, m.frame, [0.09, 0.05, 2 * DIEPTE + 0.6], [x, 0.025, z - 0.2], 0.02))
    const rail = cilinder(bak, m.staal, 0.016, HOOGTE - 0.16, 16)
    rail.position.set(x, HOOGTE / 2, z)
    vast.add(rail)
    for (const y of [0.1, HOOGTE - 0.06]) vast.add(blok(bak, m.frame, [0.06, 0.05, 2 * DIEPTE], [x, y, z], 0.015))
  }
  for (const dz of [DIEPTE, -DIEPTE]) vast.add(blok(bak, m.frame, [2 * RAIL_X, 0.08, 0.08], [0, HOOGTE, z + dz], 0.02))
  // Voetligger achteraan, ruim achter de poten van een bank.
  vast.add(blok(bak, m.frame, [2 * RAIL_X + 0.09, 0.05, 0.09], [0, 0.03, z - DIEPTE - 0.45], 0.02))
  g.add(vast, ...staanders)
  // Sledes met haak en veiligheidsstops (die laatste per oefening op hoogte gezet).
  const sledes = [1, -1].map((s) => {
    const slede = new Group()
    slede.add(blok(bak, m.frame, [0.06, 0.13, 0.08], [0, 0, 0], 0.015))
    slede.add(blok(bak, m.accent, [0.02, 0.05, 0.05], [-s * 0.03, -0.035, -0.06], 0.006))
    slede.position.x = s * RAIL_X
    return slede
  })
  const stops = [1, -1].map((s) => {
    const stop = new Group()
    stop.add(blok(bak, m.frame, [0.06, 0.05, 2 * DIEPTE], [0, 0, 0], 0.015))
    stop.add(blok(bak, m.accent, [0.05, 0.008, 2 * DIEPTE - 0.04], [0, 0.029, 0], 0.003))
    stop.position.set(s * RAIL_X, 0, z)
    return stop
  })
  g.add(...sledes, ...stops)
  schaduw(g)
  voegSamen(vast, bak)
  const afdekkers: Afdekker[] = staanders.map((p) => maakAfdekker(p, m.kopie))
  let laagste = Infinity
  return {
    groep: g,
    meet(f: Figuur) {
      laagste = Math.min(laagste, f.last.pos.y)
    },
    zet(f: Figuur) {
      for (const slede of sledes) slede.position.set(slede.position.x, f.last.pos.y, f.last.pos.z)
      const stopY = Number.isFinite(laagste) ? laagste - 0.08 : f.last.pos.y - 0.3
      for (const stop of stops) stop.position.y = stopY
      for (const a of afdekkers) zetAfdekker(a, f, zicht)
    },
  }
}
