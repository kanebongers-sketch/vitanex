/**
 * Bepaalt vanaf welke dag een sync data ophaalt. Puur, zodat het testbaar is.
 */
import { datumDagenTerug, datumInNL } from './health-data'

/** Eerste sync: zoveel dagen terug. */
export const VOLLEDIGE_SYNC_DAGEN = 30
/** Incrementeel: altijd minstens zoveel dagen vóór de laatste sync opnieuw lezen. */
export const OVERLAP_DAGEN = 2

/**
 * Startdatum (YYYY-MM-DD, NL) van de sync: laatste sync min 2 dagen,
 * maar nooit verder terug dan 30 dagen en nooit later dan 2 dagen geleden.
 */
export function bepaalVanafDatum(laatsteSync: string | null, nu: Date = new Date()): string {
  const volledig = datumDagenTerug(VOLLEDIGE_SYNC_DAGEN, nu)
  const minimaal = datumDagenTerug(OVERLAP_DAGEN, nu)
  const tijd = laatsteSync ? Date.parse(laatsteSync) : NaN
  if (Number.isNaN(tijd) || tijd > nu.getTime()) return volledig

  const kandidaat = datumInNL(new Date(tijd - OVERLAP_DAGEN * 86_400_000))
  if (kandidaat < volledig) return volledig
  return kandidaat > minimaal ? minimaal : kandidaat
}
