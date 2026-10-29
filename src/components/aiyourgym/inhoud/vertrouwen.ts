// ─── AI Your Gym: start en vragen (PUUR) ────────────────────────────────────
// Teksten voor "Zo simpel start je" en de vragen op de prijzenpagina. Alleen
// wat echt zo is gebouwd:
// - database in Frankfurt: docs/club/LIVEGANG.md (Supabase eu-central-1)
// - gescheiden data: elke club_*-query filtert op de sportschool (src/lib/club/toegang.ts)
// - gehashte wachtwoorden en blokkade: src/lib/club/ledenlogin/opslag.ts
// - gezondheid alleen met toestemming: src/lib/club/training/intake.ts, voortgang/meting.ts
// - export en verwijderen per lid: src/lib/club/leden/avg (ledenkaart, 30 dagen, dan definitief)

import { STAPPEN } from '@/lib/club/start/stappen'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'

export interface StartStap {
  nr: number
  titel: string
  kort: string
}

/** De stappen van de startwizard, uit Club zelf. */
export const START_STAPPEN: readonly StartStap[] = STAPPEN.map((s, i) => ({ nr: i + 1, titel: s.titel, kort: s.kort }))

/** Hoe lang de wizard samen ongeveer duurt, in minuten (uit Club). */
export const START_MINUTEN = STAPPEN.reduce((som, s) => som + s.minuten, 0)

export interface VeelgesteldeVraag {
  vraag: string
  antwoord: string
}

export interface OverstapStap {
  titel: string
  tekst: string
}

/** Ook gebruikt op de prijzenpagina: het antwoord over vastzitten en betalen. */
export const VRAAG_CONTRACT: VeelgesteldeVraag = {
  vraag: 'Zit ik ergens aan vast?',
  antwoord: `Je start met ${PROEFDAGEN} dagen gratis. Stop je, dan betaal je niets. Ga je door: een jaarabonnement, per maand betaald per vestiging. Nu geen opstartkosten, en je ziet het bedrag altijd vooraf.`,
}

/** Ook gebruikt op de prijzenpagina: van wie de gegevens zijn. */
export const VRAAG_GEGEVENS: VeelgesteldeVraag = {
  vraag: 'Van wie zijn mijn gegevens, en krijg ik ze mee?',
  antwoord:
    'Van jou. We gebruiken ze alleen om de software te laten werken. Ledenlijst, leads, bezoek en uren exporteer je als CSV, en per lid download je alle gegevens.',
}
