// 3D-oefening: Seated cable row. Naam exact zoals in de oefenbibliotheek.

import { armOefening } from '../bouw/boven'
import type { Oefening3d } from '../typen'

export const SEATED_CABLE_ROW: Oefening3d = armOefening({
  naam: 'Seated cable row',
  lichaam: { bekkenY: 0.52, bekkenZ: 0, kantel: 10, nek: -8, schouders: 0.01 },
  lichaamEind: { bekkenY: 0.52, bekkenZ: 0, kantel: -4, borst: -4, nek: 2, schouders: -0.015 },
  van: { dx: -0.12, dy: -0.15, dz: 0.6 },
  naar: { dx: -0.12, dy: -0.31, dz: 0.2 },
  enkel: { x: 0.12, y: 0.22, z: 0.74 },
  voet: { kanteling: -62, uitdraai: 6 },
  knieRichting: { x: 0.25, y: 1, z: 0.2 },
  elleboogRichting: { x: 0.25, y: -0.4, z: -1 },
  greepRichting: { x: 0, y: 1, z: 0.25 },
  materiaal: [
    { soort: 'bankKaal', plek: { x: 0, y: 0, z: 0.1 } },
    { soort: 'kabel', greep: 'vgreep', plek: { x: 0, y: 0.32, z: 1.02 } },
  ],
  spieren: ['rug', 'bovenarm'],
  camera: { hoek: 66, hoogte: 11, afstand: 4.4, doel: { x: 0, y: 0.7, z: 0.4 } },
  tussen: 1,
})
