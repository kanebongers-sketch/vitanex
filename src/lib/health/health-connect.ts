/**
 * Health Connect (Android) via @devmaxime/capacitor-health-connect.
 * Werkt alleen in de Android-app; in de browser geeft alles netjes
 * "niet beschikbaar" terug en wordt de plugin nooit geladen.
 *
 * Voorwaarden in de native app (zie android/app/src/main/AndroidManifest.xml):
 * elke READ_*-permissie hieronder moet daar gedeclareerd staan, plus de
 * privacy-rationale activity. Zonder die declaraties toont Health Connect
 * geen toestemmingsscherm en komt er nooit data binnen.
 */
import { Capacitor } from '@capacitor/core'
import type { RecordType as PluginRecordType } from '@devmaxime/capacitor-health-connect'
import {
  alsVeld, bucketsPerDag, combineerPerDag, puntenPerDag, slaapPerNacht, workoutMinutenPerDag,
  type Interval, type PerDag,
} from './health-aggregatie'
import {
  intervalPuntUitTekst, parseerAlle, puntUitJson, puntUitTekst, slaapSessieUitJson, workoutUitJson,
} from './health-connect-parser'
import { datumDagenTerug, datumInNL, middernachtNL, type DagMeting, type WorkoutMeting } from './health-data'
import { verrijkWorkouts, type AggregaatType } from './health-connect-workouts'

/** Recordtypes die we lezen. Namen = sleutels van Health Connect's RECORDS_TYPE_NAME_MAP. */
export const HC_LEESTYPES = [
  'Steps', 'Distance', 'ActiveCaloriesBurned', 'TotalCaloriesBurned', 'HeartRateSeries',
  'RestingHeartRate', 'HeartRateVariabilityRmssd', 'Vo2Max', 'Weight', 'SleepSession',
  'ActivitySession', 'FloorsClimbed', 'OxygenSaturation', 'RespiratoryRate',
] as const
export type HcLeestype = (typeof HC_LEESTYPES)[number]

export type HcBeschikbaarheid = 'beschikbaar' | 'niet_geinstalleerd' | 'niet_ondersteund' | 'geen_android'

export const isAndroidApp = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'

async function getPlugin() {
  if (!isAndroidApp()) return null
  const { HealthConnect } = await import('@devmaxime/capacitor-health-connect')
  return HealthConnect
}

/** Is Health Connect op dit toestel bruikbaar? */
export async function healthConnectBeschikbaarheid(): Promise<HcBeschikbaarheid> {
  const plugin = await getPlugin()
  if (!plugin) return 'geen_android'
  try {
    const { availability } = await plugin.checkAvailability()
    if (availability === 'Available') return 'beschikbaar'
    return availability === 'NotInstalled' ? 'niet_geinstalleerd' : 'niet_ondersteund'
  } catch (err) {
    console.error('[health-connect] beschikbaarheid', err)
    return 'niet_ondersteund'
  }
}

/** Opent Health Connect (of de Play Store als het nog niet geïnstalleerd is). */
export async function openHealthConnect(installeren = false): Promise<void> {
  if (!isAndroidApp()) return
  const { Health } = await import('capacitor-health')
  await (installeren ? Health.showHealthConnectInPlayStore() : Health.openHealthConnectSettings())
}

/** Welke leestypes zijn nu verleend? Leeg op web of bij een fout. */
export async function verleendeRechten(): Promise<string[]> {
  const plugin = await getPlugin()
  if (!plugin) return []
  try {
    return (await plugin.getGrantedPermissions()).read ?? []
  } catch (err) {
    console.error('[health-connect] rechten lezen', err)
    return []
  }
}

/**
 * Vraagt leesrechten voor alle types. True als er ten minste één is verleend:
 * wie bv. alleen stappen deelt, moet die gewoon kunnen syncen.
 */
export async function vraagPermissies(): Promise<boolean> {
  const plugin = await getPlugin()
  if (!plugin) return false
  if (await healthConnectBeschikbaarheid() !== 'beschikbaar') return false
  try {
    // De plugin-typing kent maar 5 namen; native accepteert alle Health Connect-types.
    const read = [...HC_LEESTYPES] as unknown as PluginRecordType[]
    const result = await plugin.requestPermissions({ read, write: [] })
    return (result.read ?? []).length > 0
  } catch (err) {
    console.error('[health-connect] toestemming vragen', err)
    return false
  }
}

type Plugin = NonNullable<Awaited<ReturnType<typeof getPlugin>>>

async function leesRecords(plugin: Plugin, type: HcLeestype, start: Date, eind: Date): Promise<unknown[]> {
  const res = await plugin.readRecords({
    start: start.toISOString(), end: eind.toISOString(), type: type as unknown as PluginRecordType,
  })
  return Array.isArray(res.records) ? res.records : []
}

async function leesBuckets(plugin: Plugin, type: AggregaatType, start: Date, eind: Date): Promise<Interval[]> {
  const res = await plugin.aggregateRecords({
    start: start.toISOString(), end: eind.toISOString(), type, groupBy: 'day',
  })
  return (res.aggregates ?? []).map(a => ({ start: a.startTime, eind: a.endTime, waarde: Number(a.value) }))
}

/** Resultaat of lege lijst; een geweigerd type mag de rest niet tegenhouden. */
async function veilig<T>(werk: Promise<T[]>): Promise<T[]> {
  try {
    return await werk
  } catch {
    return []
  }
}

