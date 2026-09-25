// ─── LifeOS — is dit je eigen training? (puur) ──────────────────────────────
// Eén plek die beslist of een afspraak JOUW training is. Gedeeld door Vita
// ("korte nacht → houd je training lichter", "volle dag → train vanavond") en de
// dagplanning ("plan geen sportblok als je vandaag al traint").
//
// Bewust kort en conservatief: een gemiste training kost één advies, een
// verkeerd herkende training levert advies over iets dat geen training is.
//
// Een PT-sessie is NIET jouw training: "Joris - Personal training" of "Kevin PT"
// is jij die een klant traint. Zonder die uitzondering zag Vita elke PT-klant als
// jouw workout (het woord "training"), en zou de dagplanning je sportblok
// schrappen op elke dag dat je klanten hebt.

import { bevatReeks, woordTokens } from '@/lib/lifeos/crm/agenda-match'

const TRAINING_WOORDEN: readonly string[] = [
  // "Sporten (incl. reistijd)" is het blok dat LifeOS zélf inplant.
  'sporten',
  'training',
  'workout',
  'gym', // ook "gymmen"
  'sportschool',
  'fitness',
  'crossfit',
  'hardlopen',
  'hardloop',
]

/** Een PT-sessie met een klant: los woord "pt", of "personal training" voluit. */
function isPtSessie(titel: string): boolean {
  const t = woordTokens(titel)
  return t.includes('pt') || t.includes('personaltraining') || bevatReeks(t, ['personal', 'training'])
}

export function isEigenTraining(titel: string | null): boolean {
  if (!titel) return false
  if (isPtSessie(titel)) return false
  const klein = titel.toLowerCase()
  return TRAINING_WOORDEN.some((woord) => klein.includes(woord))
}
