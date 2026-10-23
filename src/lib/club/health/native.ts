// ─── Club, health: brug naar Apple Gezondheid en Health Connect (CLIENT) ────
// Werkt alleen in de app op de telefoon (Capacitor). In de browser laadt deze
// module de plugin nooit (dynamische import) en zegt de app "Beschikbaar in de
// app". Leest dezelfde soorten als de server-koppelingen en stuurt ze naar de
// leden-API, die ze opnieuw controleert en filtert op toestemming.
//
// Voorwaarden in de native app (nog te bouwen door Kane, geen onderdeel van de
// web-app): HealthKit-capability en NSHealthShareUsageDescription (iOS);
// Health Connect-rechten per soort in AndroidManifest plus het Health apps
// declaration form en Data safety in de Play Console (Android).

import { Capacitor } from '@capacitor/core'
import type { HealthDataType } from '@capgo/capacitor-health'
import type { DataSoort, Meting } from './typen'
import { alle, sampleNaarMeting, slaapPerNacht, stappenPerDag, trainingNaarMeting, type PluginMomentSoort } from './native-mappers'

export type NativeBron = 'apple_health' | 'health_connect'

/** De bron op dit toestel, of null in de browser. */
export function nativeBron(): NativeBron | null {
  if (!Capacitor.isNativePlatform()) return null
  const platform = Capacitor.getPlatform()
  if (platform === 'ios') return 'apple_health'
  if (platform === 'android') return 'health_connect'
  return null
}

async function plugin() {
  if (!nativeBron()) return null
  const { Health } = await import('@capgo/capacitor-health')
  return Health
}

const PLUGIN_PER_SOORT: Readonly<Partial<Record<DataSoort, HealthDataType>>> = {
  gewicht_kg: 'weight',
  vetpercentage: 'bodyFat',
  stappen: 'steps',
  slaap_minuten: 'sleep',
  rusthartslag: 'restingHeartRate',
  hrv_ms: 'heartRateVariability',
  vo2max: 'vo2Max',
  training: 'workouts',
}

const MOMENT_SOORTEN: readonly [DataSoort, PluginMomentSoort][] = [
  ['gewicht_kg', 'weight'],
  ['vetpercentage', 'bodyFat'],
  ['rusthartslag', 'restingHeartRate'],
  ['hrv_ms', 'heartRateVariability'],
  ['vo2max', 'vo2Max'],
]

/** Is de gezondheidsapp op dit toestel er en bruikbaar? */
export async function nativeBeschikbaar(): Promise<boolean> {
  const h = await plugin()
  if (!h) return false
  try {
    return (await h.isAvailable()).available
  } catch {
    return false
  }
}

/** Vraag leesrechten, alleen voor de soorten waarvoor het lid toestemming gaf. */
export async function vraagNativeRechten(soorten: readonly DataSoort[]): Promise<boolean> {
  const h = await plugin()
  const read = soorten.map((s) => PLUGIN_PER_SOORT[s]).filter((t): t is HealthDataType => t !== undefined)
  if (!h || read.length === 0) return false
  try {
    const status = await h.requestAuthorization({ read })
    // iOS zegt nooit of iemand weigerde; dan weten we het pas als er niets binnenkomt.
    return status.readAuthorized.length > 0 || nativeBron() === 'apple_health'
  } catch {
    return false
  }
}

async function veilig<T>(werk: () => Promise<T[]>): Promise<T[]> {
  try {
    return await werk()
  } catch {
    return []
  }
}

/** Lees de gegevens van de laatste `dagen` dagen, alleen de toegestane soorten. */
export async function leesNative(soorten: readonly DataSoort[], dagen: number, nu: Date = new Date()): Promise<Meting[]> {
  const h = await plugin()
  const bron = nativeBron()
  if (!h || !bron) return []
  const startDate = new Date(nu.getTime() - dagen * 86_400_000).toISOString()
  const endDate = nu.toISOString()
  const mag = new Set(soorten)
  const delen = await Promise.all([
    ...MOMENT_SOORTEN.filter(([s]) => mag.has(s)).map(([, p]) =>
      veilig(async () => alle((await h.readSamples({ dataType: p, startDate, endDate, limit: 500 })).samples, (x) => sampleNaarMeting(x, p, bron))),
    ),
    mag.has('stappen') ? veilig(async () => stappenPerDag((await h.queryAggregated({ dataType: 'steps', startDate, endDate, bucket: 'day', aggregation: 'sum' })).samples, bron, nu)) : Promise.resolve([]),
    mag.has('slaap_minuten') ? veilig(async () => slaapPerNacht((await h.readSamples({ dataType: 'sleep', startDate, endDate, limit: 1000 })).samples, bron)) : Promise.resolve([]),
    mag.has('training') ? veilig(async () => alle((await h.queryWorkouts({ startDate, endDate, limit: 200 })).workouts, (w) => trainingNaarMeting(w, bron))) : Promise.resolve([]),
  ])
  return delen.flat()
}

/** Stuur de metingen naar Club. Geeft het aantal verwerkte metingen of een fouttekst. */
export async function stuurNaarClub(url: string, bron: NativeBron, metingen: readonly Meting[]): Promise<{ ok: true; verwerkt: number } | { ok: false; fout: string }> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bron, metingen: metingen.slice(0, 2000) }) })
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, fout: typeof data.fout === 'string' ? data.fout : 'Versturen lukt nu niet.' }
    return { ok: true, verwerkt: typeof data.verwerkt === 'number' ? data.verwerkt : 0 }
  } catch {
    return { ok: false, fout: 'Geen verbinding. Probeer het opnieuw.' }
  }
}
