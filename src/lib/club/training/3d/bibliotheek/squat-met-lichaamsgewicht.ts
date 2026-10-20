// 3D-oefening: Squat met lichaamsgewicht. Naam exact zoals in de oefenbibliotheek.

import { squat } from '../bouw/benen'
import type { Oefening3d } from '../typen'

export const SQUAT_LICHAAMSGEWICHT: Oefening3d = squat({
  naam: 'Squat met lichaamsgewicht',
  last: 'armenVooruit',
  diepte: 0.48,
  kantel: 30,
  camera: { hoek: 58, hoogte: 10, afstand: 4.2, doel: { x: 0, y: 0.86, z: 0.12 } },
})
