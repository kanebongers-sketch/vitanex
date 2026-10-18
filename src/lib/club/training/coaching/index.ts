// ─── Fit Factory Club, training: alle coaching bij elkaar (SERVER) ──────────
// Ongeveer 180 oefeningen met uitgebreide tekst: te zwaar om naar de browser te
// sturen. De pagina's halen de coaching van een oefening op via
// /api/club/training/coaching, alleen als die oefening open gaat.

import type { Coaching, CoachingBoek } from './typen'
import { COACHING_BENEN } from './benen'
import { COACHING_ROMP_BILLEN } from './romp-billen'
import { COACHING_DUWEN } from './duwen'
import { COACHING_TREKKEN } from './trekken'
import { COACHING_SCHOUDERS_CARDIO } from './schouders-cardio'
import { COACHING_BUIK } from './buik'
import { COACHING_AANVULLING_ONDER } from './aanvulling-onder'
import { COACHING_AANVULLING_BOVEN } from './aanvulling-boven'

export const COACHING_BOEKEN: readonly CoachingBoek[] = [
  COACHING_BENEN,
  COACHING_ROMP_BILLEN,
  COACHING_DUWEN,
  COACHING_TREKKEN,
  COACHING_SCHOUDERS_CARDIO,
  COACHING_BUIK,
  COACHING_AANVULLING_ONDER,
  COACHING_AANVULLING_BOVEN,
]

/** Sleutel zonder verschil in hoofdletters of dubbele spaties. */
export function coachingSleutel(naam: string): string {
  return naam.trim().replace(/\s+/g, ' ').toLowerCase()
}

const OP_NAAM: ReadonlyMap<string, Coaching> = new Map(
  COACHING_BOEKEN.flatMap((boek) => Object.entries(boek).map(([naam, c]) => [coachingSleutel(naam), c] as const)),
)

/** De coaching van een oefening op naam, of null als die (nog) niet geschreven is. */
export function coachingVoor(naam: string): Coaching | null {
  return OP_NAAM.get(coachingSleutel(naam)) ?? null
}
