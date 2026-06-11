/**
 * Health Connect integratie via @devmaxime/capacitor-health-connect
 * Werkt alleen in de Android app (Capacitor), niet in de browser.
 */

import { Capacitor } from '@capacitor/core'
import { datumInNL, type DagMeting } from './health-data'

// Lazy-load de plugin zodat de web build niet breekt
async function getPlugin() {
  if (!Capacitor.isNativePlatform()) return null
  const { HealthConnect } = await import('@devmaxime/capacitor-health-connect')
  return HealthConnect
}

export type HealthData = {
  stappen: number | null
  slaapMinuten: number | null
  hartslag: number | null
  calorieën: number | null
}

/**
 * Vraag Health Connect permissies aan de gebruiker.
 * Geeft true terug als alle gevraagde read-permissies verleend zijn.
 */
export async function vraagPermissies(): Promise<boolean> {
  const plugin = await getPlugin()
  if (!plugin) return false

  try {
    const result = await plugin.requestPermissions({
      read: ['Steps', 'SleepSession', 'RestingHeartRate'],
      write: [],
    })
    // Controleer of alle gevraagde types zijn verleend
    const verleend = result.read ?? []
    return (
      verleend.includes('Steps') &&
      verleend.includes('SleepSession') &&
      verleend.includes('RestingHeartRate')
    )
  } catch {
    return false
  }
}

/**
 * Lees vandaag's gezondheidsdata uit Health Connect.
 * Gebruikt aggregateRecords voor stappen/calorieën/hartslag,
 * readRecords voor slaap.
 */
export async function leesHealthData(): Promise<HealthData> {
  const plugin = await getPlugin()
  const leeg: HealthData = { stappen: null, slaapMinuten: null, hartslag: null, calorieën: null }
  if (!plugin) return leeg

  const vandaag = new Date()
  const startDag = new Date(vandaag)
  startDag.setHours(0, 0, 0, 0)
  const eindDag = new Date(vandaag)
  eindDag.setHours(23, 59, 59, 999)

  // Slaap: van 22:00 gisteren tot nu
  const gisteren22 = new Date(vandaag)
  gisteren22.setDate(gisteren22.getDate() - 1)
  gisteren22.setHours(22, 0, 0, 0)

  try {
    const [stappen, calorieën, hartslag, slaap] = await Promise.allSettled([
      plugin.aggregateRecords({
        start: startDag.toISOString(),
        end: eindDag.toISOString(),
        type: 'Steps',
        groupBy: 'day',
      }),
      plugin.aggregateRecords({
        start: startDag.toISOString(),
        end: eindDag.toISOString(),
        type: 'ActiveCaloriesBurned',
        groupBy: 'day',
      }),
      plugin.aggregateRecords({
        start: startDag.toISOString(),
        end: eindDag.toISOString(),
        type: 'HeartRate',
        groupBy: 'day',
      }),
      plugin.readRecords({
        start: gisteren22.toISOString(),
        end: eindDag.toISOString(),
        type: 'SleepSession',
      }),
    ])

    // Stappen totaal van vandaag
    let totalStappen: number | null = null
    if (stappen.status === 'fulfilled') {
      const aggregates = stappen.value?.aggregates ?? []
      if (aggregates.length > 0) {
        totalStappen = Math.round(aggregates.reduce((som, a) => som + (a.value ?? 0), 0))
      }
    }

    // Calorieën totaal van vandaag
    let totalCal: number | null = null
    if (calorieën.status === 'fulfilled') {
      const aggregates = calorieën.value?.aggregates ?? []
      if (aggregates.length > 0) {
        totalCal = Math.round(aggregates.reduce((som, a) => som + (a.value ?? 0), 0))
      }
    }

    // Gemiddelde hartslag vandaag
    let gemHartslag: number | null = null
    if (hartslag.status === 'fulfilled') {
      const aggregates = hartslag.value?.aggregates ?? []
      if (aggregates.length > 0) {
        const som = aggregates.reduce((s, a) => s + (a.value ?? 0), 0)
        gemHartslag = Math.round(som / aggregates.length)
      }
    }

    // Slaap: som van slaapsessies in minuten
    let totalSlaap: number | null = null
    if (slaap.status === 'fulfilled') {
      const records = slaap.value?.records ?? []
      if (records.length > 0) {
        totalSlaap = Math.round(
          records.reduce((som: number, r: { startTime: string; endTime: string }) => {
            const duur = (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000
            return som + duur
          }, 0)
        )
      }
    }

    return {
      stappen: totalStappen,
      slaapMinuten: totalSlaap,
      hartslag: gemHartslag,
      calorieën: totalCal,
    }
  } catch {
    return leeg
  }
}

export const isAndroidApp = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'

/**
 * Lees de afgelopen N dagen uit Health Connect als dagmetingen,
 * klaar om naar /api/health/sync te sturen.
 */
export async function leesHealthBereik(dagenTerug: number): Promise<DagMeting[]> {
  const plugin = await getPlugin()
  if (!plugin) return []

  const eind = new Date()
  const start = new Date(eind.getTime() - dagenTerug * 86400000)
  start.setHours(0, 0, 0, 0)

  const [stappen, calorieen, hartslag, slaap] = await Promise.allSettled([
    plugin.aggregateRecords({ start: start.toISOString(), end: eind.toISOString(), type: 'Steps', groupBy: 'day' }),
    plugin.aggregateRecords({ start: start.toISOString(), end: eind.toISOString(), type: 'ActiveCaloriesBurned', groupBy: 'day' }),
    plugin.aggregateRecords({ start: start.toISOString(), end: eind.toISOString(), type: 'HeartRate', groupBy: 'day' }),
    plugin.readRecords({ start: start.toISOString(), end: eind.toISOString(), type: 'SleepSession' }),
  ])

  const perDatum = new Map<string, DagMeting>()
  const meting = (datum: string): DagMeting => {
    const bestaand = perDatum.get(datum) ?? { datum }
    perDatum.set(datum, bestaand)
    return bestaand
  }

  const verwerk = (
    resultaat: PromiseSettledResult<{ aggregates: { startTime: string; value: number }[] }>,
    veld: 'stappen' | 'calorieen' | 'hartslag'
  ) => {
    if (resultaat.status !== 'fulfilled') return
    for (const a of resultaat.value?.aggregates ?? []) {
      if (a.value === null || a.value === undefined) continue
      meting(datumInNL(new Date(a.startTime)))[veld] = Math.round(a.value)
    }
  }
  verwerk(stappen, 'stappen')
  verwerk(calorieen, 'calorieen')
  verwerk(hartslag, 'hartslag')

  if (slaap.status === 'fulfilled') {
    for (const r of (slaap.value?.records ?? []) as { startTime: string; endTime: string }[]) {
      const duur = (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000
      if (duur <= 0) continue
      const m = meting(datumInNL(new Date(r.endTime)))
      m.slaapMinuten = (m.slaapMinuten ?? 0) + Math.round(duur)
    }
  }

  return [...perDatum.values()].sort((a, b) => a.datum.localeCompare(b.datum))
}
