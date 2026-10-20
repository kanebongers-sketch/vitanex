// 3D-oefening: Split squat met dumbbells. Naam exact zoals in de oefenbibliotheek.

import { lunge } from '../bouw/benen'
import type { Oefening3d } from '../typen'

export const SPLIT_SQUAT_DB: Oefening3d = lunge({ naam: 'Split squat met dumbbells', richting: 'plek', last: 'halters', pas: 0.78 })
