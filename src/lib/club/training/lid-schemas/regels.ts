// ─── Club, training: schema's die een lid zelf maakt (PUUR) ─────────────────
// Besluit Kane (30-10-2026): leden maken zelf een schema in de ledenapp.
// Regels op een plek, voor de leden-API, de ledenapp en de ledenkaart:
//   - Welk schema ziet het lid in de app (kiesActief).
//   - Wat mag het lid met een schema (magBewerken, magVerwijderen).
//   - De snelle start: doel, dagen, materiaal en niveau (leesSnelleStart).
//   - De instelling van de sportschool (lidSchemaInstelling).
// Het schema van de trainer gaat voor: het lid past het alleen aan als de
// sportschool dat toestaat (standaard nee) en verwijdert het nooit.

import { leesSchema, type SchemaInvoer } from '../invoer'
import type { Uitslag } from '../intake'
import { isRij } from '../rijen'
import { isNiveau, type Doel, type Materiaal, type Niveau } from '../typen'

export const MAKERS = ['trainer', 'lid'] as const
export type Maker = (typeof MAKERS)[number]

export function isMaker(v: unknown): v is Maker {
  return v === 'trainer' || v === 'lid'
}

/** Hoeveel eigen schema's een lid hooguit heeft (ruim, maar geen vuilnisbak). */
export const MAX_EIGEN_SCHEMAS = 8

export interface SchemaKeuzeBron {
  id: string
  maker: Maker
  /** ISO */
  aangemaaktOp: string
  /** ISO, of null: nooit gekozen (dan telt aangemaaktOp). */
  actiefGekozenOp: string | null
}

const moment = (s: SchemaKeuzeBron): string => s.actiefGekozenOp ?? s.aangemaaktOp

/**
 * Het schema dat het lid in de app ziet: van de actieve schema's het schema dat
 * het laatst gekozen werd (door het lid, bij het maken, of door de trainer bij
 * actief zetten). Nooit gekozen telt als gekozen bij het aanmaken. Gelijk: het
 * schema van de trainer gaat voor.
 */
export function kiesActief<T extends SchemaKeuzeBron>(actieve: readonly T[]): T | null {
  let beste: T | null = null
  for (const s of actieve) {
    if (!beste) {
      beste = s
      continue
    }
    const verschil = moment(s).localeCompare(moment(beste))
    if (verschil > 0 || (verschil === 0 && s.maker === 'trainer' && beste.maker === 'lid')) beste = s
  }
  return beste
}

export interface SchemaEigenaar {
  maker: Maker
  lidId: string | null
}

/** Mag dit lid dit schema aanpassen? Eigen schema altijd; van de trainer alleen als de sportschool dat toestaat. */
export function magBewerken(s: SchemaEigenaar, lidId: string, trainerAanpassen: boolean): boolean {
  if (s.lidId !== lidId) return false
  return s.maker === 'lid' || trainerAanpassen
}

/** Een lid verwijdert alleen een schema dat het zelf maakte. */
export function magVerwijderen(s: SchemaEigenaar, lidId: string): boolean {
  return s.lidId === lidId && s.maker === 'lid'
}

// ── Snelle start ────────────────────────────────────────────────────────────

/** De doelen die een lid zelf kiest (revalidatie en sportprestatie gaan via de trainer). */
export const LID_DOELEN = ['afvallen', 'spiermassa', 'kracht', 'conditie', 'gezondheid'] as const satisfies readonly Doel[]
export type LidDoel = (typeof LID_DOELEN)[number]

export const LID_MATERIAAL = ['thuis', 'dumbbells', 'gym'] as const
export type LidMateriaal = (typeof LID_MATERIAAL)[number]

/** Wat er is bij elke keuze. Thuis is zonder materiaal: alleen je lichaamsgewicht. */
export const MATERIAAL_BIJ: Record<LidMateriaal, readonly Materiaal[]> = {
  thuis: ['geen'],
  dumbbells: ['geen', 'dumbbell'],
  gym: ['geen', 'dumbbell', 'barbell', 'kettlebell', 'machine', 'kabel', 'band', 'bank', 'cardio_apparaat', 'overig'],
}

export const MIN_DAGEN = 1
export const MAX_LID_DAGEN = 6

export interface SnelleStart {
  doel: LidDoel
  dagen: number
  materiaal: LidMateriaal
  niveau: Niveau
}

export function leesSnelleStart(body: unknown): SnelleStart | null {
  if (!isRij(body)) return null
  const doel = (LID_DOELEN as readonly unknown[]).includes(body.doel) ? (body.doel as LidDoel) : null
  const materiaal = (LID_MATERIAAL as readonly unknown[]).includes(body.materiaal) ? (body.materiaal as LidMateriaal) : null
  const dagen = typeof body.dagen === 'string' ? Number(body.dagen) : body.dagen
  const niveau = typeof body.niveau === 'string' ? Number(body.niveau) : body.niveau
  if (!doel || !materiaal || !isNiveau(niveau)) return null
  if (typeof dagen !== 'number' || !Number.isInteger(dagen) || dagen < MIN_DAGEN || dagen > MAX_LID_DAGEN) return null
  return { doel, dagen, materiaal, niveau }
}

// ── Opslaan ─────────────────────────────────────────────────────────────────

/**
 * Een schema van het lid: dezelfde strenge controle als in Club, maar status,
 * trainer, weken en notitie bepaalt het lid niet. Een bestaande notitie van de
 * trainer blijft staan (die zet de server zelf terug).
 */
export function leesLidSchema(body: unknown): Uitslag<SchemaInvoer> {
  if (!isRij(body)) return { ok: false, fout: 'Ongeldig verzoek.' }
  return leesSchema({ naam: body.naam, doel: body.doel, niveau: body.niveau, dagTitels: body.dagTitels, regels: body.regels, status: 'actief', weken: null, medewerkerId: null, notitie: null })
}

/** Een lid-schema moet minstens een oefening hebben; een leeg schema helpt niemand. */
export function heeftOefeningen(s: SchemaInvoer): boolean {
  return s.regels.length > 0
}

/**
 * Mag elke oefening in dit schema? Kiesbare oefeningen voor leden (Blender), of
 * oefeningen die er al in stonden (een trainer kan een eigen oefening hebben
 * gekozen; die mag blijven staan).
 */
export function oefeningenToegestaan(ids: readonly string[], kiesbaar: ReadonlySet<string>, alInSchema: ReadonlySet<string> = new Set()): boolean {
  return ids.every((id) => kiesbaar.has(id) || alInSchema.has(id))
}

// ── Instelling van de sportschool ───────────────────────────────────────────

export interface LidSchemaInstelling {
  /** Mag een lid het schema van de trainer aanpassen? Standaard nee. */
  trainerAanpassen: boolean
}

export const STANDAARD_LID_SCHEMAS: LidSchemaInstelling = { trainerAanpassen: false }

/** Uit club_organisaties.instellingen.lid_schemas; alles wat niet klopt is de standaard. */
export function lidSchemaInstellingUitJson(v: unknown): LidSchemaInstelling {
  return isRij(v) && v.trainer_aanpassen === true ? { trainerAanpassen: true } : STANDAARD_LID_SCHEMAS
}

export function lidSchemaInstellingNaarJson(i: LidSchemaInstelling): Record<string, unknown> {
  return { trainer_aanpassen: i.trainerAanpassen }
}
