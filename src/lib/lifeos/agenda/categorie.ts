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
  'marketing',
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

// ─── Leren van jouw herindeling ─────────────────────────────────────────────
// Wijs je een afspraak zelf een categorie toe, dan onthoudt LifeOS dat per
// GENORMALISEERDE titel: elke volgende afspraak met dezelfde titel valt dan in
// dezelfde bak. Zo generaliseert de correctie ("Tandarts" → Persoonlijk) i.p.v. per
// losse afspraak. Jouw regel WINT van de auto-categorie, zodat je ook een foute
// auto-match kunt rechtzetten.

/** Titel → vergelijkbare sleutel: lowercase, witruimte samengevouwen, getrimd. */
export function normaliseerTitel(titel: string | null): string {
  return (titel ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * De categorie mét jouw geleerde regels. Is er een regel voor deze (genormaliseerde)
 * titel, dan wint die; anders de auto-afleiding. Een lege titel heeft geen regel.
 */
export function categoriseerMet(
  titel: string | null,
  personen: readonly Persoon[],
  regels: ReadonlyMap<string, AgendaCategorie>,
): AgendaCategorie {
  const norm = normaliseerTitel(titel)
  const regel = norm ? regels.get(norm) : undefined
  return regel ?? categoriseerAfspraak(titel, personen)
}

// ─── JSON over de draad ─────────────────────────────────────────────────────
// Gedeeld door de route (schrijft) en het bord (leest). Narrowen aan de grens:
// een onbekende categorie wordt "overig", nooit een cast.

/** Eén afspraak met zijn categorie, zoals de API 'm teruggeeft. */
export interface CategorieEventJson {
  id: string
  titel: string | null
  startOp: string
  eindOp: string | null
  heleDag: boolean
  categorie: AgendaCategorie
}

export type CategorieAntwoord =
  | { gekoppeld: false }
  | { gekoppeld: true; events: CategorieEventJson[] }

function isCategorie(v: unknown): v is AgendaCategorie {
  return typeof v === 'string' && (CATEGORIE_VOLGORDE as readonly string[]).includes(v)
}

function leesEvent(ruw: unknown): CategorieEventJson | null {
  if (typeof ruw !== 'object' || ruw === null) return null
  const o = ruw as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.startOp !== 'string') return null
  return {
    id: o.id,
    titel: typeof o.titel === 'string' ? o.titel : null,
    startOp: o.startOp,
    eindOp: typeof o.eindOp === 'string' ? o.eindOp : null,
    heleDag: o.heleDag === true,
    // Onbekende categorie valt terug op "overig" — nooit de UI laten omvallen.
    categorie: isCategorie(o.categorie) ? o.categorie : 'overig',
  }
}

/** Leest het API-antwoord, narrowend. `null` = onbruikbaar antwoord. */
export function leesCategorieAntwoord(ruw: unknown): CategorieAntwoord | null {
  if (typeof ruw !== 'object' || ruw === null) return null
  const o = ruw as Record<string, unknown>
  if (o.gekoppeld === false) return { gekoppeld: false }
  if (o.gekoppeld !== true || !Array.isArray(o.events)) return null
  const events: CategorieEventJson[] = []
  for (const rij of o.events) {
    const event = leesEvent(rij)
    if (event) events.push(event)
  }
  return { gekoppeld: true, events }
}
