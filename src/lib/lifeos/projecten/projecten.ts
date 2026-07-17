// ─── LifeOS — projecten ─────────────────────────────────────────────────────
// De lichtste vorm van context die werkt: een naam, een omschrijving, actief of
// niet. Bewust GEEN status, fase of deadline op projectniveau — dat is
// projectmanagement, en dat lost hier geen probleem op (zie migratie 100).
//
// Puur bestand: geen fetch, geen DB, geen React. De validatie hieronder is de
// systeemgrens (user input), en die is hier testbaar zonder database.
//
// De regels staan óók in de database (migratie 100). Dat is geen duplicatie maar
// diepteverdediging met verschillende doelen: de database garandeert dat er nooit
// twee projecten met dezelfde naam bestaan, deze laag geeft je een nette
// Nederlandse foutmelding in plaats van "23505".

/** Spiegelt `projecten_naam_niet_leeg` uit migratie 100. */
export const MAX_PROJECT_NAAM = 120
/** Spiegelt `projecten_omschrijving_lengte` uit migratie 100. */
export const MAX_PROJECT_OMSCHRIJVING = 2000

/** Een project, zoals het uit de database komt én over de draad gaat. */
export interface Project {
  id: string
  naam: string
  omschrijving: string | null
  /** Gearchiveerd i.p.v. verwijderd: taken van een afgerond project blijven. */
  actief: boolean
  aangemaaktOp: string
}

export interface NieuwProject {
  naam: string
  omschrijving: string | null
}

/** Alleen de velden die je meestuurt worden gewijzigd. */
export interface ProjectWijziging {
  naam?: string
  omschrijving?: string | null
  actief?: boolean
}

/**
 * Dezelfde vorm als in `taken/taken.ts`. Bewust hier opnieuw verklaard en niet
 * geïmporteerd: een project hoort niets van een taak te weten. Dat is dezelfde
 * afweging die `agenda/opslag.ts` en `taken/opslag.ts` met `Uitkomst<T>` maken —
 * een structurele alias van één regel delen levert koppeling op die duurder is
 * dan de herhaling.
 */
export type Validatie<T> = { ok: true; waarde: T } | { ok: false; fout: string }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

// ─── Systeemgrens: is dit een project-id? ───────────────────────────────────

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Herkent een project-id (uuid). Woont hier en niet bij de taken: de identiteit
 * van een project is van het project.
 *
 * Waarom aan de grens en niet pas in de database: Postgres wijst 'abc' af met
 * 22P02 (invalid_text_representation), en dat is een storing-achtige fout die
 * moeilijk te vertalen is naar iets menselijks. Hier is het gewoon: dit is geen
 * id.
 */
export function isProjectId(v: unknown): v is string {
  return typeof v === 'string' && UUID.test(v)
}

// ─── Systeemgrens: user input ───────────────────────────────────────────────

function leesNaam(v: unknown): Validatie<string> {
  if (typeof v !== 'string') return { ok: false, fout: 'Naam ontbreekt.' }
  const naam = v.trim()
  if (naam.length === 0) return { ok: false, fout: 'Een project zonder naam is geen project.' }
  if (naam.length > MAX_PROJECT_NAAM) {
    return { ok: false, fout: `Naam mag maximaal ${MAX_PROJECT_NAAM} tekens zijn.` }
  }
  return { ok: true, waarde: naam }
}

function leesOmschrijving(v: unknown): Validatie<string | null> {
  if (v === null || v === undefined) return { ok: true, waarde: null }
  if (typeof v !== 'string') return { ok: false, fout: 'Omschrijving moet tekst zijn.' }
  const omschrijving = v.trim()
  if (omschrijving.length === 0) return { ok: true, waarde: null }
  if (omschrijving.length > MAX_PROJECT_OMSCHRIJVING) {
    return { ok: false, fout: `Omschrijving mag maximaal ${MAX_PROJECT_OMSCHRIJVING} tekens zijn.` }
  }
  return { ok: true, waarde: omschrijving }
}

