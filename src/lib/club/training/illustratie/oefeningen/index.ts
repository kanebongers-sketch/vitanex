// ─── Fit Factory Club, illustraties: de oefeningen van het prototype ────────

import type { Oefening } from '../typen'
import { BACK_SQUAT, DEADLIFT, GOBLET_SQUAT, ROEMEENSE_DEADLIFT, WALKING_LUNGE } from './benen'
import { BANKDRUKKEN, LAT_PULLDOWN, SCHOUDERDRUKKEN, SEATED_CABLE_ROW } from './bovenlijf'
import { HIP_THRUST, LATERAL_RAISE, PLANK } from './romp'

/** De twaalf oefeningen van het prototype, in de volgorde van de vergelijkpagina. */
export const PROTOTYPE_OEFENINGEN: readonly Oefening[] = [
  BACK_SQUAT,
  GOBLET_SQUAT,
  ROEMEENSE_DEADLIFT,
  DEADLIFT,
  BANKDRUKKEN,
  SCHOUDERDRUKKEN,
  LAT_PULLDOWN,
  SEATED_CABLE_ROW,
  WALKING_LUNGE,
  HIP_THRUST,
  PLANK,
  LATERAL_RAISE,
]
