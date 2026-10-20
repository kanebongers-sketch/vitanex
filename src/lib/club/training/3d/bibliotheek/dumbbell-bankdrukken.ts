// 3D-oefening: Dumbbell bankdrukken. Naam exact zoals in de oefenbibliotheek.

import { armOefening, CAMERA, LICHAAM } from '../bouw/boven'
import type { Oefening3d } from '../typen'

export const DUMBBELL_BANKDRUKKEN: Oefening3d = armOefening({
  naam: 'Dumbbell bankdrukken',
  lichaam: LICHAAM.bankLig,
  van: { dx: 0.02, dy: 0.6, dz: 0.0 },
  naar: { dx: 0.16, dy: 0.17, dz: 0.08 },
  enkel: { x: 0.24, y: 0.08, z: 0.62 },
  voet: { kanteling: 0, uitdraai: 15 },
  knieRichting: { x: 0.3, y: 1, z: 0.4 },
  elleboogRichting: { x: 1, y: -0.8, z: 0.4 },
  materiaal: [{ soort: 'bankKaal', plek: { x: 0, y: 0, z: -0.15 } }, { soort: 'halters' }],
  spieren: ['borst', 'bovenarm', 'schouder'],
  camera: CAMERA.liggend,
  tempo: { begin: 0.6, heen: 2.0, eind: 0.3, terug: 1.2 },
  tussen: 1,
})
