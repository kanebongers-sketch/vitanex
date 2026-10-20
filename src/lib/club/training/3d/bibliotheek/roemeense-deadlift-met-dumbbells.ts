// 3D-oefening: Roemeense deadlift met dumbbells. Naam exact zoals in de oefenbibliotheek.

import { hinge } from '../bouw/benen'
import type { Oefening3d } from '../typen'

export const RDL_DUMBBELLS: Oefening3d = hinge({ naam: 'Roemeense deadlift met dumbbells', last: 'halters', kantel: 68, heup: 0.86, greep: 0.2 })
