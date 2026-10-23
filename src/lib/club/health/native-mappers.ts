// ─── Club, health: gegevens van de telefoon omzetten (PUUR) ─────────────────
// De app leest Apple Gezondheid (HealthKit) en Health Connect met een plugin:
// @capgo/capacitor-health 8.x (MPL-2.0, iOS en Android). Wat die teruggeeft,
// wordt hier hetzelfde model als bij de leveranciers. Spiermassa kan de plugin
// niet lezen; de rest (gewicht, vet, stappen, slaap, rusthartslag, HRV, VO2max,
// trainingen) wel. Via deze weg komen ook weegschalen en apps zonder eigen API
// binnen (Eufy, Renpho, Tanita, Xiaomi, Zepp, MyFitnessPal, Cronometer).

import type { BronId, DataSoort, Meting } from './typen'

/** De soorten van de plugin die we lezen, met ons soort-equivalent. */
export const PLUGIN_SOORTEN = {
  weight: 'gewicht_kg',
  bodyFat: 'vetpercentage',
  restingHeartRate: 'rusthartslag',
  heartRateVariability: 'hrv_ms',
  vo2Max: 'vo2max',
} as const satisfies Readonly<Record<string, DataSoort>>

export type PluginMomentSoort = keyof typeof PLUGIN_SOORTEN

function rec(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function moment(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 && !Number.isNaN(Date.parse(v)) ? v : null
}

function getal(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/** De datum (JJJJ-MM-DD, Nederlandse tijd) van een moment: een dag stappen of een nacht slaap is een rij. */
export function dagSleutel(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
}

/** Een momentmeting (HealthSample) van de plugin. */
export function sampleNaarMeting(sample: unknown, pluginSoort: PluginMomentSoort, bron: BronId): Meting | null {
  const r = rec(sample)
  const start = moment(r?.startDate)
  let waarde = getal(r?.value)
  if (!r || !start || waarde === null) return null
  const soort = PLUGIN_SOORTEN[pluginSoort]
  // HealthKit geeft vetpercentage soms als fractie (0,21); wij bewaren procenten.
  if (soort === 'vetpercentage' && waarde > 0 && waarde <= 1) waarde *= 100
  const id = typeof r.platformId === 'string' && r.platformId ? r.platformId : `${soort}:${start}`
  return { soort, waarde, training: null, bron, externId: id, gemetenOp: start }
}

/** Stappen per dag uit queryAggregated (bucket day). */
export function stappenPerDag(buckets: readonly unknown[], bron: BronId, nu: Date): Meting[] {
  const uit: Meting[] = []
  for (const b of buckets) {
    const r = rec(b)
    const start = moment(r?.startDate)
    const eind = moment(r?.endDate) ?? start
    const waarde = getal(r?.value)
    if (!start || !eind || waarde === null) continue
    uit.push({ soort: 'stappen', waarde, training: null, bron, externId: `stappen:${dagSleutel(start)}`, gemetenOp: new Date(Math.min(Date.parse(eind), nu.getTime())).toISOString() })
  }
  return uit
}

const SLAAP = new Set(['asleep', 'rem', 'deep', 'light'])

/** Slaap per nacht: minuten slapen (zonder wakker en in bed), op de dag waarop je wakker werd. */
export function slaapPerNacht(samples: readonly unknown[], bron: BronId): Meting[] {
  const per = new Map<string, { minuten: number; eind: string }>()
  const tel = (start: string, eind: string, staat: unknown) => {
    if (!SLAAP.has(String(staat))) return
    const dag = dagSleutel(eind)
    const huidig = per.get(dag) ?? { minuten: 0, eind }
    per.set(dag, { minuten: huidig.minuten + (Date.parse(eind) - Date.parse(start)) / 60_000, eind: Date.parse(eind) > Date.parse(huidig.eind) ? eind : huidig.eind })
  }
  for (const s of samples) {
    const r = rec(s)
    const start = moment(r?.startDate)
    const eind = moment(r?.endDate)
    if (!r || !start || !eind) continue
    const stadia = Array.isArray(r.stages) ? r.stages : []
    if (stadia.length > 0) {
      for (const st of stadia) {
        const x = rec(st)
        const a = moment(x?.startDate)
        const b = moment(x?.endDate)
        if (x && a && b) tel(a, b, x.stage)
      }
    } else tel(start, eind, r.sleepState ?? 'asleep')
  }
  return [...per.entries()].map(([dag, v]) => ({ soort: 'slaap_minuten' as const, waarde: v.minuten, training: null, bron, externId: `slaap:${dag}`, gemetenOp: v.eind }))
}

/** Een training van de plugin. De plugin geeft per training geen gemiddelde hartslag. */
export function trainingNaarMeting(w: unknown, bron: BronId): Meting | null {
  const r = rec(w)
  const start = moment(r?.startDate)
  const eind = moment(r?.endDate)
  if (!r || !start || !eind) return null
  const duurSec = getal(r.duration) ?? (Date.parse(eind) - Date.parse(start)) / 1000
  const soort = typeof r.workoutType === 'string' && r.workoutType ? r.workoutType : 'Training'
  const id = typeof r.platformId === 'string' && r.platformId ? r.platformId : `${start}|${soort}`
  return { soort: 'training', waarde: duurSec / 60, training: { soort, duurSec, kcal: getal(r.totalEnergyBurned), gemHartslag: null }, bron, externId: id, gemetenOp: start }
}

export function alle<T>(lijst: readonly unknown[], f: (x: unknown) => T | null): T[] {
  return lijst.map(f).filter((x): x is T => x !== null)
}
