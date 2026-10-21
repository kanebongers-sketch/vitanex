// 3D-oefening: Dumbbell shoulder press. Naam exact zoals in de oefenbibliotheek.
// Zittend op een rechte bank, rug tegen het kussen, voeten plat op heupbreedte.
// Halters op oorhoogte, ellebogen een hand voor het lichaam en de onderarmen
// rechtop onder de halter. De hele baan blijft de onderarm verticaal (pols boven
// elleboog), zodat de halters horizontaal blijven. Bovenin net niet gestrekt en
// net niet tegen elkaar.

import { houding } from '../bouw/basis'
import { schouderIn } from '../kinematica'
import { ARM_GREEP, MATEN } from '../maten'
import type { Houding, Oefening3d, Sleutel } from '../typen'

const GRAAD = Math.PI / 180

/** Romp: rug tegen het kussen, buik vast (geen holle rug). */
const ROMP = { bekkenY: 0.535, bekkenZ: -0.042, kantel: -4, lende: 0, borst: 0, nek: 2 }

/**
 * Een stand van de press uit de bovenarm: `hoogte` is de elleboog ten opzichte
 * van horizontaal (graden), `voor` hoever de elleboog voor het lichaam staat
 * (graden, 0 = recht opzij). De onderarm staat rechtop onder de halter; `binnen`
 * (meter) laat de hand in het bovenste stuk al wat naar binnen lopen, zodat de
 * baan een vloeiend driehoekje wordt.
 */
function stand(hoogte: number, voor: number, schouders: number, binnen = 0): Houding {
  const romp = houding({ ...ROMP, schouders })
  const s = schouderIn(romp)
  const a = hoogte * GRAAD
  const f = voor * GRAAD
  const plat = MATEN.bovenarm * Math.cos(a)
  return houding({
    ...ROMP,
    schouders,
    greep: s.x + plat * Math.cos(f) - binnen,
    lastY: s.y + MATEN.bovenarm * Math.sin(a) + ARM_GREEP,
    lastZ: s.z + plat * Math.sin(f),
  })
}

/** Halve afstand tussen de greepmiddens bovenin: een handbreedte tussen de koppen. */
const GREEP_BOVEN = 0.2
/** Schouder tot greep bovenin: armen hoog, ellebogen net niet op slot. */
const REIK_BOVEN = 0.62

/**
 * Bovenin lopen de halters naar binnen tot ze bijna boven het hoofd samenkomen
 * (licht driehoekje), net voor het hoofd en zonder de ellebogen op slot.
 */
function boven(schouders: number): Houding {
  const s = schouderIn(houding({ ...ROMP, schouders }))
  const dx = GREEP_BOVEN - s.x
  const dz = 0.04
  return houding({
    ...ROMP,
    schouders,
    greep: GREEP_BOVEN,
    lastY: s.y + Math.sqrt(REIK_BOVEN * REIK_BOVEN - dx * dx - dz * dz),
    lastZ: s.z + dz,
  })
}

const ONDER = stand(-28, 26, 0)
const BOVEN = boven(0.02)

const LAAG = stand(5, 27, 0.004)
const HALF = stand(32, 27, 0.01, 0.015)
const HOOG = stand(55, 22, 0.016, 0.05)

/** 1,2 tel omhoog, kort boven, 2 tellen gecontroleerd terug, kort stil onder. */
const SLEUTELS: Sleutel[] = [
  { houding: ONDER, vast: 0.45, naarVolgende: 0.3 },
  { houding: LAAG, vast: 0, naarVolgende: 0.3 },
  { houding: HALF, vast: 0, naarVolgende: 0.3 },
  { houding: HOOG, vast: 0, naarVolgende: 0.3 },
  { houding: BOVEN, vast: 0.25, naarVolgende: 0.5 },
  { houding: HOOG, vast: 0, naarVolgende: 0.5 },
  { houding: HALF, vast: 0, naarVolgende: 0.5 },
  { houding: LAAG, vast: 0, naarVolgende: 0.5 },
]

export const SCHOUDERDRUKKEN_3D: Oefening3d = {
  naam: 'Dumbbell shoulder press',
  sleutels: SLEUTELS,
  last: 'wereld',
  handen: 'greep',
  enkel: { x: 0.14, y: 0.08, z: 0.38 },
  voet: { kanteling: 0, uitdraai: 10 },
  knieRichting: { x: 0.08, y: 0.3, z: 1 },
  elleboogRichting: { x: 1, y: -0.75, z: 0.45 },
  materiaal: [{ soort: 'bankRug', plek: { x: 0, y: 0, z: -0.02 } }, { soort: 'halters' }],
  spieren: ['schouder', 'bovenarm'],
  camera: { hoek: -25, hoogte: 9, afstand: 4.1, doel: { x: 0, y: 0.88, z: 0.06 } },
}