/** Nieuw project uit een request-body. Faalt met een leesbare melding. */
export function leesNieuwProject(body: unknown): Validatie<NieuwProject> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const naam = leesNaam(body.naam)
  if (!naam.ok) return naam
  const omschrijving = leesOmschrijving(body.omschrijving)
  if (!omschrijving.ok) return omschrijving

  return { ok: true, waarde: { naam: naam.waarde, omschrijving: omschrijving.waarde } }
}

/** Wijziging uit een request-body. Alleen aanwezige velden tellen. */
export function leesProjectWijziging(body: unknown): Validatie<ProjectWijziging> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const wijziging: ProjectWijziging = {}

  if ('naam' in body) {
    const naam = leesNaam(body.naam)
    if (!naam.ok) return naam
    wijziging.naam = naam.waarde
  }
  if ('omschrijving' in body) {
    const omschrijving = leesOmschrijving(body.omschrijving)
    if (!omschrijving.ok) return omschrijving
    wijziging.omschrijving = omschrijving.waarde
  }
  if ('actief' in body) {
    if (typeof body.actief !== 'boolean') {
      return { ok: false, fout: 'Actief is waar of niet waar.' }
    }
    wijziging.actief = body.actief
  }

  if (Object.keys(wijziging).length === 0) return { ok: false, fout: 'Niets om te wijzigen.' }

  return { ok: true, waarde: wijziging }
}

// ─── Systeemgrens: rijen uit de database ────────────────────────────────────

export function projectVanRij(rij: unknown): Project | null {
  if (!isObject(rij)) return null

  const id = tekst(rij.id)
  const naam = tekst(rij.naam)
  const aangemaaktOp = tekst(rij.aangemaakt_op)
  if (id === null || naam === null || aangemaaktOp === null) return null

  return {
    id,
    naam,
    omschrijving: tekst(rij.omschrijving),
    // `actief` heeft `not null default true` in de database. Een rij zonder de
    // kolom is dus kapot, en dan is 'niet actief' de veilige lezing: liever een
    // project stil uit de keuzelijst dan een gearchiveerd project dat terugkomt.
    actief: rij.actief === true,
    aangemaaktOp,
  }
}

export function projectenVanRijen(rijen: readonly unknown[]): Project[] {
  return rijen.map(projectVanRij).filter((p): p is Project => p !== null)
}

// ─── Systeemgrens: het antwoord van onze eigen API ──────────────────────────
// De database geeft snake_case, de API camelCase. Beide worden gelezen, niet
// gecast: een server die iets anders teruggeeft levert een nette fout op, geen
// half object dat drie componenten verderop crasht.

export function leesProjectJson(ruw: unknown): Project | null {
  if (!isObject(ruw)) return null

  const id = tekst(ruw.id)
  const naam = tekst(ruw.naam)
  const aangemaaktOp = tekst(ruw.aangemaaktOp)
  if (id === null || naam === null || aangemaaktOp === null) return null

  return {
    id,
    naam,
    omschrijving: tekst(ruw.omschrijving),
    actief: ruw.actief === true,
    aangemaaktOp,
  }
}

/** Het antwoord van `GET /api/lifeos/projecten`. */
export function leesProjectenAntwoord(ruw: unknown): Project[] | null {
  if (!isObject(ruw) || !Array.isArray(ruw.projecten)) return null

  const projecten = ruw.projecten.map(leesProjectJson)
  // Eén kapot item = een kapot antwoord. Stil overslaan zou een project laten
  // verdwijnen zonder dat iemand het merkt.
  if (projecten.some((p) => p === null)) return null
  return projecten.filter((p): p is Project => p !== null)
}

/** Het antwoord van `POST /api/lifeos/projecten` en `PATCH /api/lifeos/projecten/[id]`. */
export function leesProjectAntwoord(ruw: unknown): Project | null {
  if (!isObject(ruw)) return null
  return leesProjectJson(ruw.project)
}
