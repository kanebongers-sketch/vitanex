/**
 * Apple Health (HealthKit) via capacitor-health. Werkt alleen in de iOS-app;
 * in de browser en op Android geeft alles "niet beschikbaar" terug.
 *
 * Eerlijke beperking: capacitor-health 8.x leest op iOS alleen stappen,
 * actieve kcal en trainingen (met hartslag en afstand per training). Slaap,
 * rusthartslag, HRV, VO2max en gewicht kan deze plugin op iOS niet lezen;
 * daarvoor is een andere plugin nodig (zie rapport). We vullen dus alleen
 * wat de plugin echt levert en verzinnen niets.
 *
 * Voorwaarden in de native app: HealthKit-capability + entitlement en
 * NSHealthShareUsageDescription in Info.plist.
 */
import { Capacitor } from '@capacitor/core'
import type { HealthPermission, Workout } from 'capacitor-health'
import {
  alsVeld, bucketsPerDag, combineerPerDag, workoutMinutenPerDag, type Interval,
} from './health-aggregatie'
import { datumDagenTerug, middernachtNL, type DagMeting, type WorkoutMeting } from './health-data'
import { normaliseerSoort } from './health-validatie'

export const IOS_RECHTEN: HealthPermission[] = [
  'READ_STEPS', 'READ_ACTIVE_CALORIES', 'READ_WORKOUTS', 'READ_HEART_RATE', 'READ_DISTANCE',
]

export const isIosApp = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'

async function getPlugin() {
  if (!isIosApp()) return null
  const { Health } = await import('capacitor-health')
  return Health
}

/**
 * Vraag HealthKit-leesrechten. iOS vertelt nooit of iemand weigerde (privacy);
 * we weten het pas als een query leeg terugkomt.
 */
export async function vraagAppleHealthPermissies(): Promise<boolean> {
  const plugin = await getPlugin()
  if (!plugin) return false
  try {
    const { available } = await plugin.isHealthAvailable()
    if (!available) return false
    await plugin.requestHealthPermissions({ permissions: IOS_RECHTEN })
    return true
  } catch (err) {
    console.error('[apple-health] toestemming vragen', err)
    return false
  }
}

type Plugin = NonNullable<Awaited<ReturnType<typeof getPlugin>>>

async function leesDagBuckets(
  plugin: Plugin, dataType: 'steps' | 'active-calories', start: Date, eind: Date,
): Promise<Interval[]> {
  try {
    const res = await plugin.queryAggregated({
      startDate: start.toISOString(), endDate: eind.toISOString(), dataType, bucket: 'day',
    })
    return (res.aggregatedData ?? []).map(a => ({ start: a.startDate, eind: a.endDate, waarde: a.value }))
  } catch (err) {
    console.error(`[apple-health] ${dataType} lezen`, err)
    return []
  }
}

function gemiddeldeHartslag(w: Workout): number | null {
  const bpm = (w.heartRate ?? []).map(h => h.bpm).filter(b => Number.isFinite(b) && b > 0)
  return bpm.length > 0 ? bpm.reduce((a, b) => a + b, 0) / bpm.length : null
}

/** Een HealthKit-training naar ons formaat. */
export function workoutUitHealthKit(w: Workout): WorkoutMeting {
  return {
    externId: w.id ?? `${w.startDate}|${w.workoutType}`,
    soort: normaliseerSoort(w.workoutType),
    start: w.startDate,
    eind: w.endDate,
    kcal: Number.isFinite(w.calories) && w.calories > 0 ? w.calories : null,
    afstandM: w.distance !== undefined && w.distance > 0 ? w.distance : null,
    gemHartslag: gemiddeldeHartslag(w),
  }
}

async function leesWorkouts(plugin: Plugin, start: Date, eind: Date): Promise<WorkoutMeting[]> {
  try {
    const res = await plugin.queryWorkouts({
      startDate: start.toISOString(), endDate: eind.toISOString(),
      includeHeartRate: true, includeRoute: false, includeSteps: false,
    })
    return (res.workouts ?? []).map(workoutUitHealthKit)
  } catch (err) {
    console.error('[apple-health] trainingen lezen', err)
    return []
  }
}

/** Leest alles vanaf middernacht (NL) van `vanafDatum` tot nu, per dag. */
export async function leesAppleHealth(vanafDatum: string): Promise<{ dagen: DagMeting[]; workouts: WorkoutMeting[] }> {
  const plugin = await getPlugin()
  if (!plugin) return { dagen: [], workouts: [] }

  const start = middernachtNL(vanafDatum)
  const eind = new Date()
  const [stappen, actief, workouts] = await Promise.all([
    leesDagBuckets(plugin, 'steps', start, eind),
    leesDagBuckets(plugin, 'active-calories', start, eind),
    leesWorkouts(plugin, start, eind),
  ])

  const dagen = combineerPerDag(
    alsVeld('stappen', bucketsPerDag(stappen)),
    alsVeld('actieveKcal', bucketsPerDag(actief)),
    alsVeld('beweegminuten', workoutMinutenPerDag(workouts)),
  ).filter(d => d.datum >= vanafDatum)
  return { dagen, workouts }
}

/** Compatibele helper: de afgelopen N dagen (gebruikt door de stappen-pagina). */
export async function leesAppleHealthBereik(dagenTerug: number): Promise<DagMeting[]> {
  return (await leesAppleHealth(datumDagenTerug(dagenTerug))).dagen
}
