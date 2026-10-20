// 3D-oefening: Schuin bankdrukken met dumbbells. Naam exact zoals in de oefenbibliotheek.

import { armOefening } from '../bouw/boven'
import type { Oefening3d } from '../typen'

export const SCHUIN_BANKDRUKKEN_DB: Oefening3d = armOefening({
  naam: 'Schuin bankdrukken met dumbbells',
  lichaam: { bekkenY: 0.56, bekkenZ: 0.12, kantel: -58, nek: 10, schouders: -0.012 },
  van: { dx: -0.02, dy: 0.58, dz: 0.2 },
  naar: { dx: 0.15, dy: 0.14, dz: 0.1 },
  enkel: { x: 0.22, y: 0.08, z: 0.68 },
  voet: { kanteling: 0, uitdraai: 15 },
  knieRichting: { x: 0.3, y: 0.8, z: 0.5 },
  elleboogRichting: { x: 1, y: -1, z: -0.2 },
  materiaal: [{ soort: 'bankSchuin', hoek: 32, plek: { x: 0, y: 0, z: 0.0 } }, { soort: 'halters' }],
  spieren: ['borst', 'bovenarm', 'schouder'],
  camera: { hoek: 40, hoogte: 18, afstand: 4.4, doel: { x: 0, y: 0.82, z: 0.05 } },
  tempo: { begin: 0.6, heen: 2.0, eind: 0.3, terug: 1.2 },
  tussen: 1,
})
