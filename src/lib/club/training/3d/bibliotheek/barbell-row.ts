// 3D-oefening: Barbell row. Naam exact zoals in de oefenbibliotheek.

import { armOefening, LICHAAM } from '../bouw/boven'
import type { Oefening3d } from '../typen'

export const BARBELL_ROW: Oefening3d = armOefening({
  naam: 'Barbell row',
  lichaam: { ...LICHAAM.voorover, kantel: 52 },
  van: { dx: 0.09, dy: -0.6, dz: 0.06 },
  naar: { dx: 0.09, dy: -0.31, dz: -0.08 },
  balans: 0.04,
  enkel: { x: 0.13, y: 0.08, z: 0 },
  elleboogRichting: { x: 0.35, y: 0.5, z: -0.8 },
  materiaal: [{ soort: 'stang', schijven: 2 }],
  spieren: ['rug', 'bovenarm'],
  camera: { hoek: 64, hoogte: 9, afstand: 4.3, doel: { x: 0, y: 0.8, z: 0.05 } },
  tussen: 1,
})
