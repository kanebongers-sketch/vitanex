// ─── LifeOS — training & logging ────────────────────────────────────────────
// Vervangt de workout-logger. Niet door er een na te bouwen — geen programma's,
// geen schema's, geen 1RM-rekenmachine. LifeOS logt wat je déed; het schrijft je
// geen programma voor. Dat is een productgrens, geen gemis: een app die je
// vertelt wat je moet tillen, is een coach, en dat is Kane zelf al.
//
// Puur bestand: geen fetch, geen DB, geen React. De validatie hieronder is de
// systeemgrens (user input), en die is hier testbaar zonder database.
//
// De regels staan óók in de database (migratie 070). Dat is geen duplicatie maar
// diepteverdediging met verschillende doelen: de database garandeert dat een
// voornemen nooit een meting draagt, deze laag geeft je een nette Nederlandse
// foutmelding in plaats van "23514".
//
// ─── gepland ≠ gedaan ───────────────────────────────────────────────────────
// `gepland: true` is een voornemen, `gepland: false` is een meting. Vita mag
// alleen op metingen af. Een voornemen draagt daarom geen duurMinuten, geen rpe
// en geen actieveMinuten — je kunt niet voelen wat je nog niet gedaan hebt.

import { leesDatumSleutel } from '@/lib/lifeos/datum/datum'

export const MAX_OMSCHRIJVING_LENGTE = 500

export type TrainingSoort = 'kracht' | 'cardio' | 'mobiliteit' | 'sport' | 'anders'

export const TRAINING_SOORTEN: readonly TrainingSoort[] = Object.freeze([
  'kracht',
  'cardio',
  'mobiliteit',
  'sport',
  'anders',
])

/** Nederlandse labels. Nergens anders herhalen — dit is de bron. */
export const SOORT_LABEL: Readonly<Record<TrainingSoort, string>> = Object.freeze({
  kracht: 'Kracht',
  cardio: 'Cardio',
  mobiliteit: 'Mobiliteit',
  sport: 'Sport',
  anders: 'Anders',
})

/** Rate of Perceived Exertion, 1–10. Zoals JIJ het ervoer, niet wat een sensor vond. */
export type Rpe = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
export const RPE_WAARDEN: readonly Rpe[] = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

/**
 * Eén training, zoals hij uit de database komt én over de draad gaat.
 *
 * Alle meetvelden zijn nullable, en dat is de kern: soms log je alleen dát je
 * trainde. Een verzonnen RPE is erger dan geen RPE.
 */
export interface Training {
  id: string
  /** Dagsleutel (YYYY-MM-DD), lokale tijd. */
  datum: string
  soort: TrainingSoort
  omschrijving: string | null
  /** Hoe lang de sessie duurde, inclusief rust. Geen maat voor beweging. */
  duurMinuten: number | null
  rpe: Rpe | null
  /**
   * Gemeten actieve minuten. NIET afgeleid uit duurMinuten — een krachtsessie
   * van 60 minuten is grotendeels rust tussen sets. `0` is een gemeten nul,
   * `null` is "niet gemeten". Zie `actieve-minuten.ts`.
   */
  actieveMinuten: number | null
  /** true = voornemen (draagt geen metingen). false = meting. */
  gepland: boolean
  aangemaaktOp: string
}

export interface NieuweTraining {
  datum: string
  soort: TrainingSoort
  omschrijving: string | null
  duurMinuten: number | null
  rpe: Rpe | null
  actieveMinuten: number | null
  gepland: boolean
}

/** Alleen de velden die je meestuurt worden gewijzigd. */
export interface TrainingWijziging {
  datum?: string
  soort?: TrainingSoort
  omschrijving?: string | null
  duurMinuten?: number | null
  rpe?: Rpe | null
  actieveMinuten?: number | null
  gepland?: boolean
}

export type Validatie<T> = { ok: true; waarde: T } | { ok: false; fout: string }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function isTrainingSoort(v: unknown): v is TrainingSoort {
  return typeof v === 'string' && (TRAINING_SOORTEN as readonly string[]).includes(v)
}