async function leesAggregaten(plugin: Plugin, start: Date, eind: Date): Promise<PerDag[]> {
  const [stappen, afstand, actief, totaal, hartslag] = await Promise.all([
    veilig(leesBuckets(plugin, 'Steps', start, eind)),
    veilig(leesBuckets(plugin, 'Distance', start, eind)),
    veilig(leesBuckets(plugin, 'ActiveCaloriesBurned', start, eind)),
    veilig(leesBuckets(plugin, 'TotalCaloriesBurned', start, eind)),
    veilig(leesBuckets(plugin, 'HeartRate', start, eind)),
  ])
  return [
    alsVeld('stappen', bucketsPerDag(stappen)),
    alsVeld('afstandM', bucketsPerDag(afstand)),
    alsVeld('actieveKcal', bucketsPerDag(actief)),
    alsVeld('calorieen', bucketsPerDag(totaal)),
    alsVeld('hartslag', bucketsPerDag(hartslag)),
  ]
}

async function leesMomenten(plugin: Plugin, start: Date, eind: Date): Promise<PerDag[]> {
  const lees = (type: HcLeestype) => veilig(leesRecords(plugin, type, start, eind))
  const [rust, hrv, vo2, gewicht, zuurstof, adem, trappen] = await Promise.all([
    lees('RestingHeartRate'), lees('HeartRateVariabilityRmssd'), lees('Vo2Max'), lees('Weight'),
    lees('OxygenSaturation'), lees('RespiratoryRate'), lees('FloorsClimbed'),
  ])
  return [
    alsVeld('rusthartslag', puntenPerDag(parseerAlle(rust, r => puntUitJson(r, 'beatsPerMinute')), 'gemiddelde')),
    alsVeld('hrvMs', puntenPerDag(parseerAlle(hrv, r => puntUitTekst(r, 'heartRateVariabilityMillis')), 'gemiddelde')),
    alsVeld('vo2max', puntenPerDag(parseerAlle(vo2, r => puntUitTekst(r, 'vo2MillilitersPerMinuteKilogram')), 'laatste')),
    alsVeld('gewichtKg', puntenPerDag(parseerAlle(gewicht, r => puntUitJson(r, 'value')), 'laatste')),
    alsVeld('zuurstofPct', puntenPerDag(parseerAlle(zuurstof, r => puntUitTekst(r, 'percentage')), 'gemiddelde')),
    alsVeld('ademhalingPm', puntenPerDag(parseerAlle(adem, r => puntUitTekst(r, 'rate')), 'gemiddelde')),
    alsVeld('verdiepingen', puntenPerDag(parseerAlle(trappen, r => intervalPuntUitTekst(r, 'floors')), 'som')),
  ]
}

export interface HcLeesResultaat {
  dagen: DagMeting[]
  workouts: WorkoutMeting[]
}

/**
 * Leest alles vanaf middernacht (NL) van `vanafDatum` tot nu en aggregeert
 * per dag. Slaap wordt een dag eerder opgehaald zodat de nacht naar de
 * eerste dag compleet is.
 */
export async function leesHealthConnect(vanafDatum: string): Promise<HcLeesResultaat> {
  const plugin = await getPlugin()
  if (!plugin) return { dagen: [], workouts: [] }

  const start = middernachtNL(vanafDatum)
  const eind = new Date()
  const slaapStart = new Date(start.getTime() - 12 * 3_600_000)

  const [aggregaten, momenten, slaapRecords, sessieRecords] = await Promise.all([
    leesAggregaten(plugin, start, eind),
    leesMomenten(plugin, start, eind),
    veilig(leesRecords(plugin, 'SleepSession', slaapStart, eind)),
    veilig(leesRecords(plugin, 'ActivitySession', start, eind)),
  ])

  const ruweWorkouts = parseerAlle(sessieRecords, workoutUitJson)
  const workouts = await verrijkWorkouts(ruweWorkouts, (type, s, e) => veilig(leesBuckets(plugin, type, s, e)))
  const slaap = slaapPerNacht(parseerAlle(slaapRecords, slaapSessieUitJson))

  const dagen = combineerPerDag(
    ...aggregaten, ...momenten, slaap,
    alsVeld('beweegminuten', workoutMinutenPerDag(workouts)),
  ).filter(d => d.datum >= vanafDatum)
  return { dagen, workouts }
}

/**
 * Compatibele helper: de afgelopen N dagen als dagmetingen
 * (gebruikt door de stappen-pagina).
 */
export async function leesHealthBereik(dagenTerug: number): Promise<DagMeting[]> {
  return (await leesHealthConnect(datumDagenTerug(dagenTerug))).dagen
}

export type HealthData = {
  stappen: number | null
  slaapMinuten: number | null
  hartslag: number | null
  calorieën: number | null
}

/** Compatibele helper: vandaag in één oogopslag (gebruikt door /koppelingen). */
export async function leesHealthData(): Promise<HealthData> {
  const vandaag = datumInNL(new Date())
  const d = (await leesHealthBereik(0)).find(m => m.datum === vandaag)
  return {
    stappen: d?.stappen ?? null,
    slaapMinuten: d?.slaapMinuten ?? null,
    hartslag: d?.rusthartslag ?? d?.hartslag ?? null,
    calorieën: d?.actieveKcal ?? d?.calorieen ?? null,
  }
}
