// Vragen, types en pure helpers voor het wekelijkse reflectiemoment.
// Bewust zonder React: testbaar en herbruikbaar. Generieke week-helpers
// (bepaalWeekStart, berekenWekenOpRij) staan in '@/lib/utils/date-nl'.

export interface ReflectieVraag {
  id: string
  vraag: string
  placeholder: string
}

export const REFLECTIE_VRAGEN: readonly ReflectieVraag[] = [
  { id: 'hoogtepunt', vraag: 'Wat was het hoogtepunt van deze week?', placeholder: 'Het moment dat me het meest energiek maakte...' },
  { id: 'uitdaging', vraag: 'Wat was de grootste uitdaging?', placeholder: 'Iets wat me moeilijk afging of stress gaf...' },
  { id: 'leermoment', vraag: 'Wat heb ik geleerd of ontdekt over mezelf?', placeholder: 'Een inzicht, patroon of nieuwe vaardigheid...' },
  { id: 'energie', vraag: 'Wat gaf me energie? Wat kostte energie?', placeholder: 'Activiteiten, mensen of situaties die...' },
  { id: 'volgende_week', vraag: 'Wat wil ik volgende week anders doen?', placeholder: 'Eén concrete verandering of intentie...' },
  { id: 'dankbaarheid', vraag: 'Waar ben ik dankbaar voor deze week?', placeholder: 'Klein of groot, persoonlijk of professioneel...' },
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
