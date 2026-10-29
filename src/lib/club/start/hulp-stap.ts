// ─── Club, startwizard: "Ik kom er niet uit" per stap (PUUR) ────────────────
// Een vraag vanuit een wizardstap wordt een gewone melding in het helpcentrum
// (club_support, via /api/club/hulp). Onderwerp en pagina staan al klaar, zodat
// Kane meteen ziet in welke stap iemand vastliep. Er gaat geen mail naar buiten.

import { GRENZEN, type MeldingSoort } from '@/lib/club/hulp/melding'
import { STAPPEN, stapInTaal } from './stappen'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { START_LIB } from '@/lib/aiyourgym/taal/woorden/club/start-lib'

/** Het pad dat bij de melding komt: de wizard zelf (een pad binnen Club, zonder query). */
export const HULP_PAGINA = '/club/start'

export interface HulpVoorStap {
  soort: MeldingSoort
  onderwerp: string
  pagina: string
}

/** Onderwerp en pagina voor een vraag uit stap `nummer` (buiten bereik: stap 1). */
export function hulpVoorStap(nummer: number, taal: Taal = 'nl'): HulpVoorStap {
  const index = Number.isInteger(nummer) && nummer >= 1 && nummer <= STAPPEN.length ? nummer - 1 : 0
  const stap = stapInTaal(STAPPEN[index], taal)
  const onderwerp = START_LIB[taal].hulpOnderwerp(index + 1, stap.titel)
  return { soort: 'vraag', onderwerp: onderwerp.slice(0, GRENZEN.onderwerp.max), pagina: HULP_PAGINA }
}

/** De body voor POST /api/club/hulp, met de eigen woorden van de eigenaar als beschrijving. */
export function hulpVerzoek(nummer: number, beschrijving: string, taal: Taal = 'nl'): HulpVoorStap & { beschrijving: string } {
  return { ...hulpVoorStap(nummer, taal), beschrijving: beschrijving.trim() }
}
