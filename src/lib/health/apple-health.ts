/**
 * Apple Health (HealthKit) via @capgo/capacitor-health. Werkt alleen in de
 * iOS-app; in de browser en op Android geeft alles "niet beschikbaar" terug.
 *
 * Leest per dag: stappen, afstand, actieve kcal, gemiddelde hartslag,
 * rusthartslag, HRV (SDNN, zie health-data.ts), VO2max, gewicht, ademhaling,
 * zuurstof, slaap (met fases en bed-/wektijd) en trainingen. De omzetting zelf
 * staat (getest) in apple-health-parser.ts; we vullen alleen wat HealthKit
 * echt heeft en verzinnen niets.
 *
 * Voorwaarden in de native app: HealthKit-capability + entitlement en
 * NSHealthShareUsageDescription in Info.plist (zie docs/apple-health.md).
 */
import { Capacitor } from '@capacitor/core'
import type { HealthDataType, HealthSample } from '@capgo/capacitor-health'
import {
  alsVeld, bucketsPerDag, combineerPerDag, puntenPerDag, slaapPerNacht, workoutMinutenPerDag, type Interval,
} from './health-aggregatie'
import {
  alsProcent, intervallenUitAggregaat, puntenUitSamples, slaapSessiesUitHealthKit, workoutUitHealthKit,
} from './apple-health-parser'
import { datumDagenTerug, middernachtNL, type DagMeting, type WorkoutMeting } from './health-data'

export { workoutUitHealthKit } from './apple-health-parser'

/** Wat MentaForce uit Apple Health leest (ook de lijst die we als "rechten" opslaan). */
export const IOS_RECHTEN: HealthDataType[] = [
  'steps', 'distance', 'calories', 'heartRate', 'restingHeartRate', 'heartRateVariability',
  'vo2Max', 'weight', 'respiratoryRate', 'oxygenSaturation', 'sleep', 'workouts',
]

/** Ruim boven wat er in het syncvenster (max. 62 dagen) aan samples kan zijn. */
const MAX_SAMPLES = 10_000

export const isIosApp = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'

async function getPlugin() {
  if (!isIosApp()) return null
  const { Health } = await import('@capgo/capacitor-health')
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
    const { available } = await plugin.isAvailable()
    if (!available) return false
    await plugin.requestAuthorization({ read: IOS_RECHTEN })
    return true
  } catch (err) {
    console.error('[apple-health] toestemming vragen', err)
    return false
  }
}

type Plugin = NonNullable<Awaited<ReturnType<typeof getPlugin>>>

async function leesDagBuckets(
  plugin: Plugin, dataType: HealthDataType, aggregation: 'sum' | 'average', start: Date, eind: Date,
): Promise<Interval[]> {
  try {
    const res = await plugin.queryAggregated({
      dataType, aggregation, bucket: 'day', startDate: start.toISOString(), endDate: eind.toISOString(),
    })
    return intervallenUitAggregaat(res.samples)
  } catch (err) {
    console.error(`[apple-health] ${dataType} lezen`, err)
    return []
  }
}

async function leesSamples(plugin: Plugin, dataType: HealthDataType, start: Date, eind: Date): Promise<HealthSample[]> {
  try {
    const res = await plugin.readSamples({
      dataType, startDate: start.toISOString(), endDate: eind.toISOString(), limit: MAX_SAMPLES, ascending: true,
    })
    return res.samples ?? []
  } catch (err) {
    console.error(`[apple-health] ${dataType} lezen`, err)
    return []
  }
}

async function leesWorkouts(plugin: Plugin, start: Date, eind: Date): Promise<WorkoutMeting[]> {
  try {
    const res = await plugin.queryWorkouts({
      startDate: start.toISOString(), endDate: eind.toISOString(), limit: 300, ascending: true,
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
  // Slaap van de eerste nacht begint de avond ervoor.
  const slaapStart = new Date(start.getTime() - 12 * 60 * 60 * 1000)
  const eind = new Date()
  const [stappen, afstand, actief, hartslag, rust, hrv, vo2, gewicht, adem, zuurstof, slaap, workouts] = await Promise.all([
    leesDagBuckets(plugin, 'steps', 'sum', start, eind),
    leesDagBuckets(plugin, 'distance', 'sum', start, eind),
    leesDagBuckets(plugin, 'calories', 'sum', start, eind),
    leesDagBuckets(plugin, 'heartRate', 'average', start, eind),
    leesSamples(plugin, 'restingHeartRate', start, eind),
    leesSamples(plugin, 'heartRateVariability', start, eind),
    leesSamples(plugin, 'vo2Max', start, eind),
    leesSamples(plugin, 'weight', start, eind),
    leesSamples(plugin, 'respiratoryRate', start, eind),
    leesSamples(plugin, 'oxygenSaturation', start, eind),
    leesSamples(plugin, 'sleep', slaapStart, eind),
    leesWorkouts(plugin, start, eind),
  ])

  const dagen = combineerPerDag(
    alsVeld('stappen', bucketsPerDag(stappen)),
    alsVeld('afstandM', bucketsPerDag(afstand)),
    alsVeld('actieveKcal', bucketsPerDag(actief)),
    alsVeld('hartslag', bucketsPerDag(hartslag)),
    alsVeld('rusthartslag', puntenPerDag(puntenUitSamples(rust), 'gemiddelde')),
    alsVeld('hrvMs', puntenPerDag(puntenUitSamples(hrv), 'gemiddelde')),
    alsVeld('vo2max', puntenPerDag(puntenUitSamples(vo2), 'laatste')),
    alsVeld('gewichtKg', puntenPerDag(puntenUitSamples(gewicht), 'laatste')),
    alsVeld('ademhalingPm', puntenPerDag(puntenUitSamples(adem), 'gemiddelde')),
    alsVeld('zuurstofPct', puntenPerDag(puntenUitSamples(zuurstof, alsProcent), 'gemiddelde')),
    slaapPerNacht(slaapSessiesUitHealthKit(slaap)),
    alsVeld('beweegminuten', workoutMinutenPerDag(workouts)),
  ).filter(d => d.datum >= vanafDatum)
  return { dagen, workouts }
}

/** Compatibele helper: de afgelopen N dagen (gebruikt door de stappen-pagina). */
export async function leesAppleHealthBereik(dagenTerug: number): Promise<DagMeting[]> {
  return (await leesAppleHealth(datumDagenTerug(dagenTerug))).dagen
}
