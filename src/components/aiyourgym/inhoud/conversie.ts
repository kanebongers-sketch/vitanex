// ─── AI Your Gym: geruststelling bij elke aanmeldknop (PUUR) ────────────────
// Teksten die een bezoeker over de streep helpen. Alleen wat Club echt doet;
// waar het staat:
// - geen opstartkosten (actie) en jaarcontract: besluit Kane 18-10-2026, zie .claude/CLAUDE.md
// - proefperiode: PROEFDAGEN in src/lib/aiyourgym/pakketten.ts, trial_period_days in stripe-api.ts
// - gegevens van jou en exporteren: voorwaarden, src/lib/club/rapporten (ledenlijst, leads, uren als CSV)
// - persoonlijke hulp: de pakketten Club en Keten in pakketten.ts
// - database in Frankfurt: inhoud/vertrouwen.ts
// - ledenapp in eigen huisstijl in elk pakket: 'Ledenapp in je eigen huisstijl' in Start, de rest bouwt daarop
// - ledenimport met voorbeeld, nooit verwijderen: src/lib/club/leden/import
// - opvolgen met eigen drempels: src/lib/club/automatisering/regels.ts
// - uren goedkeuren en exporteren: src/lib/club/personeel/uren.ts, src/app/(aiyourgym)/api/club/personeel/uren/csv
// Geen prijzen, geen concurrenten bij naam, geen aantallen klanten of reviews.

import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'

/** Korte zinnen die het risico wegnemen, vlak bij elke aanmeldknop. */
export const GERUSTSTELLING = [
  `${PROEFDAGEN} dagen gratis proberen`,
  'Nu geen opstartkosten',
  'Je gegevens blijven van jou',
  'Persoonlijke hulp in Club en Keten',
  'Data in de EU',
] as const
