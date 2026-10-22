// ─── LifeOS | de aparte agenda "Coachgesprekken PT" (pure regels) ──────────
// PUUR. Geen fetch, geen DB. Kane zet de wekelijkse coachgesprekken met de PT'ers
// in een eigen Google-agenda met de naam "Coachgesprekken PT". LifeOS vindt die
// agenda op naam in de agendalijst, leest coachgesprekken uit die agenda EN uit de
// gekozen agenda, en plant nieuwe coachgesprekken in die agenda in.
//
// Bestaat de agenda niet, dan verandert er niets: alles blijft in de gekozen agenda.
// Het ophalen bij Google staat in `coach-agenda-ophalen.ts`; hier staan alleen de
// regels die je zonder Google-account kunt narekenen.

import { bevatReeks, woordTokens } from '@/lib/lifeos/crm/agenda-match'

/** De exacte naam van de agenda in Google (hoofdletters en spaties eromheen tellen niet). */
export const COACH_AGENDA_NAAM = 'Coachgesprekken PT'

/** Wat we van een agenda uit de lijst nodig hebben. */
export interface AgendaInLijst {
  id: string
  naam: string
  primair: boolean
  /** Google's accessRole: owner, writer, reader of freeBusyReader. */
  toegang: string
}

/** De gevonden coachagenda. */
export interface CoachAgenda {
  id: string
  primair: boolean
  /** Mag LifeOS erin schrijven (owner of writer)? Zo niet, dan alleen lezen. */
  schrijfbaar: boolean
}

function normaliseer(naam: string): string {
  return naam.trim().toLowerCase()
}

/** Is dit de naam van de coachagenda? Exact, hoofdletterongevoelig, spaties eromheen getrimd. */
export function isCoachAgendaNaam(naam: string): boolean {
  return normaliseer(naam) === normaliseer(COACH_AGENDA_NAAM)
}

/** De agenda "Coachgesprekken PT" uit de lijst, of null als hij er niet is. De eerste telt. */
export function vindCoachAgenda(lijst: readonly AgendaInLijst[]): CoachAgenda | null {
  const gevonden = lijst.find((k) => k.id.trim().length > 0 && isCoachAgendaNaam(k.naam))
  if (!gevonden) return null
  return {
    id: gevonden.id,
    primair: gevonden.primair,
    schrijfbaar: gevonden.toegang === 'owner' || gevonden.toegang === 'writer',
  }
}

/** Is de coachagenda dezelfde als de gekozen agenda (null = de primaire)? */
function isZelfde(gekozen: string | null, coach: CoachAgenda): boolean {
  return gekozen === null ? coach.primair : gekozen === coach.id
}

/**
 * In welke agenda's LifeOS coachgesprekken zoekt: altijd de gekozen agenda (null =
 * primary), plus de coachagenda als die bestaat en een andere agenda is.
 */
export function teLezenAgendas(gekozen: string | null, coach: CoachAgenda | null): (string | null)[] {
  if (!coach || isZelfde(gekozen, coach)) return [gekozen]
  return [gekozen, coach.id]
}

/** De extra agenda naast de gekozen, of null als er geen andere coachagenda is. */
export function extraCoachAgenda(gekozen: string | null, coach: CoachAgenda | null): string | null {
  return coach && !isZelfde(gekozen, coach) ? coach.id : null
}

/**
 * Waar LifeOS een nieuw coachgesprek inplant: de coachagenda als die bestaat en
 * beschrijfbaar is, anders de gekozen agenda (zoals voorheen).
 */
export function coachSchrijfAgenda(gekozen: string | null, coach: CoachAgenda | null): string | null {
  return coach && coach.schrijfbaar ? coach.id : gekozen
}

/** Draagt deze titel het coachgesprek-signaal ("Coachgesprek PT ...")? Los van de naam. */
export function isCoachgesprekTitel(titel: string | null | undefined): boolean {
  if (!titel) return false
  return bevatReeks(woordTokens(titel), ['coachgesprek', 'pt'])
}

/** Wat ontdubbelen van een afspraak nodig heeft. */
export interface OntdubbelEvent {
  externId: string
  titel: string | null
  startOp: Date
}

function inhoudSleutel(e: OntdubbelEvent): string {
  return `${(e.titel ?? '').trim().toLowerCase()}|${e.startOp.getTime()}`
}

/**
 * Voegt de afspraken uit meerdere agenda's samen zonder dubbel te tellen, op starttijd.
 *
 * Dubbel is: hetzelfde Google-id (een uitnodiging staat met hetzelfde id in beide
 * agenda's) of dezelfde titel op hetzelfde moment (een handmatige kopie). De eerste
 * lijst wint, dus geef de gekozen agenda als eerste mee. Bij gelijke start blijft de
 * volgorde van binnenkomst staan.
 */
export function ontdubbelEvents<T extends OntdubbelEvent>(lijsten: readonly (readonly T[])[]): T[] {
  const ids = new Set<string>()
  const inhoud = new Set<string>()
  const uit: T[] = []
  for (const lijst of lijsten) {
    for (const e of lijst) {
      const sleutel = inhoudSleutel(e)
      if (ids.has(e.externId) || inhoud.has(sleutel)) continue
      ids.add(e.externId)
      inhoud.add(sleutel)
      uit.push(e)
    }
  }
  return uit
    .map((e, i) => ({ e, i }))
    .sort((a, b) => a.e.startOp.getTime() - b.e.startOp.getTime() || a.i - b.i)
    .map(({ e }) => e)
}
