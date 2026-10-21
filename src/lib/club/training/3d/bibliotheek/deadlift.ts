// 3D-oefening: Deadlift. Naam exact zoals in de oefenbibliotheek.
// Stang boven het midden van de voet, schenen tegen de stang, schouders net voor
// de stang, rug neutraal. Eerst duwen met de benen, dan heupen naar voren tot
// rechtop. Terug: heupen eerst naar achteren, stang langs de dijen.
// De stang blijft in elke stand op dezelfde plek boven de middenvoet, zodat hij
// een rechte lijn omhoog en omlaag maakt.

import { houding } from '../bouw/basis'
import type { Oefening3d } from '../typen'

// Greep net buiten de knieen, zodat de armen vrij langs de benen hangen.
const GREEP = 0.29
// Stang boven het midden van de voet; de scheen raakt hem in de start.
const STANG_Z = 0.08

// Start: heupen tussen knie en schouder, schenen tegen de stang, schouders net
// voor de stang, borst trots en rug recht, blik schuin voor je op de grond. De
// schijven staan op de vloer.
const DEADLIFT_ONDER = houding({
  bekkenY: 0.592, bekkenZ: -0.30, kantel: 56, lende: 3, borst: 1, nek: -18,
  schouders: -0.01, lastY: 0, lastZ: STANG_Z, greep: GREEP,
})
// Omhoog: stang net onder de knie. De benen hebben geduwd, de knieen zijn naar
// achteren uit de baan van de stang, rughoek nog gelijk.
const DEADLIFT_KNIE = houding({
  bekkenY: 0.75, bekkenZ: -0.34, kantel: 55, lende: 3, borst: 1, nek: -16,
  schouders: -0.01, lastY: 0, lastZ: STANG_Z, greep: GREEP,
})
// Omlaag: eerst heupen naar achteren met bijna gestrekte knieen tot de stang
// voorbij de knie is; pas daarna buigen de knieen (via DEADLIFT_KNIE).
const DEADLIFT_SCHARNIER = houding({
  bekkenY: 0.83, bekkenZ: -0.33, kantel: 56, lende: 3, borst: 1, nek: -16,
  schouders: -0.01, lastY: 0, lastZ: STANG_Z, greep: GREEP,
})
// Bovenaan rechtop, stang tegen de dijen, niet achterover leunen.
const DEADLIFT_BOVEN = houding({
  bekkenY: 0.948, bekkenZ: 0, kantel: 2, lende: -2, borst: -1, nek: -5,
  schouders: -0.02, lastY: 0, lastZ: STANG_Z, greep: GREEP,
})

export const DEADLIFT_3D: Oefening3d = {
  naam: 'Deadlift',
  sleutels: [
    { houding: DEADLIFT_ONDER, vast: 0.5, naarVolgende: 0.7 },
    { houding: DEADLIFT_KNIE, vast: 0, naarVolgende: 0.7 },
    { houding: DEADLIFT_BOVEN, vast: 0.6, naarVolgende: 1.0 },
    { houding: DEADLIFT_SCHARNIER, vast: 0, naarVolgende: 0.5 },
    { houding: DEADLIFT_KNIE, vast: 0, naarVolgende: 0.6 },
  ],
  // tempo: 0,5 s stil onderaan (spanning opbouwen), 1,4 s omhoog, 0,6 s rechtop,
  // 2,1 s omlaag met eerst de heupen naar achteren
  last: 'hangend',
  handen: 'greep',
  enkel: { x: 0.13, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 8 },
  knieRichting: { x: 0.08, y: 0, z: 1 },
  elleboogRichting: { x: 0, y: 0, z: -1 },
  materiaal: [{ soort: 'stang', schijven: 3 }],
  // de hoogte van de stang volgt uit de gestrekte armen (lastY telt niet)
  spieren: ['bil', 'dij', 'rug'],
  camera: { hoek: 66, hoogte: 9, afstand: 4.4, doel: { x: 0, y: 0.7, z: 0 } },
}
