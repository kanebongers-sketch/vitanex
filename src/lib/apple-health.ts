/**
 * Apple Health (HealthKit) integratie via capacitor-health.
 * Werkt alleen in de iOS app. De plugin levert stappen en actieve
 * calorieën per dag; slaap en hartslag volgen zodra de plugin dat
 * ondersteunt.
 */
import { Capacitor } from '@capacitor/core'
import { datumInNL, type DagMeting } from './health-data'

export const isIosApp = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'

async function getPlugin() {
  if (!isIosApp()) return null
  const { Health } = await import('capacitor-health')
  return Health
}

/** Vraag HealthKit-leesrechten voor stappen en actieve calorieën. */
export async function vraagAppleHealthPermissies(): Promise<boolean> {
  const plugin = await getPlugin()
  if (!plugin) return false

  try {
    const beschikbaar = await plugin.isHealthAvailable()
    if (!beschikbaar.available) return false
    await plugin.requestHealthPermissions({
      permissions: ['READ_STEPS', 'READ_ACTIVE_CALORIES'],
    })
    // iOS geeft niet prijs of de gebruiker echt toestemming gaf;
    // de eerstvolgende query toont het vanzelf (lege data = geweigerd).
    return true
  } catch {
    return false
  }
}

/** Lees de afgelopen N dagen stappen en calorieën uit Apple Health. */
export async function leesAppleHealthBereik(dagenTerug: number): Promise<DagMeting[]> {
  const plugin = await getPlugin()
  if (!plugin) return []

  const eind = new Date()
  const start = new Date(eind.getTime() - dagenTerug * 86400000)
  start.setHours(0, 0, 0, 0)

  const [stappen, calorieen] = await Promise.allSettled([
    plugin.queryAggregated({
      startDate: start.toISOString(), endDate: eind.toISOString(),
      dataType: 'steps', bucket: 'day',
    }),
    plugin.queryAggregated({
      startDate: start.toISOString(), endDate: eind.toISOString(),
      dataType: 'active-calories', bucket: 'day',
    }),
  ])

  const perDatum = new Map<string, DagMeting>()
  const meting = (datum: string): DagMeting => {
    const bestaand = perDatum.get(datum) ?? { datum }
    perDatum.set(datum, bestaand)
    return bestaand
  }

  if (stappen.status === 'fulfilled') {
    for (const s of stappen.value?.aggregatedData ?? []) {
      if (s.value > 0) meting(datumInNL(new Date(s.startDate))).stappen = Math.round(s.value)
    }
  }
  if (calorieen.status === 'fulfilled') {
    for (const c of calorieen.value?.aggregatedData ?? []) {
      if (c.value > 0) meting(datumInNL(new Date(c.startDate))).calorieen = Math.round(c.value)
    }
  }

  return [...perDatum.values()].sort((a, b) => a.datum.localeCompare(b.datum))
}