export function isRpe(v: unknown): v is Rpe {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 10
}

// ─── Losse velden ───────────────────────────────────────────────────────────

function leesSoort(v: unknown): Validatie<TrainingSoort> {
  if (!isTrainingSoort(v)) {
    return { ok: false, fout: `Soort is een van: ${TRAINING_SOORTEN.join(', ')}.` }
  }
  return { ok: true, waarde: v }
}

function leesDatum(v: unknown): Validatie<string> {
  if (typeof v !== 'string' || leesDatumSleutel(v) === null) {
    return { ok: false, fout: 'Datum moet YYYY-MM-DD zijn.' }
  }
  return { ok: true, waarde: v }
}

function leesOmschrijving(v: unknown): Validatie<string | null> {
  if (v === null || v === undefined) return { ok: true, waarde: null }
  if (typeof v !== 'string') return { ok: false, fout: 'Omschrijving moet tekst zijn.' }
  const tekst = v.trim()
  if (tekst.length === 0) return { ok: true, waarde: null }
  if (tekst.length > MAX_OMSCHRIJVING_LENGTE) {
    return { ok: false, fout: `Omschrijving mag maximaal ${MAX_OMSCHRIJVING_LENGTE} tekens zijn.` }
  }
  return { ok: true, waarde: tekst }
}

/**
 * Een heel getal binnen een bereik, of null.
 *
 * `null` betekent hier "niet gemeten" en is dus altijd geldig. Dat is geen
 * soepelheid maar het hele punt: wie de minuten niet weet, mag ze niet invullen.
 */
function leesGeheelGetal(
  v: unknown,
  { min, max, naam }: { min: number; max: number; naam: string },
): Validatie<number | null> {
  if (v === null || v === undefined) return { ok: true, waarde: null }
  if (typeof v !== 'number' || !Number.isInteger(v)) {
    return { ok: false, fout: `${naam} moet een heel getal zijn, of leeg blijven.` }
  }
  if (v < min || v > max) {
    return { ok: false, fout: `${naam} moet tussen ${min} en ${max} liggen.` }
  }
  return { ok: true, waarde: v }
}

function leesRpe(v: unknown): Validatie<Rpe | null> {
  if (v === null || v === undefined) return { ok: true, waarde: null }
  if (!isRpe(v)) return { ok: false, fout: 'RPE is een heel getal van 1 tot en met 10.' }
  return { ok: true, waarde: v }
}

function leesGepland(v: unknown): Validatie<boolean> {
  if (v === undefined || v === null) return { ok: true, waarde: false }
  if (typeof v !== 'boolean') return { ok: false, fout: 'Gepland is waar of niet waar.' }
  return { ok: true, waarde: v }
}

/**
 * Spiegelt `trainingen_gepland_meet_niet` uit migratie 070.
 *
 * Een voornemen met een RPE is een cijfer dat op een meting lijkt maar er geen
 * is. De database wijst het af; hier krijg je te horen waaróm.
 */
function geplandDraagtGeenMeting(meet: {
  duurMinuten: number | null
  rpe: Rpe | null
  actieveMinuten: number | null
}): string | null {
  if (meet.rpe !== null) return 'Een geplande training heeft geen RPE — die voel je pas achteraf.'
  if (meet.duurMinuten !== null || meet.actieveMinuten !== null) {
    return 'Een geplande training heeft nog geen minuten. Rond hem af, dan log je wat het werd.'
  }
  return null
}

// ─── Systeemgrens: request-body ─────────────────────────────────────────────

