/**
 * Server-side validatie van (onvertrouwde) native gezondheidsdata.
 * Principe: een onzinnige waarde wordt weggegooid, niet de hele batch.
 * Een dag met een kapotte datum of een training zonder geldige tijden valt
 * als geheel af; losse velden buiten bereik worden simpelweg null.
 */
import { KOLOMMEN, rondAf, type DagMeting, type WorkoutMeting } from './health-data'

const DATUM_PATROON = /^\d{4}-\d{2}-\d{2}$/
const DAG_MS = 86_400_000
/** Hoe ver terug we een dag nog accepteren (ruim boven de 30-dagen-sync). */
const MAX_DAGEN_TERUG = 400
const MAX_WORKOUT_UUR = 24
const MAX_EXTERN_ID = 200

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

/** Getal binnen [min, max], anders null. */
export function getalInBereik(waarde: unknown, min: number, max: number): number | null {
  if (typeof waarde !== 'number' || !Number.isFinite(waarde)) return null
  return waarde >= min && waarde <= max ? waarde : null
}

/** Geldige kalenderdatum binnen het venster [nu − 400 dagen, nu + 1 dag]. */
export function isGeldigeDatum(datum: unknown, nu: Date = new Date()): datum is string {
  if (typeof datum !== 'string' || !DATUM_PATROON.test(datum)) return false
  const tijd = Date.parse(`${datum}T12:00:00Z`)
  if (Number.isNaN(tijd) || new Date(tijd).toISOString().slice(0, 10) !== datum) return false
  return tijd <= nu.getTime() + DAG_MS && tijd >= nu.getTime() - MAX_DAGEN_TERUG * DAG_MS
}

/** ISO-tijdstip dat binnen anderhalve dag van `datum` valt, anders null. */
function tijdBijDatum(waarde: unknown, datum: string): string | null {
  if (typeof waarde !== 'string' || waarde.length > 40) return null
  const tijd = Date.parse(waarde)
  if (Number.isNaN(tijd)) return null
  const middag = Date.parse(`${datum}T12:00:00Z`)
  return Math.abs(tijd - middag) <= 1.5 * DAG_MS ? new Date(tijd).toISOString() : null
}

/**
 * Maakt een dagmeting schoon: null als de datum ongeldig is, anders een
 * meting met alleen de velden die binnen bereik vallen.
 */
export function schoonDagMeting(x: unknown, nu: Date = new Date()): DagMeting | null {
  if (!isRecord(x) || !isGeldigeDatum(x.datum, nu)) return null
  const meting: DagMeting = { datum: x.datum }
  for (const k of KOLOMMEN) {
    const waarde = getalInBereik(x[k.veld], k.min, k.max)
    if (waarde !== null) meting[k.veld] = rondAf(waarde, k.decimalen)
  }
  const bedtijd = tijdBijDatum(x.bedtijd, x.datum)
  const wektijd = tijdBijDatum(x.wektijd, x.datum)
  if (bedtijd && wektijd && Date.parse(wektijd) > Date.parse(bedtijd)) {
    meting.bedtijd = bedtijd
    meting.wektijd = wektijd
  }
  return meting
}

/** Normaliseert een trainingssoort naar een korte, veilige sleutel (1–60 tekens). */
export function normaliseerSoort(soort: unknown): string {
  if (typeof soort !== 'string') return 'overig'
  const schoon = soort
    .replace(/^EXERCISE_TYPE_/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60)
  return schoon.length > 0 ? schoon : 'overig'
}

function geldigeWorkoutTijden(start: unknown, eind: unknown, nu: Date): [string, string] | null {
  if (typeof start !== 'string' || typeof eind !== 'string') return null
  const s = Date.parse(start)
  const e = Date.parse(eind)
  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return null
  if (e - s > MAX_WORKOUT_UUR * 3_600_000) return null
  if (e > nu.getTime() + DAG_MS || s < nu.getTime() - MAX_DAGEN_TERUG * DAG_MS) return null
  return [new Date(s).toISOString(), new Date(e).toISOString()]
}

/** Maakt een training schoon; null als id of tijden niet kloppen. */
export function schoonWorkout(x: unknown, nu: Date = new Date()): WorkoutMeting | null {
  if (!isRecord(x)) return null
  if (typeof x.externId !== 'string') return null
  const externId = x.externId.trim()
  if (externId.length === 0 || externId.length > MAX_EXTERN_ID) return null
  const tijden = geldigeWorkoutTijden(x.start, x.eind, nu)
  if (!tijden) return null

  const kcal = getalInBereik(x.kcal, 0, 20_000)
  const afstand = getalInBereik(x.afstandM, 0, 500_000)
  const hartslag = getalInBereik(x.gemHartslag, 25, 250)
  return {
    externId,
    soort: normaliseerSoort(x.soort),
    start: tijden[0],
    eind: tijden[1],
    kcal: kcal === null ? null : Math.round(kcal),
    afstandM: afstand === null ? null : Math.round(afstand),
    gemHartslag: hartslag === null ? null : rondAf(hartslag, 1),
  }
}

/** Alleen bekende, korte rechtennamen; dubbelen eruit. */
export function schoonRechten(x: unknown): string[] {
  if (!Array.isArray(x)) return []
  const geldig = x.filter((r): r is string => typeof r === 'string' && /^[A-Za-z0-9_]{1,40}$/.test(r))
  return [...new Set(geldig)].slice(0, 40)
}

/** Korte, platte foutmelding (≤ 500 tekens, zoals de kolom toestaat). */
export function schoonFout(x: unknown): string | null {
  if (typeof x !== 'string') return null
  const schoon = x.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 500)
  return schoon.length > 0 ? schoon : null
}
