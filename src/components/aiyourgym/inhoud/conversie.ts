// ─── AI Your Gym: geruststelling bij elke aanmeldknop (PUUR) ────────────────
// Teksten die een bezoeker over de streep helpen. Alleen wat Club echt doet;
// waar het staat:
// - geen opstartkosten (actie) en jaarcontract: besluit Kane 18-10-2026, zie .claude/CLAUDE.md
// - proefperiode: PROEFDAGEN in src/lib/aiyourgym/pakketten.ts, trial_period_days in stripe-api.ts
// - stoppen in de proefperiode kost niets: met Stripe start de eerste betaling pas
//   na trial_period_days (stripe-api.ts, abonnement.ts "Daarna start de eerste
//   betaling vanzelf"); met de testbetaling wordt niets afgeschreven
//   (testbetaling.ts). Zelfde belofte als VRAAG_CONTRACT in vertrouwen.ts.
// - NIET "geen creditcard nodig": zodra Stripe aan staat vraagt Checkout om
//   betaalgegevens (zie concurrenten-onderzoek, item 15).
// - gegevens van jou en exporteren: voorwaarden, src/lib/club/rapporten (ledenlijst, leads, uren als CSV)
// - persoonlijke hulp: de pakketten Club en Keten in pakketten.ts
// - database in Frankfurt: inhoud/vertrouwen.ts
// - ledenapp in eigen huisstijl in elk pakket: 'Ledenapp in je eigen huisstijl' in Start, de rest bouwt daarop
// - ledenimport met voorbeeld, nooit verwijderen: src/lib/club/leden/import
// - opvolgen met eigen drempels: src/lib/club/automatisering/regels.ts
// - uren goedkeuren en exporteren: src/lib/club/personeel/uren.ts, src/app/(aiyourgym)/api/club/personeel/uren/csv
// Geen prijzen, geen concurrenten bij naam, geen aantallen klanten of reviews.

import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'

/**
 * Korte zinnen die het risico wegnemen, vlak bij elke aanmeldknop. De eerste
 * drie staan onder elke knop (de grootste twijfels), de rest alleen in de
 * aanmeldband en op de prijzen- en demopagina.
 */
export const GERUSTSTELLING = [
  `${PROEFDAGEN} dagen gratis proberen`,
  'Stop je in de proefperiode, dan betaal je niets',
  'Nu geen opstartkosten',
  'Je gegevens blijven van jou',
  'Persoonlijke hulp in Club en Keten',
  'Data in de EU',
] as const
