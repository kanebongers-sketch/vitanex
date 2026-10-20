// 3D-oefening: Goblet squat. Naam exact zoals in de oefenbibliotheek.

import { squat } from '../bouw/benen'
import type { Oefening3d } from '../typen'

export const GOBLET_SQUAT: Oefening3d = squat({ naam: 'Goblet squat', last: 'goblet', diepte: 0.46, kantel: 26 })
