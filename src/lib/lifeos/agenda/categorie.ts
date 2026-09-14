// ─── LifeOS — agenda in categorieën ─────────────────────────────────────────
// Elke afspraak hoort in één bak: de vier CRM-groepen (PT-klant, PT-team,
// Management, Team Budel), "Persoonlijk", of "Overig" (het wegfilter-vak).
//
// De categorie leidt PUUR af uit de naam-koppeling die we al hebben: matcht de
// titel eenduidig één persoon, dan is de categorie de groep van die persoon.
// Matcht er niets (of meerdere → geen gok), dan valt de afspraak in "Overig" —
// het vak dat je kunt wegfilteren en waaruit LifeOS leert (later).
//
// "Persoonlijk" is (nog) geen auto-uitkomst: er is geen betrouwbaar signaal om
// "tandarts" van "overig" te onderscheiden. Het is een LEER-categorie: je wijst 'm
// toe en LifeOS onthoudt het. De categorie bestaat hier al zodat de UI en het leren
// erop kunnen bouwen; de auto-afleiding levert 'm nooit uit zichzelf op.

import type { Persoon, Groep } from '@/lib/lifeos/crm/crm'
import { groepDef } from '@/lib/lifeos/crm/crm'
import { matchPersoonInTitel } from '@/lib/lifeos/crm/agenda-match'

/** Een categorie: een CRM-groep, of één van de twee afgeleide bakken. */
export type AgendaCategorie = Groep | 'persoonlijk' | 'overig'

/** De vaste volgorde waarin de bakken getoond worden. "Overig" hoort achteraan. */
export const CATEGORIE_VOLGORDE: readonly AgendaCategorie[] = [
  'pt_klant',
  'pt_team',
  'management',
  'budel_team',
  'persoonlijk',
  'overig',
]

/** Het label per categorie. De groepen erven hun CRM-label; de twee extra's staan hier. */
export function categorieLabel(categorie: AgendaCategorie): string {
  if (categorie === 'persoonlijk') return 'Persoonlijk'
  if (categorie === 'overig') return 'Overig'
  return groepDef(categorie).label
}

/**
 * De auto-categorie van een afspraak-titel. Eenduidige match → de groep van die
 * persoon; anders "Overig". Nooit een gok bij twijfel (ambigu → Overig), en nooit
 * "Persoonlijk" uit zichzelf — dat is een leer-categorie (zie de kop).
 */
export function categoriseerAfspraak(titel: string | null, personen: readonly Persoon[]): AgendaCategorie {
  const match = matchPersoonInTitel(titel, personen)
  return match.soort === 'match' ? match.persoon.groep : 'overig'
}
