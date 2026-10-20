// 3D-oefening: Roemeense deadlift met barbell. Naam exact zoals in de oefenbibliotheek.

import { hinge } from '../bouw/benen'
import type { Oefening3d } from '../typen'

export const RDL_BARBELL: Oefening3d = hinge({ naam: 'Roemeense deadlift met barbell', last: 'stang', kantel: 70, heup: 0.86, greep: 0.24 })
