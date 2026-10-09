/**
 * Verrijkt Health Connect-trainingen met kcal, afstand en gemiddelde hartslag.
 * Health Connect bewaart die niet op de sessie zelf; we aggregeren ze over
 * het tijdvenster van elke training. Plugin-onafhankelijk (de lezer wordt
 * meegegeven), zodat dit testbaar is.
 */
import type { Interval } from './health-aggregatie'
import type { WorkoutMeting } from './health-data'

export type AggregaatType = 'Steps' | 'Distance' | 'TotalCaloriesBurned' | 'ActiveCaloriesBurned' | 'HeartRate'
export type BucketLezer = (type: AggregaatType, start: Date, eind: Date) => Promise<Interval[]>

/** Begrenst het aantal native calls: alleen de recentste trainingen verrijken. */
export const MAX_TE_VERRIJKEN = 40

function eersteWaarde(buckets: Interval[]): number | null {
  const som = buckets.reduce((s, b) => s + (Number.isFinite(b.waarde) ? b.waarde : 0), 0)
  return som > 0 ? som : null
}

async function verrijk(w: WorkoutMeting, lees: BucketLezer): Promise<WorkoutMeting> {
  const start = new Date(w.start)
  const eind = new Date(w.eind)
  const [kcal, afstand, hartslag] = await Promise.all([
    lees('ActiveCaloriesBurned', start, eind),
    lees('Distance', start, eind),
    lees('HeartRate', start, eind),
  ])
  const gemHartslag = hartslag.find(b => b.waarde > 0)?.waarde ?? null
  return { ...w, kcal: eersteWaarde(kcal), afstandM: eersteWaarde(afstand), gemHartslag }
}

/** Verrijkt de recentste trainingen; de rest gaat ongewijzigd mee. */
export async function verrijkWorkouts(workouts: WorkoutMeting[], lees: BucketLezer): Promise<WorkoutMeting[]> {
  const gesorteerd = [...workouts].sort((a, b) => b.start.localeCompare(a.start))
  const teVerrijken = gesorteerd.slice(0, MAX_TE_VERRIJKEN)
  const rest = gesorteerd.slice(MAX_TE_VERRIJKEN)
  // Eén training tegelijk: houdt het aantal gelijktijdige native calls laag.
  const verrijkt: WorkoutMeting[] = []
  for (const w of teVerrijken) {
    verrijkt.push(await verrijk(w, lees))
  }
  return [...verrijkt, ...rest]
}
