// ─── MentaForce — canonieke streak ──────────────────────────────────────────
// Eén regel voor de hele app: de reeks loopt door tot de eerste échte gemiste
// dag, en een nog-open vandaag breekt 'm nooit af.
//
// Waarom vergevend: de harde variant (begin op vandaag, breek af als vandaag nog
// leeg is) liet je reeks élke ochtend op 0 staan tot je iets logde. Dat leest als
// "je bent je streak kwijt" en zet verliesangst in als drukmiddel — een dark
// pattern, precies op het moment dat je iemand niet moet straffen. In een
// welzijns-app is dat onacceptabel.
//
// Deze module is de enige bron voor die regel: /api/streak en lib/coach/nudges
// leiden er allebei uit af, zodat de regel niet opnieuw uiteen kan lopen.
//
// Puur: de dag-lookup wordt geïnjecteerd (in productie `datumMinusDagenNL` uit
// lib/utils/date-nl, dus NL-tijdzone), zodat dit testbaar is zonder klok-mocks.

/** Standaard-horizon: even ver terug als /api/streak zijn data ophaalt. */
const MAX_DAGEN = 90

/**
 * Aantal aaneengesloten actieve dagen, eindigend op vandaag óf gisteren.
 *
 * @param datums   Alle dagen met activiteit als 'YYYY-MM-DD'; duplicaten mogen.
 * @param dagTerug Datum van N dagen geleden als 'YYYY-MM-DD' (N = 0 is vandaag).
 * @param maxDagen Hoe ver we maximaal terugkijken. Houd dit gelijk aan het
 *                 datavenster van de caller: verder terugkijken dan je data
 *                 reikt, kapt de reeks af op een grens die niets betekent.
 */
export function berekenStreak(
  datums: Iterable<string>,
  dagTerug: (n: number) => string,
  maxDagen: number = MAX_DAGEN,
): number {
  const actief = new Set(datums)
  if (actief.size === 0) return 0

  // Vandaag nog niets gelogd? Dan is de dag simpelweg nog bezig — begin bij
  // gisteren in plaats van de reeks af te breken.
  const start = actief.has(dagTerug(0)) ? 0 : 1

  let streak = 0
  for (let i = start; i < maxDagen; i++) {
    if (!actief.has(dagTerug(i))) break
    streak++
  }
  return streak
}
