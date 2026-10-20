// 3D-oefening: Lunge met dumbbells. Naam exact zoals in de oefenbibliotheek.

import { lunge } from '../bouw/benen'
import type { Oefening3d } from '../typen'

export const LUNGE_DUMBBELLS: Oefening3d = lunge({ naam: 'Lunge met dumbbells', richting: 'voor', last: 'halters' })
