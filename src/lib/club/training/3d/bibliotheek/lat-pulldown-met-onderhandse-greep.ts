// 3D-oefening: Lat pulldown met onderhandse greep. Naam exact zoals in de oefenbibliotheek.

import { armOefening } from '../bouw/boven'
import type { Oefening3d } from '../typen'

export const LAT_PULLDOWN_ONDERHANDS: Oefening3d = armOefening({
  naam: 'Lat pulldown met onderhandse greep',
  lichaam: { bekkenY: 0.555, kantel: -8, schouders: 0.04 },
  lichaamEind: { bekkenY: 0.555, kantel: -16, lende: -2, borst: -5, nek: 8, schouders: -0.02 },
  van: { dx: 0.06, dy: 0.62, dz: 0.05 },
  naar: { dx: 0.06, dy: -0.03, dz: 0.19 },
  enkel: { x: 0.15, y: 0.08, z: 0.5 },
  voet: { kanteling: 0, uitdraai: 10 },
  knieRichting: { x: 0.2, y: 0.4, z: 1 },
  elleboogRichting: { x: 0.4, y: -1, z: 0.5 },
  materiaal: [{ soort: 'kabelstation', plek: { x: 0, y: 0, z: 0 } }],
  spieren: ['rug', 'bovenarm'],
  camera: { hoek: 48, hoogte: 7, afstand: 5.1, doel: { x: 0, y: 1.12, z: 0.12 } },
  tussen: 1,
})
