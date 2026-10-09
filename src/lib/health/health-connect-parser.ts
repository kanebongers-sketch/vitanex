/**
 * Parser voor de records die @devmaxime/capacitor-health-connect teruggeeft.
 * Pure functies, geen plugin-code.
 *
 * De plugin zet maar vijf recordtypes om naar JSON (ExerciseSession, Steps,
 * Weight, SleepSession, RestingHeartRate). Voor de rest (HRV, VO2max,
 * zuurstof, ademhaling, verdiepingen) geeft hij `record.toString()` terug,
 * bijvoorbeeld:
 *   "HeartRateVariabilityRmssdRecord(time=2026-10-08T06:12:00Z, zoneOffset=+02:00,
 *    heartRateVariabilityMillis=48.2, metadata=Metadata(...))"
 * Die tekst lezen we hier defensief uit; past hij niet, dan valt de meting af.
 */
import { normaliseerSoort } from './health-validatie'
import type { Punt, SlaapSessie, SlaapStadium } from './health-aggregatie'
import type { WorkoutMeting } from './health-data'

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

function tekst(x: unknown): string | null {
  return typeof x === 'string' && x.length > 0 ? x : null
}

function getal(x: unknown): number | null {
  const n = typeof x === 'string' ? Number(x) : x
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

/** Leest `veld=<tijd>` uit een toString-record. */
function tijdUitTekst(regel: string, veld: string): string | null {
  const match = new RegExp(`\\b${veld}=([0-9T:.+\\-Z]+)`).exec(regel)
  return match && !Number.isNaN(Date.parse(match[1])) ? match[1] : null
}

/** Leest het eerste getal na `veld=` (ook als het in een wrapper staat). */
function getalUitTekst(regel: string, veld: string): number | null {
  const match = new RegExp(`\\b${veld}=\\D{0,20}?(-?\\d+(?:\\.\\d+)?)`).exec(regel)
  return match ? getal(match[1]) : null
}

/** Momentmeting uit een toString-record (veld `time=` + een waardeveld). */
export function puntUitTekst(record: unknown, waardeVeld: string): Punt | null {
  if (typeof record !== 'string') return null
  const tijd = tijdUitTekst(record, 'time')
  const waarde = getalUitTekst(record, waardeVeld)
  return tijd && waarde !== null ? { tijd, waarde } : null
}

/** Intervalmeting uit een toString-record (bv. FloorsClimbed). */
export function intervalPuntUitTekst(record: unknown, waardeVeld: string): Punt | null {
  if (typeof record !== 'string') return null
  const start = tijdUitTekst(record, 'startTime')
  const eind = tijdUitTekst(record, 'endTime')
  const waarde = getalUitTekst(record, waardeVeld)
  if (!start || !eind || waarde === null) return null
  // Midden van het interval, zodat de meting op de juiste dag landt.
  return { tijd: new Date((Date.parse(start) + Date.parse(eind)) / 2).toISOString(), waarde }
}

/** RestingHeartRate- of Weight-record (JSON) naar een momentmeting. */
export function puntUitJson(record: unknown, waardeVeld: 'beatsPerMinute' | 'value'): Punt | null {
  if (!isRecord(record)) return null
  const tijd = tekst(record.time)
  const waarde = getal(record[waardeVeld])
  return tijd && waarde !== null && !Number.isNaN(Date.parse(tijd)) ? { tijd, waarde } : null
}

const STADIA: Record<string, SlaapStadium> = {
  SLEEP_STAGE_AWAKE: 'wakker',
  SLEEP_STAGE_OUT_OF_BED: 'uit_bed',
  SLEEP_STAGE_LIGHT: 'licht',
  SLEEP_STAGE_DEEP: 'diep',
  SLEEP_STAGE_REM: 'rem',
  SLEEP_STAGE_SLEEPING: 'slaap',
}

/** SleepSession-record (JSON) naar een slaapsessie met stadia. */
export function slaapSessieUitJson(record: unknown): SlaapSessie | null {
  if (!isRecord(record)) return null
  const start = tekst(record.startTime)
  const eind = tekst(record.endTime)
  if (!start || !eind) return null
  const stadia = (Array.isArray(record.stages) ? record.stages : [])
    .filter(isRecord)
    .map(s => ({
      start: tekst(s.startTime) ?? '',
      eind: tekst(s.endTime) ?? '',
      stadium: STADIA[tekst(s.stage) ?? ''] ?? 'onbekend',
    }))
    .filter(s => s.start && s.eind)
  return { start, eind, stadia }
}

/** ExerciseSession-record (JSON) naar een training (zonder kcal/afstand/hartslag). */
export function workoutUitJson(record: unknown): WorkoutMeting | null {
  if (!isRecord(record)) return null
  const start = tekst(record.startTime)
  const eind = tekst(record.endTime)
  const metadata = isRecord(record.metadata) ? record.metadata : {}
  const id = tekst(metadata.id)
  if (!start || !eind) return null
  return {
    externId: id ?? `${start}|${String(record.exerciseTypeId ?? '')}`,
    soort: normaliseerSoort(record.exerciseType),
    start,
    eind,
  }
}

/** Past een parser toe op een lijst records en laat mislukte metingen vallen. */
export function parseerAlle<T>(records: unknown[], parser: (r: unknown) => T | null): T[] {
  return records.map(parser).filter((x): x is T => x !== null)
}
