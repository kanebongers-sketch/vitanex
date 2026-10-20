// 3D-oefening: Hip thrust met barbell. Naam exact zoals in de oefenbibliotheek.

import { heupstrek } from '../bouw/benen'
import type { Oefening3d } from '../typen'

export const HIP_THRUST: Oefening3d = heupstrek({ naam: 'Hip thrust met barbell', steun: 'bank', last: 'stang' })
