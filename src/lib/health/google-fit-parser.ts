/**
 * Parser voor Google Fit REST API-antwoorden naar DagMetingen.
 * Pure functies — geen netwerk — zodat dit volledig unit-testbaar is.
 */
import { datumInNL, type DagMeting } from './health-data'

/** Respons van users/me/dataset:aggregate met meerdere aggregateBy-types */
export interface FitAggregateRespons {
  bucket?: {
    startTimeMillis: string
    endTimeMillis: string
    dataset?: {
      dataSourceId?: string
      point?: {
        dataTypeName?: string
        value?: { intVal?: number; fpVal?: number }[]
      }[]
    }[]
  }[]
}

export interface FitSessie {
  startTimeMillis: string
  endTimeMillis: string
  activityType?: number
}

const DATATYPE_NAAR_VELD: Record<string, keyof Omit<DagMeting, 'datum'>> = {
  'com.google.step_count.delta': 'stappen',
  'com.google.heart_rate.summary': 'hartslag',
  'com.google.calories.expended': 'calorieen',
}

/**
 * Zet de bucket-respons (één bucket per dag) om naar DagMetingen.
 * Stappen en calorieën worden per dag opgeteld; hartslag is het gemiddelde
 * van de summary-punten (value[0] = gemiddelde bpm).
 */
export function parseFitAggregaten(respons: FitAggregateRespons): DagMeting[] {
  return (respons.bucket ?? []).map(bucket => {
    const meting: DagMeting = { datum: datumInNL(new Date(Number(bucket.startTimeMillis))) }
    const hartslagWaarden: number[] = []

    for (const dataset of bucket.dataset ?? []) {
      for (const punt of dataset.point ?? []) {
        const veld = punt.dataTypeName ? DATATYPE_NAAR_VELD[punt.dataTypeName] : undefined
        if (!veld) continue
        const waarde = punt.value?.[0]?.intVal ?? punt.value?.[0]?.fpVal
        if (waarde === undefined) continue

        if (veld === 'hartslag') {
          hartslagWaarden.push(waarde)
        } else {
          meting[veld] = (meting[veld] ?? 0) + waarde
        }
      }
    }

    if (hartslagWaarden.length > 0) {
      meting.hartslag = hartslagWaarden.reduce((a, b) => a + b, 0) / hartslagWaarden.length
    }
    return meting
  })
}

/**
 * Telt slaapsessies (activityType 72) op per dag. Een nacht wordt toegekend
 * aan de dag waarop je wakker wordt — zoals Apple Health en Fitbit dat doen.
 */
export function parseFitSlaapSessies(sessies: FitSessie[]): DagMeting[] {
  const perDatum = new Map<string, number>()

  for (const sessie of sessies) {
    if (sessie.activityType !== undefined && sessie.activityType !== 72) continue
    const start = Number(sessie.startTimeMillis)
    const eind = Number(sessie.endTimeMillis)
    if (!Number.isFinite(start) || !Number.isFinite(eind) || eind <= start) continue

    const datum = datumInNL(new Date(eind))
    const minuten = Math.round((eind - start) / 60000)
    perDatum.set(datum, (perDatum.get(datum) ?? 0) + minuten)
  }

  return [...perDatum.entries()].map(([datum, slaapMinuten]) => ({ datum, slaapMinuten }))
}

/**
 * Combineert meerdere lijsten DagMetingen tot één meting per datum
 * (latere lijsten vullen lege velden aan).
 */
export function combineerDagMetingen(...lijsten: DagMeting[][]): DagMeting[] {
  const perDatum = new Map<string, DagMeting>()
  for (const lijst of lijsten) {
    for (const m of lijst) {
      const bestaand = perDatum.get(m.datum) ?? { datum: m.datum }
      perDatum.set(m.datum, {
        datum: m.datum,
        stappen: m.stappen ?? bestaand.stappen,
        slaapMinuten: m.slaapMinuten ?? bestaand.slaapMinuten,
        hartslag: m.hartslag ?? bestaand.hartslag,
        calorieen: m.calorieen ?? bestaand.calorieen,
      })
    }
  }
  return [...perDatum.values()].sort((a, b) => a.datum.localeCompare(b.datum))
}
