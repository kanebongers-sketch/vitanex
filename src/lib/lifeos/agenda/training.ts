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

import { woordTokens } from '@/lib/lifeos/crm/agenda-match'
import { isPtTitel } from '@/lib/lifeos/pt-klant/pt-klant'

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

export function isEigenTraining(titel: string | null): boolean {
  if (!titel) return false
  // Een PT-sessie met een klant (zelfde regel als de PT-weekstatus).
  if (isPtTitel(woordTokens(titel))) return false
  const klein = titel.toLowerCase()
  return TRAINING_WOORDEN.some((woord) => klein.includes(woord))
}
