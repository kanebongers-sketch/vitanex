// 3D-oefening: Barbell row met onderhandse greep. Naam exact zoals in de oefenbibliotheek.
// Stang op schouderbreedte met de handpalmen naar voren, van je af gekeerd. Knieen
// licht gebogen, heupen naar achteren, romp schuin voorover (iets rechter dan de
// gewone barbell row) en stil, onderrug in zijn natuurlijke holling. De stang
// hangt aan gestrekte armen en komt laag naar de buik, bij de navel; de ellebogen
// schuren bijna langs de zij naar achteren. Blik schuin naar de vloer voor je.
// Tempo: 1 tel omhoog, kort stil, 2 tellen omlaag.
// Camera van opzij: rughoek, ellebogen langs de romp en de stang bij de buik.

import { armOefening, LICHAAM } from '../bouw/boven'
import { BLIK } from '../bouw/basis'
import type { Oefening3d } from '../typen'

/** Onderhandse greep: de stang ligt andersom in de hand dan bij de gewone row. */
const ONDERHANDS = { x: -1, y: 0, z: 0 } as const

export const BARBELL_ROW_ONDERHANDS: Oefening3d = armOefening({
  naam: 'Barbell row met onderhandse greep',
  lichaam: { ...LICHAAM.voorover, bekkenY: 0.87, kantel: 46 },
  van: { dx: 0.03, dy: -0.62, dz: 0.05 },
  naar: { dx: 0.03, dy: -0.31, dz: -0.12 },
  balans: 0.04,
  enkel: { x: 0.13, y: 0.08, z: 0 },
  elleboogRichting: { x: 0.12, y: 0.55, z: -0.8 },
  greepRichting: ONDERHANDS,
  materiaal: [{ soort: 'stang', schijven: 2 }],
  spieren: ['rug', 'bovenarm'],
  spierenSecundair: ['schouder', 'onderarm'],
  camera: { hoek: 56, hoogte: 10, afstand: 4.3, doel: { x: 0, y: 0.8, z: 0.05 } },
  blik: BLIK.scharnier,
  tempo: { begin: 0.4, heen: 1.0, eind: 0.4, terug: 2.0 },
  tussen: 1,
})
