// ─── Fit Factory Club, taken: adressen (PUUR) ───────────────────────────────
// Week en vestiging staan in de URL (?v=budel&week=2026-W42), zodat elke
// weergave deelbaar is en terug/vooruit werkt.

import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'

export const TAKEN_WEERGAVEN = ['', 'vandaag', 'overzicht', 'beheer'] as const
export type TakenWeergave = (typeof TAKEN_WEERGAVEN)[number]

export const WEERGAVE_LABEL: Record<TakenWeergave, string> = {
  '': 'Week',
  vandaag: 'Vandaag',
  overzicht: 'Overzicht',
  beheer: 'Beheer',
}

/** Een weekparameter uit de URL, of null als hij ontbreekt of niet klopt. */
export function leesWeek(ruw: string | string[] | undefined): string | null {
  const w = Array.isArray(ruw) ? ruw[0] : ruw
  return typeof w === 'string' && /^\d{4}-W\d{2}$/.test(w) ? w : null
}

/** Adres van een weergave van de taken, met of zonder week. */
export function takenHref(weergave: TakenWeergave, vestiging: Vestiging, week?: string | null): string {
  return clubPad(weergave === '' ? '/taken' : `/taken/${weergave}`, vestiging, week ? { week } : undefined)
}