/** Nieuwe training uit een request-body. Faalt met een leesbare melding. */
export function leesNieuweTraining(body: unknown): Validatie<NieuweTraining> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const datum = leesDatum(body.datum)
  if (!datum.ok) return datum
  const soort = leesSoort(body.soort)
  if (!soort.ok) return soort
  const omschrijving = leesOmschrijving(body.omschrijving)
  if (!omschrijving.ok) return omschrijving
  const duurMinuten = leesGeheelGetal(body.duurMinuten, { min: 1, max: 1440, naam: 'Duur' })
  if (!duurMinuten.ok) return duurMinuten
  const rpe = leesRpe(body.rpe)
  if (!rpe.ok) return rpe
  const actieveMinuten = leesGeheelGetal(body.actieveMinuten, {
    min: 0, // 0 mag: een gemeten nul is een meting.
    max: 1440,
    naam: 'Actieve minuten',
  })
  if (!actieveMinuten.ok) return actieveMinuten
  const gepland = leesGepland(body.gepland)
  if (!gepland.ok) return gepland

  const waarde: NieuweTraining = {
    datum: datum.waarde,
    soort: soort.waarde,
    omschrijving: omschrijving.waarde,
    duurMinuten: duurMinuten.waarde,
    rpe: rpe.waarde,
    actieveMinuten: actieveMinuten.waarde,
    gepland: gepland.waarde,
  }

  if (waarde.gepland) {
    const botsing = geplandDraagtGeenMeting(waarde)
    if (botsing) return { ok: false, fout: botsing }
  }

  return { ok: true, waarde }
}

/**
 * Wijziging uit een request-body. Alleen aanwezige velden tellen — zo rond je
 * een geplande training af zonder de rest opnieuw mee te sturen.
 *
 * De combinatie gepland+meting kan hier niet volledig gecontroleerd worden: bij
 * een PATCH kennen we de andere velden van de rij niet. Dat is precies waarom de
 * check óók in de database staat (070) — die ziet de hele rij en wijst af met
 * 23514, wat de opslaglaag als 'ongeldig' vertaalt.
 */
export function leesTrainingWijziging(body: unknown): Validatie<TrainingWijziging> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const wijziging: TrainingWijziging = {}

  if ('datum' in body) {
    const datum = leesDatum(body.datum)
    if (!datum.ok) return datum
    wijziging.datum = datum.waarde
  }
  if ('soort' in body) {
    const soort = leesSoort(body.soort)
    if (!soort.ok) return soort
    wijziging.soort = soort.waarde
  }
  if ('omschrijving' in body) {
    const omschrijving = leesOmschrijving(body.omschrijving)
    if (!omschrijving.ok) return omschrijving
    wijziging.omschrijving = omschrijving.waarde
  }
  if ('duurMinuten' in body) {
    const duur = leesGeheelGetal(body.duurMinuten, { min: 1, max: 1440, naam: 'Duur' })
    if (!duur.ok) return duur
    wijziging.duurMinuten = duur.waarde
  }
  if ('rpe' in body) {
    const rpe = leesRpe(body.rpe)
    if (!rpe.ok) return rpe
    wijziging.rpe = rpe.waarde
  }
  if ('actieveMinuten' in body) {
    const actief = leesGeheelGetal(body.actieveMinuten, { min: 0, max: 1440, naam: 'Actieve minuten' })
    if (!actief.ok) return actief
    wijziging.actieveMinuten = actief.waarde
  }
  if ('gepland' in body) {
    if (typeof body.gepland !== 'boolean') return { ok: false, fout: 'Gepland is waar of niet waar.' }
    wijziging.gepland = body.gepland
  }

  if (Object.keys(wijziging).length === 0) return { ok: false, fout: 'Niets om te wijzigen.' }

  // Wat we hier wél zien: een wijziging die zichzelf tegenspreekt.
  if (wijziging.gepland === true) {
    const botsing = geplandDraagtGeenMeting({
      duurMinuten: wijziging.duurMinuten ?? null,
      rpe: wijziging.rpe ?? null,
      actieveMinuten: wijziging.actieveMinuten ?? null,
    })
    if (botsing) return { ok: false, fout: botsing }
  }

  return { ok: true, waarde: wijziging }
}

// ─── Systeemgrens: rijen uit de database ────────────────────────────────────

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

/**
 * Een gemeten aantal minuten, of null.
 *
 * Een kolom die van type verandert of onzin bevat wordt hier `null` — "niet
 * gemeten" — in plaats van een NaN die verderop in een advies belandt. Let op:
 * dit levert `0` op voor een gemeten nul, en dat mag. Zie `actieve-minuten.ts`.
 */
