// ─── Club, health: wat een trainer van een lid ziet (SERVER-ONLY) ───────────
// Alleen wat het lid trainers laat zien: per soort (trainerZien) en, bij een
// bron met eigen regels (Strava), alleen als het lid die bron apart aanzette.
// De query vraagt alleen de toegestane soorten op; daarna valt per meting nog
// de bronregel weg. Altijd op de sportschool (user_id) en het lid.

import type { SupabaseClient } from '@supabase/supabase-js'
import { haalMetingen, haalToestemming } from './opslag'
import { laatstePerSoort } from './metingen'
import { filterVoorTrainer, trainerSoorten } from './toestemming'
import type { Meting } from './typen'

export interface TrainerBeeld {
  /** Heeft het lid trainers iets laten zien? Zo niet, dan is er niets te tonen. */
  heeftToestemming: boolean
  laatste: Meting[]
  recent: Meting[]
}

/** null bij een leesfout. */
export async function haalVoorTrainer(admin: SupabaseClient, userId: string, lidId: string): Promise<TrainerBeeld | null> {
  const toestemming = await haalToestemming(admin, userId, lidId)
  if (!toestemming) return null
  const soorten = trainerSoorten(toestemming)
  if (soorten.length === 0) return { heeftToestemming: false, laatste: [], recent: [] }
  const ruw = await haalMetingen(admin, userId, lidId, { soorten, limiet: 300 })
  if (!ruw) return null
  const zichtbaar = filterVoorTrainer(ruw, toestemming)
  return { heeftToestemming: true, laatste: laatstePerSoort(zichtbaar), recent: zichtbaar.slice(0, 20) }
}
