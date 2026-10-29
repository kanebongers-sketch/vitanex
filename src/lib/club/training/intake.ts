// ─── Fit Factory Club, training: de intake (PUUR) ───────────────────────────
// Strenge validatie van wat de trainer invult, voordat het in club_intakes komt.
//
// AVG: gezondheidsgegevens zijn bijzondere persoonsgegevens. Zonder expliciet
// aangevinkte toestemming bewaren we ze NIET: de gezondheidsvragen, de
// rusthartslag en de bloeddruk vallen dan weg, ook als de browser ze toch stuurt.

import {
  DOELEN, VOORKEUREN, ZONES, isDoel, isNiveau, isUuid, isVoorkeur, isZone,
  type Doel, type Niveau, type Voorkeur, type Zone,
} from './typen'
import { isRij, tekstOfNull } from './rijen'
import { eigenUitOpslag, leesEigenAntwoorden, type EigenAntwoord } from '@/lib/club/intakevragen/eigen'
import type { IntakeVraag } from '@/lib/club/intakevragen/soorten'

export const PARQ_VRAGEN = [
  { sleutel: 'hart', vraag: 'Heeft een arts ooit gezegd dat je iets aan je hart hebt of alleen onder toezicht mag sporten?' },
  { sleutel: 'borstpijn', vraag: 'Heb je pijn of druk op de borst bij inspanning of in rust?' },
  { sleutel: 'duizelig', vraag: 'Word je weleens duizelig of val je flauw?' },
  { sleutel: 'gewricht', vraag: 'Heb je last van botten of gewrichten die erger kunnen worden door bewegen?' },
  { sleutel: 'bloeddruk', vraag: 'Gebruik je medicijnen voor bloeddruk of hart?' },
  { sleutel: 'zwanger', vraag: 'Ben je zwanger of net bevallen?' },
  { sleutel: 'anders', vraag: 'Is er een andere reden waarom je voorzichtig moet zijn met sporten?' },
] as const
export type ParqSleutel = (typeof PARQ_VRAGEN)[number]['sleutel']

export interface Gezondheid {
  blessures: Zone[]
  blessureToelichting: string | null
  klachten: string | null
  medicatie: string | null
  /** Alleen de vragen waarop "ja" is geantwoord. */
  parqJa: ParqSleutel[]
}

export interface Antwoorden {
  doelen: Doel[]
  niveau: Niveau
  dagenPerWeek: number
  minutenPerSessie: number
  voorkeuren: Voorkeur[]
  motivatie: string | null
  gezondheid: Gezondheid | null
  /** Antwoorden op de eigen vragen van de sportschool, met een kopie van de vraag. */
  eigen: EigenAntwoord[]
}

export interface Metingen {
  gewicht_kg?: number
  lengte_cm?: number
  vetpercentage?: number
  buikomtrek_cm?: number
  rusthartslag?: number
  bloeddruk?: string
}

export interface IntakeInvoer {
  lidId: string
  medewerkerId: string | null
  datum: string
  antwoorden: Antwoorden
  metingen: Metingen
  toestemmingGezondheid: boolean
  notitie: string | null
}

export type Uitslag<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const PARQ_SLEUTELS: readonly string[] = PARQ_VRAGEN.map((v) => v.sleutel)
const isParq = (v: unknown): v is ParqSleutel => typeof v === 'string' && PARQ_SLEUTELS.includes(v)

/** Grenzen per meting: [min, max, label]. Buiten de grens is een tikfout. */
export const METING_GRENZEN = {
  gewicht_kg: [30, 300, 'Gewicht'],
  lengte_cm: [100, 230, 'Lengte'],
  vetpercentage: [3, 70, 'Vetpercentage'],
  buikomtrek_cm: [40, 200, 'Buikomtrek'],
  rusthartslag: [30, 220, 'Rusthartslag'],
} as const
type GetalMeting = keyof typeof METING_GRENZEN

/**
 * Metingen die gezondheidsgegevens zijn en dus alleen met toestemming mogen.
 * Alle metingen van een intake: net als bij een losse meting (databaseregel in
 * migratie 430) gaan lichaamsmetingen alleen met vastgelegde toestemming mee.
 */