function minuten(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null
}

export function trainingVanRij(rij: unknown): Training | null {
  if (!isObject(rij)) return null

  const id = tekst(rij.id)
  const datum = tekst(rij.datum)
  const aangemaaktOp = tekst(rij.aangemaakt_op)
  if (id === null || datum === null || aangemaaktOp === null) return null
  // Een onbekende soort is geen 'anders': dan zou een schema-wijziging stil als
  // een geldige training binnenkomen. Liever deze rij overslaan.
  if (!isTrainingSoort(rij.soort)) return null

  return {
    id,
    // Postgres geeft `date` als 'YYYY-MM-DD'. De slice is een vangnet voor het
    // geval er ooit een tijdcomponent bij komt.
    datum: datum.slice(0, 10),
    soort: rij.soort,
    omschrijving: tekst(rij.omschrijving),
    duurMinuten: minuten(rij.duur_minuten),
    rpe: isRpe(rij.rpe) ? rij.rpe : null,
    actieveMinuten: minuten(rij.actieve_minuten),
    gepland: rij.gepland === true,
    aangemaaktOp,
  }
}

export function trainingenVanRijen(rijen: readonly unknown[]): Training[] {
  return rijen.map(trainingVanRij).filter((t): t is Training => t !== null)
}

// ─── Systeemgrens: het antwoord van onze eigen API ──────────────────────────
// De database geeft snake_case, de API camelCase. Dat is geen duplicatie maar
// twee echt verschillende vormen — en beide worden gelezen, niet gecast.

/** Eén training zoals hij over de draad komt. */
export function leesTrainingJson(ruw: unknown): Training | null {
  if (!isObject(ruw)) return null

  const id = tekst(ruw.id)
  const datum = tekst(ruw.datum)
  const aangemaaktOp = tekst(ruw.aangemaaktOp)
  if (id === null || datum === null || aangemaaktOp === null) return null
  if (!isTrainingSoort(ruw.soort)) return null

  return {
    id,
    datum: datum.slice(0, 10),
    soort: ruw.soort,
    omschrijving: tekst(ruw.omschrijving),
    duurMinuten: minuten(ruw.duurMinuten),
    rpe: isRpe(ruw.rpe) ? ruw.rpe : null,
    actieveMinuten: minuten(ruw.actieveMinuten),
    gepland: ruw.gepland === true,
    aangemaaktOp,
  }
}

/** Het antwoord van `GET /api/training`. */
export function leesTrainingenAntwoord(ruw: unknown): Training[] | null {
  if (!isObject(ruw) || !Array.isArray(ruw.trainingen)) return null

  const trainingen = ruw.trainingen.map(leesTrainingJson)
  // Eén onleesbare rij maakt het hele antwoord verdacht: dan liever een nette
  // fout dan een lijst die stilletjes korter is dan wat de server stuurde.
  if (trainingen.some((t) => t === null)) return null
  return trainingen.filter((t): t is Training => t !== null)
}

/** Het antwoord van `POST /api/training` en `PATCH /api/training/[id]`. */
export function leesTrainingAntwoord(ruw: unknown): Training | null {
  if (!isObject(ruw)) return null
  return leesTrainingJson(ruw.training)
}

// ─── Afgeleide weergave ─────────────────────────────────────────────────────

/** De metingen van een lijst. Een voornemen is geen meting. */
export function gedaan(trainingen: readonly Training[]): Training[] {
  return trainingen.filter((t) => !t.gepland)
}

/** De voornemens van een lijst. */
export function gepland(trainingen: readonly Training[]): Training[] {
  return trainingen.filter((t) => t.gepland)
}

/** 'Kracht' of 'Kracht — push A'. Kort, want dit staat in een rij, niet in een zin. */
export function trainingLabel(training: Training): string {
  const soort = SOORT_LABEL[training.soort]
  return training.omschrijving ? `${soort} — ${training.omschrijving}` : soort
}
