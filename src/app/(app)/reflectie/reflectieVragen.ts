// Vragen, types en pure helpers voor het wekelijkse reflectiemoment.
// Bewust zonder React: testbaar en herbruikbaar. Generieke week-helpers
// (bepaalWeekStart, berekenWekenOpRij) staan in '@/lib/utils/date-nl'.

// De teksten staan in het woordenboek: mentaal.reflectie.vraag.<id> en
// mentaal.reflectie.placeholder.<id>.
export interface ReflectieVraag {
  id: string
}

export const REFLECTIE_VRAGEN: readonly ReflectieVraag[] = [
  { id: 'hoogtepunt' },
  { id: 'uitdaging' },
  { id: 'leermoment' },
  { id: 'energie' },
  { id: 'volgende_week' },
  { id: 'dankbaarheid' },
]

export interface ReflectieEntry {
  id: string
  week_start: string
  antwoorden: Record<string, string>
  aangemaakt_op: string
}

/** Index van de eerste nog lege vraag; alles ingevuld → 0 (rustig vooraan beginnen). */
export function eersteOpenVraag(antwoorden: Record<string, string>): number {
  const index = REFLECTIE_VRAGEN.findIndex(v => !antwoorden[v.id]?.trim())
  return index === -1 ? 0 : index
}