export const GEZONDHEIDSMETINGEN: readonly (keyof Metingen)[] = [...(Object.keys(METING_GRENZEN) as (keyof Metingen)[]), 'bloeddruk']

function korteTekst(v: unknown, max: number): string | null {
  const t = tekstOfNull(v)
  return t ? t.trim().slice(0, max) : null
}

function uniek<T>(lijst: T[]): T[] {
  return lijst.filter((x, i) => lijst.indexOf(x) === i)
}

function geheel(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'string' ? Number(v) : v
  return typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max ? n : null
}

/** "120/80" of "120 / 80" naar "120/80", of null als het geen geldige bloeddruk is. */
export function leesBloeddruk(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const m = /^\s*(\d{2,3})\s*\/\s*(\d{2,3})\s*$/.exec(v)
  if (!m) return null
  const boven = Number(m[1])
  const onder = Number(m[2])
  if (boven < 70 || boven > 250 || onder < 40 || onder > 150 || onder >= boven) return null
  return `${boven}/${onder}`
}

function leesGetalMeting(r: Record<string, unknown>, sleutel: GetalMeting): Uitslag<number | undefined> {
  const ruw = r[sleutel]
  if (ruw === undefined || ruw === null || ruw === '') return { ok: true, waarde: undefined }
  const n = typeof ruw === 'string' ? Number(ruw.replace(',', '.')) : ruw
  const [min, max, label] = METING_GRENZEN[sleutel]
  if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) {
    return { ok: false, fout: `${label} moet tussen ${min} en ${max} liggen.` }
  }
  return { ok: true, waarde: Math.round(n * 10) / 10 }
}

/** Valideer de metingen. Zonder toestemming vallen alle metingen weg (gezondheidsgegevens). */
export function leesMetingen(ruw: unknown, toestemming: boolean): Uitslag<Metingen> {
  if (ruw === undefined || ruw === null) return { ok: true, waarde: {} }
  if (!isRij(ruw)) return { ok: false, fout: 'De metingen zijn ongeldig.' }
  const uit: Metingen = {}
  for (const sleutel of Object.keys(METING_GRENZEN) as GetalMeting[]) {
    if (!toestemming && GEZONDHEIDSMETINGEN.includes(sleutel)) continue
    const m = leesGetalMeting(ruw, sleutel)
    if (!m.ok) return m
    if (m.waarde !== undefined) uit[sleutel] = m.waarde
  }
  if (toestemming && ruw.bloeddruk !== undefined && ruw.bloeddruk !== null && ruw.bloeddruk !== '') {
    const bd = leesBloeddruk(ruw.bloeddruk)
    if (!bd) return { ok: false, fout: 'Bloeddruk schrijf je als boven/onder, bijvoorbeeld 120/80.' }
    uit.bloeddruk = bd
  }
  return { ok: true, waarde: uit }
}

function leesGezondheid(ruw: unknown): Gezondheid {
  const r = isRij(ruw) ? ruw : {}
  const blessures = Array.isArray(r.blessures) ? uniek(r.blessures.filter(isZone)) : []
  const parqJa = Array.isArray(r.parqJa) ? uniek(r.parqJa.filter(isParq)) : []
  return {
    blessures: ZONES.filter((z) => blessures.includes(z)),
    blessureToelichting: korteTekst(r.blessureToelichting, 500),
    klachten: korteTekst(r.klachten, 500),
    medicatie: korteTekst(r.medicatie, 300),
    parqJa,
  }
}

/**
 * Valideer de vaste antwoorden. Zonder toestemming is gezondheid altijd null.
 * De eigen antwoorden worden hier mild gelezen (zoals ze opgeslagen zijn);
 * leesIntake controleert ze streng tegen de vragen van de sportschool.
 */
