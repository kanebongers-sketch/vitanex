/**
 * Apple Health (HealthKit) via @capgo/capacitor-health: pure omzetting van wat
 * de plugin levert naar ons formaat. Geen plugin-import hier (alleen types),
 * zodat het zonder iPhone te testen is.
 */
import type { AggregatedSample, HealthSample, Workout } from '@capgo/capacitor-health'
import type { Interval, Punt, SlaapSessie, SlaapStadium } from './health-aggregatie'
import type { WorkoutMeting } from './health-data'
import { normaliseerSoort } from './health-validatie'

const MIN = 60_000
/** Slaapsamples met minder dan een uur ertussen horen bij dezelfde nacht. */
const SESSIE_GAT_MS = 60 * MIN

/** Dagbuckets van queryAggregated naar intervallen (lege of ongeldige weg). */
export function intervallenUitAggregaat(samples: AggregatedSample[] | undefined): Interval[] {
  return (samples ?? [])
    .filter(s => Number.isFinite(s.value))
    .map(s => ({ start: s.startDate, eind: s.endDate, waarde: s.value }))
}

/** Losse metingen (HRV, rusthartslag, gewicht…) naar punten op hun begintijd. */
export function puntenUitSamples(samples: HealthSample[] | undefined, schaal: (w: number) => number = w => w): Punt[] {
  return (samples ?? [])
    .filter(s => Number.isFinite(s.value))
    .map(s => ({ tijd: s.startDate, waarde: schaal(s.value) }))
}

/** HealthKit geeft zuurstofsaturatie als fractie (0,97); wij slaan procenten op. */
export function alsProcent(waarde: number): number {
  return waarde <= 1.5 ? waarde * 100 : waarde
}

const STADIUM: Record<string, SlaapStadium> = {
  asleep: 'slaap', light: 'licht', deep: 'diep', rem: 'rem', awake: 'wakker',
}

function ms(iso: string): number {
  return Date.parse(iso)
}

function bronVan(s: HealthSample): string {
  return s.sourceId ?? s.sourceName ?? 'onbekend'
}

/**
 * HealthKit-slaapsamples (één sample per fase) naar slaapsessies per nacht.
 *
 * - Samples met minder dan een uur ertussen vormen samen een nacht.
 * - Schrijven meerdere apps dezelfde nacht (Apple Watch én een slaap-app), dan
 *   telt één bron: die met echte fases, anders de langste. Anders telt de nacht dubbel.
 * - Heeft die bron fases (kern/diep/REM/wakker), dan bepalen die de sessie en
 *   tellen "in bed"-samples niet mee. Alleen "in bed" (bijv. de iPhone-bedtijd)
 *   geeft een sessie zonder fases.
 */
export function slaapSessiesUitHealthKit(samples: HealthSample[] | undefined): SlaapSessie[] {
  const geldig = (samples ?? [])
    .filter(s => !Number.isNaN(ms(s.startDate)) && !Number.isNaN(ms(s.endDate)) && ms(s.endDate) > ms(s.startDate))
    .sort((a, b) => ms(a.startDate) - ms(b.startDate))

  // 1. Nachten: aaneengesloten groepen (over alle bronnen heen).
  const nachten: HealthSample[][] = []
  let eindNacht = -Infinity
  for (const s of geldig) {
    if (nachten.length === 0 || ms(s.startDate) > eindNacht + SESSIE_GAT_MS) {
      nachten.push([])
      eindNacht = -Infinity
    }
    nachten[nachten.length - 1].push(s)
    eindNacht = Math.max(eindNacht, ms(s.endDate))
  }

  const sessies: SlaapSessie[] = []
  for (const nacht of nachten) {
    // 2. Eén bron per nacht: de meest gedetailleerde, bij gelijkspel de langste.
    const perBron = new Map<string, HealthSample[]>()
    for (const s of nacht) perBron.set(bronVan(s), [...(perBron.get(bronVan(s)) ?? []), s])
    let beste: HealthSample[] = []
    let besteScore = -1
    for (const groep of perBron.values()) {
      const fases = groep.filter(s => s.sleepState && s.sleepState !== 'inBed')
      const telt = fases.length > 0 ? fases : groep
      const minuten = telt.reduce((som, s) => som + (ms(s.endDate) - ms(s.startDate)) / MIN, 0)
      // Echte fases (kern/diep/REM) gaan voor alleen "slaap", en dat weer voor
      // alleen "in bed": hoe gedetailleerder, hoe meer het over de slaap zegt.
      const detail = groep.some(s => s.sleepState === 'light' || s.sleepState === 'deep' || s.sleepState === 'rem')
        ? 2 : fases.length > 0 ? 1 : 0
      const score = detail * 1e6 + minuten
      if (score > besteScore) { beste = groep; besteScore = score }
    }

    // 3. De sessie zelf.
    const fases = beste.filter(s => s.sleepState && s.sleepState !== 'inBed')
    const telt = fases.length > 0 ? fases : beste
    const start = Math.min(...telt.map(s => ms(s.startDate)))
    const eind = Math.max(...telt.map(s => ms(s.endDate)))
    const sessie: SlaapSessie = { start: new Date(start).toISOString(), eind: new Date(eind).toISOString() }
    if (fases.length > 0) {
      sessie.stadia = fases.map(s => ({
        start: s.startDate,
        eind: s.endDate,
        stadium: STADIUM[s.sleepState ?? ''] ?? 'onbekend',
      }))
    }
    sessies.push(sessie)
  }
  return sessies
}

/** Een HealthKit-training (via de plugin) naar ons formaat. */
export function workoutUitHealthKit(w: Workout): WorkoutMeting {
  return {
    externId: w.platformId ?? `${w.startDate}|${w.workoutType}`,
    soort: normaliseerSoort(w.workoutType),
    start: w.startDate,
    eind: w.endDate,
    kcal: w.totalEnergyBurned !== undefined && Number.isFinite(w.totalEnergyBurned) && w.totalEnergyBurned > 0
      ? w.totalEnergyBurned : null,
    afstandM: w.totalDistance !== undefined && Number.isFinite(w.totalDistance) && w.totalDistance > 0
      ? w.totalDistance : null,
    // De plugin levert geen hartslag per training; liever leeg dan geschat.
    gemHartslag: null,
  }
}
