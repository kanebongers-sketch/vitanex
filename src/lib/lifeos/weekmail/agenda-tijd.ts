// ─── LifeOS — waar ging je agenda-tijd heen? (puur) ─────────────────────────
// Voor de weekmail: de afspraken van de afgelopen week, per categorie opgeteld
// (PT-klant, PT-team, Management, …). Dezelfde categorieën als op het
// categorieën-scherm, inclusief je eigen geleerde regels.
//
// Eerlijk: alleen afspraken met een begin én eind tellen. Hele-dag-events
// (vakantie, verjaardag) zijn geen bestede uren en blijven erbuiten; een event
// zonder eind verzinnen we geen duur bij.

import type { Persoon } from '@/lib/lifeos/crm/crm'
import type { Afspraak } from '@/lib/lifeos/agenda/vrije-blokken'
import { CATEGORIE_VOLGORDE, categorieLabel, categoriseerMet, type AgendaCategorie } from '@/lib/lifeos/agenda/categorie'

/** Een afspraak langer dan dit is vrijwel zeker een blok-markering, geen bestede tijd. */
const MAX_MINUTEN_PER_AFSPRAAK = 12 * 60

export interface CategorieTijd {
  categorie: AgendaCategorie
  label: string
  minuten: number
}

export function tijdPerCategorie(
  afspraken: readonly Afspraak[],
  personen: readonly Persoon[],
  regels: ReadonlyMap<string, AgendaCategorie>,
): CategorieTijd[] {
  const per = new Map<AgendaCategorie, number>()
  for (const a of afspraken) {
    if (a.heleDag || a.eindOp === null) continue
    const minuten = Math.round((a.eindOp.getTime() - a.startOp.getTime()) / 60_000)
    if (minuten <= 0) continue
    const categorie = categoriseerMet(a.titel, personen, regels)
    per.set(categorie, (per.get(categorie) ?? 0) + Math.min(minuten, MAX_MINUTEN_PER_AFSPRAAK))
  }
  return [...per.entries()]
    .map(([categorie, minuten]) => ({ categorie, label: categorieLabel(categorie), minuten }))
    .sort((a, b) => b.minuten - a.minuten || CATEGORIE_VOLGORDE.indexOf(a.categorie) - CATEGORIE_VOLGORDE.indexOf(b.categorie))
}