export function leesAntwoorden(ruw: unknown, toestemming: boolean): Uitslag<Antwoorden> {
  if (!isRij(ruw)) return { ok: false, fout: 'De antwoorden ontbreken.' }
  const doelen = Array.isArray(ruw.doelen) ? uniek(ruw.doelen.filter(isDoel)) : []
  if (doelen.length === 0) return { ok: false, fout: 'Kies minstens een doel.' }
  const niveau = typeof ruw.niveau === 'string' ? Number(ruw.niveau) : ruw.niveau
  if (!isNiveau(niveau)) return { ok: false, fout: 'Kies de ervaring.' }
  const dagen = geheel(ruw.dagenPerWeek, 1, 7)
  if (dagen === null) return { ok: false, fout: 'Dagen per week moet tussen 1 en 7 liggen.' }
  const minuten = geheel(ruw.minutenPerSessie, 15, 180)
  if (minuten === null) return { ok: false, fout: 'Minuten per training moet tussen 15 en 180 liggen.' }
  const voorkeuren = Array.isArray(ruw.voorkeuren) ? uniek(ruw.voorkeuren.filter(isVoorkeur)) : []
  return {
    ok: true,
    waarde: {
      doelen: DOELEN.filter((d) => doelen.includes(d)),
      niveau,
      dagenPerWeek: dagen,
      minutenPerSessie: minuten,
      voorkeuren: VOORKEUREN.filter((v) => voorkeuren.includes(v)),
      motivatie: korteTekst(ruw.motivatie, 500),
      gezondheid: toestemming ? leesGezondheid(ruw.gezondheid) : null,
      eigen: eigenUitOpslag(ruw.eigen, toestemming),
    },
  }
}

function isDatum(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`))
}

/**
 * De hele intake uit een verzoek. `vandaag` is de standaarddatum (yyyy-mm-dd).
 * `vragen` zijn de intakevragen van de sportschool: antwoorden op eigen vragen
 * worden daartegen gecontroleerd (verplicht, soort, toestemming).
 */
export function leesIntake(body: unknown, vandaag: string, vragen: readonly IntakeVraag[] = []): Uitslag<IntakeInvoer> {
  if (!isRij(body)) return { ok: false, fout: 'Ongeldig verzoek.' }
  if (!isUuid(body.lidId)) return { ok: false, fout: 'Kies eerst een lid.' }
  if (body.medewerkerId !== undefined && body.medewerkerId !== null && body.medewerkerId !== '' && !isUuid(body.medewerkerId)) {
    return { ok: false, fout: 'Onbekende trainer.' }
  }
  const datum = body.datum === undefined || body.datum === '' ? vandaag : body.datum
  if (!isDatum(datum) || datum > vandaag) return { ok: false, fout: 'De datum is ongeldig of ligt in de toekomst.' }
  const toestemming = body.toestemmingGezondheid === true
  const antwoorden = leesAntwoorden(body.antwoorden, toestemming)
  if (!antwoorden.ok) return antwoorden
  const eigen = leesEigenAntwoorden(isRij(body.antwoorden) ? body.antwoorden.eigen : undefined, vragen, toestemming)
  if (!eigen.ok) return eigen
  const metingen = leesMetingen(body.metingen, toestemming)
  if (!metingen.ok) return metingen
  return {
    ok: true,
    waarde: {
      lidId: body.lidId,
      medewerkerId: isUuid(body.medewerkerId) ? body.medewerkerId : null,
      datum,
      antwoorden: { ...antwoorden.waarde, eigen: eigen.waarde },
      metingen: metingen.waarde,
      toestemmingGezondheid: toestemming,
      notitie: korteTekst(body.notitie, 2000),
    },
  }
}

/** BMI op een decimaal, of null als gewicht of lengte ontbreekt. */
export function berekenBmi(gewichtKg: number | undefined | null, lengteCm: number | undefined | null): number | null {
  if (!gewichtKg || !lengteCm || gewichtKg <= 0 || lengteCm <= 0) return null
  const m = lengteCm / 100
  return Math.round((gewichtKg / (m * m)) * 10) / 10
}

export function bmiDuiding(bmi: number, taal: 'nl' | 'en' = 'nl'): string {
  const en = taal === 'en'
  if (bmi < 18.5) return en ? 'underweight' : 'ondergewicht'
  if (bmi < 25) return en ? 'healthy weight' : 'gezond gewicht'
  if (bmi < 30) return en ? 'overweight' : 'overgewicht'
  return en ? 'obese' : 'obesitas'
}
