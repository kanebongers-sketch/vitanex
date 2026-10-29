// ─── Club, challenges: tekst voor op het scherm (PUUR) ──────────────────────

import type { ChallengeSoort } from '@/lib/club/challenges/model'
import type { ChallengeStatus } from '@/lib/club/challenges/periode'
import { LOCALE, type Taal } from '@/lib/aiyourgym/taal/taal'
import { CHALLENGES } from '@/lib/aiyourgym/taal/woorden/club/challenges'

/** "1 okt" | "1 Oct" uit yyyy-mm-dd. */
export function datumKort(dag: string, taal: Taal = 'nl'): string {
  return new Intl.DateTimeFormat(LOCALE[taal], { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${dag}T12:00:00Z`)).replace('.', '')
}

/** "1 okt tot en met 31 okt" | "1 Oct to 31 Oct". */
export function periodeTekst(start: string, eind: string, taal: Taal = 'nl'): string {
  return start === eind ? datumKort(start, taal) : CHALLENGES[taal].weergave.periode(datumKort(start, taal), datumKort(eind, taal))
}

/** Korte status: "nog 15 dagen", "start 1 nov", "afgelopen 30 sep". */
export function statusTekst(status: ChallengeStatus, start: string, eind: string, teGaan: number, taal: Taal = 'nl'): string {
  const t = CHALLENGES[taal].weergave
  if (status === 'gepland') return t.start(datumKort(start, taal))
  if (status === 'afgelopen') return t.afgelopen(datumKort(eind, taal))
  return teGaan === 1 ? t.laatsteDag : t.nogDagen(teGaan)
}

/** "12 bezoeken" | "12 visits". */
export function eenheidIn(soort: ChallengeSoort, n: number, taal: Taal = 'nl'): string {
  const info = CHALLENGES[taal].soort[soort]
  return `${n} ${n === 1 ? info.enkel : info.meer}`
}

/** "7 van 12 bezoeken". */
export function scoreTekst(soort: ChallengeSoort, score: number, doel: number, taal: Taal = 'nl'): string {
  return CHALLENGES[taal].weergave.score(score, eenheidIn(soort, doel, taal))
}
