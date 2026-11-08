// ─── Club: welk figuur staat er in de oefenbeelden van een sportschool (SERVER) ─
// Besluit Kane (06-11-2026): Fit Factory ziet het figuur kane, elke andere
// sportschool neutraal. De keuze volgt alleen het id van de sportschool uit de
// sessie (club_organisaties.id), nooit iets uit de URL, een cookie of een veld dat
// een gebruiker kan zetten. Op het id en niet op de slug: Fit Factory heeft het
// bestaande id (LIFEOS_USER_ID). Ontbreekt dat id, dan neutraal.
// Alleen op de server aanroepen: LIFEOS_USER_ID gaat niet mee naar de browser.

import type { OefenFiguur } from '@/components/aiyourgym/inhoud/oefenrenders'

export function figuurVanSportschool(sportschoolId: string, fitFactoryId: string | undefined = process.env.LIFEOS_USER_ID): OefenFiguur {
  return fitFactoryId && sportschoolId === fitFactoryId ? 'kane' : 'neutraal'
}
