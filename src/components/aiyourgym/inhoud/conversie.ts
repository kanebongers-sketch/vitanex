// ─── AI Your Gym: geruststelling bij elke aanmeldknop (PUUR) ────────────────
// Teksten die een bezoeker over de streep helpen. Alleen wat Club echt doet;
// waar het staat:
// - geen opstartkosten (actie) en jaarcontract: besluit Kane 18-10-2026, zie .claude/CLAUDE.md
// - geen proefperiode (besluit Kane 30-10-2026: "je gebruikt het of je doet het
//   niet"): na het aanmelden betaal je meteen via Stripe. Dus geen zinnen over
//   gratis proberen of kosteloos stoppen. De live demo en een demo aanvragen
//   blijven, dat is geen proefperiode.
// - NIET "geen creditcard nodig": Checkout vraagt om betaalgegevens.
// - gegevens van jou en exporteren: voorwaarden, src/lib/club/rapporten (ledenlijst, leads, uren als CSV)
// - persoonlijke hulp bij het inrichten (koers Kane 18-10-2026; welke pakketten
//   hem gratis krijgen beslist Kane bij de prijzen, daarom geen pakketnamen)
// - database in Frankfurt: inhoud/vertrouwen.ts
// - ledenbestand inlezen met Excel of CSV: src/lib/club/leden/import (geen tijdsclaim voor de wizard: niet gemeten)
// - ledenapp in eigen huisstijl in elk pakket: 'Ledenapp in je eigen huisstijl' in Start, de rest bouwt daarop
// - ledenimport met voorbeeld, nooit verwijderen: src/lib/club/leden/import
// - opvolgen met eigen drempels: src/lib/club/automatisering/regels.ts
// - uren goedkeuren en exporteren: src/lib/club/personeel/uren.ts, src/app/(aiyourgym)/api/club/personeel/uren/csv
// Geen prijzen, geen concurrenten bij naam, geen aantallen klanten of reviews.

/**
 * Korte zinnen die het risico wegnemen, vlak bij elke aanmeldknop. De eerste
 * drie staan onder elke knop (de grootste twijfels), de rest alleen in de
 * aanmeldband en op de prijzen- en demopagina.
 */
export const GERUSTSTELLING = [
  'Nu geen opstartkosten',
  'Je gegevens blijven van jou',
  'Data in de EU',
  'Persoonlijke hulp bij het inrichten',
  'Ledenbestand inlezen met Excel of CSV',
] as const
