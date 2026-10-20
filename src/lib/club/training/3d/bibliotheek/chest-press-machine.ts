// 3D-oefening: Chest press machine. Naam exact zoals in de oefenbibliotheek.

import { armOefening, LICHAAM } from '../bouw/boven'
import type { Oefening3d } from '../typen'

export const CHEST_PRESS_MACHINE: Oefening3d = armOefening({
  naam: 'Chest press machine',
  lichaam: { ...LICHAAM.zittend, kantel: -12 },
  van: { dx: 0.13, dy: -0.07, dz: 0.16 },
  naar: { dx: 0.05, dy: -0.06, dz: 0.6 },
  enkel: { x: 0.18, y: 0.08, z: 0.5 },
  voet: { kanteling: 0, uitdraai: 12 },
  knieRichting: { x: 0.3, y: 0.4, z: 1 },
  elleboogRichting: { x: 1, y: -0.7, z: -0.5 },
  greepRichting: { x: 0, y: 1, z: 0 },
  materiaal: [{ soort: 'chestPress', plek: { x: 0, y: 0, z: 0 } }],
  spieren: ['borst', 'bovenarm', 'schouder'],
  camera: { hoek: 58, hoogte: 12, afstand: 4.4, doel: { x: 0, y: 0.95, z: 0.2 } },
  tempo: { begin: 0.5, heen: 1.2, eind: 0.3, terug: 2.0 },
  tussen: 1,
})
