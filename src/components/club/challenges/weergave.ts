// ─── Club, challenges: tekst voor op het scherm (PUUR) ──────────────────────

import { eenheidTekst, type ChallengeSoort } from '@/lib/club/challenges/model'
import type { ChallengeStatus } from '@/lib/club/challenges/periode'

const KORT = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/** "1 okt" uit yyyy-mm-dd. */
export function datumKort(dag: string): string {
  return KORT.format(new Date(`${dag}T12:00:00Z`)).replace('.', '')
}

/** "1 okt tot en met 31 okt". */
export function periodeTekst(start: string, eind: string): string {
  return start === eind ? datumKort(start) : `${datumKort(start)} tot en met ${datumKort(eind)}`
}

/** Korte status: "nog 15 dagen", "start 1 nov", "afgelopen 30 sep". */
export function statusTekst(status: ChallengeStatus, start: string, eind: string, teGaan: number): string {
  if (status === 'gepland') return `Start ${datumKort(start)}`
  if (status === 'afgelopen') return `Afgelopen ${datumKort(eind)}`
  return teGaan === 1 ? 'Laatste dag' : `Nog ${teGaan} dagen`
}

/** "7 van 12 bezoeken". */
export function scoreTekst(soort: ChallengeSoort, score: number, doel: number): string {
  return `${score} van ${eenheidTekst(soort, doel)}`
}
