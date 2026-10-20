// 3D-oefening: Leg curl zittend. Naam exact zoals in de oefenbibliotheek.

import { beenMachine } from '../bouw/benen'
import type { Oefening3d } from '../typen'

export const LEG_CURL_ZITTEND: Oefening3d = beenMachine({ naam: 'Leg curl zittend', variant: 'curl' })
