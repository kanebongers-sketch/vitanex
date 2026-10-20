// 3D-oefening: Squat met dumbbells. Naam exact zoals in de oefenbibliotheek.

import { squat } from '../bouw/benen'
import type { Oefening3d } from '../typen'

export const SQUAT_DUMBBELLS: Oefening3d = squat({ naam: 'Squat met dumbbells', last: 'halters', diepte: 0.5, kantel: 30, greep: 0.3, breedte: 0.14 })
