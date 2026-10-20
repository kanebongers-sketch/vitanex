// 3D-oefening: Achterwaartse lunge met dumbbells. Naam exact zoals in de oefenbibliotheek.

import { lunge } from '../bouw/benen'
import type { Oefening3d } from '../typen'

export const ACHTERWAARTSE_LUNGE_DB: Oefening3d = lunge({ naam: 'Achterwaartse lunge met dumbbells', richting: 'achter', last: 'halters' })
