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

/**
 * Overstappen in drie stappen, kort voor de voorpagina. Waar het staat:
 * - CSV inlezen met herkende kolommen en eerst een overzicht: src/lib/club/leden/import (kolommen.ts, plan.ts)
 * - startwizard: src/lib/club/start/stappen.ts (samen START_MINUTEN, binnen een kwartier)
 * - leden op de app: uitnodiging per mail en de poster met QR (src/lib/club/app-uitnodigen, /club/leden/app-poster)
 */
export const OVERSTAP_STAPPEN: readonly OverstapStap[] = [
  {
    titel: 'Ledenlijst inlezen',
    tekst: 'Exporteer je leden als CSV uit je huidige systeem of uit Excel. Gangbare kolommen worden herkend en je ziet eerst wat er verandert.',
  },
  {
    titel: 'Startwizard doorlopen',
    tekst: 'De wizard zet huisstijl, vestiging, lessen en team voor je klaar, samen in ongeveer een kwartier.',
  },
  {
    titel: 'Leden op de app',
    tekst: 'Leden krijgen een mail met een link om eenmalig hun wachtwoord te kiezen, of scannen de QR-code op de poster bij de balie. Daarna loggen ze in met e-mailadres en wachtwoord.',
  },
]

/** Ook gebruikt op de prijzenpagina: het antwoord over vastzitten en betalen. */
export const VRAAG_CONTRACT: VeelgesteldeVraag = {
  vraag: 'Zit ik ergens aan vast?',
  antwoord: `Je begint met ${PROEFDAGEN} dagen gratis in je eigen omgeving. Stop je in die tijd, dan betaal je niets. Ga je door, dan loopt je abonnement een jaar en betaal je per maand, per vestiging. Opstartkosten rekenen we nu niet. Het bedrag zie je altijd voordat je iets betaalt.`,
}

/** Ook gebruikt op de prijzenpagina: van wie de gegevens zijn. */
export const VRAAG_GEGEVENS: VeelgesteldeVraag = {
  vraag: 'Van wie zijn mijn gegevens, en krijg ik ze mee?',
  antwoord:
    'Van jou. AI Your Gym gebruikt ze alleen om de software voor jou te laten werken. De ledenlijst, leads, bezoek, bezetting en gewerkte uren exporteer je als CSV via de rapporten, en per lid download je alle gegevens van de ledenkaart.',
}
