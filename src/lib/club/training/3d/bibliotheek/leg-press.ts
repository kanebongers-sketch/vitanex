// 3D-oefening: Leg press. Naam exact zoals in de oefenbibliotheek.

import { legPress } from '../bouw/benen'
import type { Oefening3d } from '../typen'

export const LEG_PRESS: Oefening3d = legPress({ naam: 'Leg press', hoek: 45 })
