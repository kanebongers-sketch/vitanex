// Vragen, types en pure datum-/ritme-helpers voor het wekelijkse
// reflectiemoment. Bewust zonder React: testbaar en herbruikbaar.

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

function alsLokaleDatumString(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

/**
 * Maandag van de week waarin `nu` valt, als 'YYYY-MM-DD'.
 * - Ook op zondag (getDay() === 0) blijft dit de HUIDIGE week.
 * - Lokale datumdelen: toISOString() (UTC) schuift rond middernacht lokale
 *   tijd een dag terug en schreef dan naar de vórige week.
 */
export function bepaalWeekStart(nu: Date): string {
  const d = new Date(nu)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return alsLokaleDatumString(d)
}

function vorigeWeek(weekStart: string): string {
  const [jaar, maand, dag] = weekStart.split('-').map(Number)
  return alsLokaleDatumString(new Date(jaar, maand - 1, dag - 7))
}

/**
 * Aantal aaneengesloten weken (t/m nu) met een reflectie, op basis van de al
 * opgehaalde entries. Is er deze week nog niets opgeslagen, dan telt de reeks
 * vanaf vorige week — zo blijft het ritme zichtbaar terwijl je invult.
 */
export function berekenWekenOpRij(
  weekStarts: readonly string[],
  huidigeWeekStart: string,
): number {
  const bekend = new Set(weekStarts)
  let cursor = bekend.has(huidigeWeekStart) ? huidigeWeekStart : vorigeWeek(huidigeWeekStart)
  let aantal = 0
  while (bekend.has(cursor)) {
    aantal += 1
    cursor = vorigeWeek(cursor)
  }
  return aantal
}

/** Index van de eerste nog lege vraag; alles ingevuld → 0 (rustig vooraan beginnen). */
export function eersteOpenVraag(antwoorden: Record<string, string>): number {
  const index = REFLECTIE_VRAGEN.findIndex(v => !antwoorden[v.id]?.trim())
  return index === -1 ? 0 : index
}
