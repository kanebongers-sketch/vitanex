// ─── LifeOS — CRM: groepen, statussen en de persoon zelf ────────────────────
// DÉ bron van waarheid voor het mensen-bord. De migratie (140_crm.sql) kent de
// UNIE van alle statussen als vangnet; dit bestand kent de precieze regel: welke
// status bij welke groep hoort, in welke kolomvolgorde, met welke tint. De UI, de
// API en de validatie leiden hier allemaal uit af — nooit dupliceren.
//
// PUUR: geen fetch, geen DB, geen React. De validatie hieronder is de systeemgrens
// (user input) en is zo testbaar zonder database. Zelfde opzet als `taken.ts`.

export type Groep = 'pt_klant' | 'budel_team' | 'pt_team'

export const GROEPEN: readonly Groep[] = Object.freeze(['pt_klant', 'budel_team', 'pt_team'])

/**
 * De tint van een statuskolom, voor de UI. STRIKT navy+cyan (zie branding):
 *   actie — dit vraagt iets van je (cyaan accent op de kolomkop)
 *   bezig — loopt, wacht op iets
 *   goed  — op koers / actief
 *   rust  — afgerond of slapend (gedempt)
 * De tint kiest geen kleur; de UI mapt 'm naar tokens.
 */
export type StatusTint = 'actie' | 'bezig' | 'goed' | 'rust'

export interface StatusDef {
  key: string
  /** Weergavenaam (NL) — de kolomkop. */
  label: string
  /** 0-based kolomvolgorde, links naar rechts. */
  volgorde: number
  tint: StatusTint
}

export interface GroepDef {
  key: Groep
  /** Weergavenaam (NL) — de tab. */
  label: string
  /** Eén zin: wie zit er in deze groep. */
  omschrijving: string
  /** De kolommen van deze groep, op volgorde. */
  statussen: readonly StatusDef[]
}

// ─── De pipelines ───────────────────────────────────────────────────────────

/** PT-klanten: de uitgebreide benader-/opvolg-pipeline. */
const KLANT_STATUSSEN: readonly StatusDef[] = Object.freeze([
  { key: 'moet_benaderen', label: 'Moet benaderen', volgorde: 0, tint: 'actie' },
  { key: 'benaderd', label: 'Benaderd', volgorde: 1, tint: 'bezig' },
  { key: 'wacht_op_reactie', label: 'Wacht op reactie', volgorde: 2, tint: 'bezig' },
  { key: 'afspraak_ingepland', label: 'Afspraak ingepland', volgorde: 3, tint: 'goed' },
  { key: 'actieve_klant', label: 'Actieve klant', volgorde: 4, tint: 'goed' },
  { key: 'inactief', label: 'Inactief', volgorde: 5, tint: 'rust' },
])

/** Teams (Budel + PT): een simpelere management-flow per teamlid. */
const TEAM_STATUSSEN: readonly StatusDef[] = Object.freeze([
  { key: 'nieuw', label: 'Nieuw', volgorde: 0, tint: 'actie' },
  { key: 'actief', label: 'Actief', volgorde: 1, tint: 'goed' },
  { key: 'aandacht_nodig', label: 'Aandacht nodig', volgorde: 2, tint: 'actie' },
  { key: 'gesprek_plannen', label: 'Gesprek plannen', volgorde: 3, tint: 'bezig' },
  { key: 'inactief', label: 'Inactief', volgorde: 4, tint: 'rust' },
])

export const GROEP_DEFS: readonly GroepDef[] = Object.freeze([
  {
    key: 'pt_klant',
    label: 'PT-klanten',
    omschrijving: 'Je personal-training-klanten: wie moet je benaderen en hoe staat het ervoor.',
    statussen: KLANT_STATUSSEN,
  },
  {
    key: 'budel_team',
    label: 'Team Budel',
    omschrijving: 'Het team van Budel de Fitness.',
    statussen: TEAM_STATUSSEN,
  },
  {
    key: 'pt_team',
    label: 'PT-team',
    omschrijving: 'Je eigen personal-training-team.',
    statussen: TEAM_STATUSSEN,
  },
])

// ─── Opzoeken ───────────────────────────────────────────────────────────────

export function isGroep(v: unknown): v is Groep {
  return typeof v === 'string' && (GROEPEN as readonly string[]).includes(v)
}

export function groepDef(groep: Groep): GroepDef {
  // `!` mag: GROEP_DEFS dekt elke Groep per constructie, en `isGroep` bewaakt de
  // grens. Een ontbrekende zou een programmeerfout zijn, geen user input.
  return GROEP_DEFS.find((g) => g.key === groep)!
}

/** De statussen (kolommen) van een groep, op volgorde. */
export function statussenVoorGroep(groep: Groep): readonly StatusDef[] {
  return groepDef(groep).statussen
}

/** Hoort deze status bij deze groep? De regel die de DB-allowlist niet kent. */
export function isGeldigeStatusVoorGroep(groep: Groep, status: string): boolean {
  return statussenVoorGroep(groep).some((s) => s.key === status)
}

/** De begin-status van een groep (de eerste kolom): waar een nieuwe tegel landt. */
export function beginStatus(groep: Groep): string {
  return statussenVoorGroep(groep)[0].key
}

/** De definitie van één status binnen een groep, of null als 'ie er niet bij hoort. */
export function statusDef(groep: Groep, status: string): StatusDef | null {
  return statussenVoorGroep(groep).find((s) => s.key === status) ?? null
}

// ─── De persoon ─────────────────────────────────────────────────────────────

export interface Persoon {
  id: string
  naam: string
  groep: Groep
  status: string
  /** Sleepvolgorde binnen de kolom (lager = hoger). */
  sortering: number
  /** Dagsleutel (YYYY-MM-DD) waarop je 'm wilt benaderen, of null. */
  followUpDatum: string | null
  telefoon: string | null
  email: string | null
  bijzonderheden: string | null
  /** ISO-moment van laatste contact, of null. */
  laatsteContactOp: string | null
  aangemaaktOp: string
}

export type HistorieSoort = 'status_wijziging' | 'notitie' | 'contact_gelegd' | 'follow_up_gezet'

export const HISTORIE_SOORTEN: readonly HistorieSoort[] = Object.freeze([
  'status_wijziging',
  'notitie',
  'contact_gelegd',
  'follow_up_gezet',
])

export interface HistorieItem {
  id: string
  soort: HistorieSoort
  vanStatus: string | null
  naarStatus: string | null
  notitie: string | null
  aangemaaktOp: string
}

export const MAX_NAAM = 200
export const MAX_BIJZONDERHEDEN = 5000
export const MAX_NOTITIE = 5000
export const MAX_TELEFOON = 40
export const MAX_EMAIL = 320

// ─── Validatie: nieuwe persoon / wijziging ──────────────────────────────────

export type Validatie<T> = { ok: true; waarde: T } | { ok: false; fout: string }

export interface NieuwePersoon {
  naam: string
  groep: Groep
  status: string
  followUpDatum: string | null
  telefoon: string | null
  email: string | null
  bijzonderheden: string | null
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Getrimde niet-lege tekst binnen een maxlengte, of een fout. */
function leesTekst(v: unknown, wat: string, max: number): Validatie<string> {
  if (typeof v !== 'string') return { ok: false, fout: `${wat} ontbreekt.` }
  const s = v.trim()
  if (s.length === 0) return { ok: false, fout: `${wat} mag niet leeg zijn.` }
  if (s.length > max) return { ok: false, fout: `${wat} mag maximaal ${max} tekens zijn.` }
  return { ok: true, waarde: s }
}

/** Optionele tekst: leeg/afwezig → null, anders getrimd binnen max. */
function leesOptioneleTekst(v: unknown, wat: string, max: number): Validatie<string | null> {
  if (v === null || v === undefined) return { ok: true, waarde: null }
  if (typeof v !== 'string') return { ok: false, fout: `${wat} moet tekst zijn.` }
  const s = v.trim()
  if (s.length === 0) return { ok: true, waarde: null }
  if (s.length > max) return { ok: false, fout: `${wat} mag maximaal ${max} tekens zijn.` }
  return { ok: true, waarde: s }
}

/** YYYY-MM-DD of null. Bewust hier lokaal, zoals `taken.ts` (geen `@/`-alias in tests). */
function leesDatum(v: unknown): Validatie<string | null> {
  if (v === null || v === undefined) return { ok: true, waarde: null }
  if (typeof v !== 'string') return { ok: false, fout: 'Datum moet YYYY-MM-DD zijn.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return { ok: false, fout: 'Datum moet YYYY-MM-DD zijn.' }
  return { ok: true, waarde: v }
}

/** Nieuwe persoon uit een request-body. Faalt met een leesbare NL-melding. */
export function leesNieuwePersoon(body: unknown): Validatie<NieuwePersoon> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const naam = leesTekst(body.naam, 'Naam', MAX_NAAM)
  if (!naam.ok) return naam

  if (!isGroep(body.groep)) return { ok: false, fout: 'Kies een geldige groep.' }
  const groep = body.groep

  // Status is optioneel bij het aanmaken: geen status → de begin-kolom van de
  // groep. Wél een status → moet bij de groep horen (een klant-status op een
  // teamlid is een fout, geen "kan gebeuren").
  let status = beginStatus(groep)
  if (body.status !== undefined && body.status !== null) {
    if (typeof body.status !== 'string' || !isGeldigeStatusVoorGroep(groep, body.status)) {
      return { ok: false, fout: 'Die status hoort niet bij deze groep.' }
    }
    status = body.status
  }

  const followUpDatum = leesDatum(body.followUpDatum)
  if (!followUpDatum.ok) return followUpDatum
  const telefoon = leesOptioneleTekst(body.telefoon, 'Telefoon', MAX_TELEFOON)
  if (!telefoon.ok) return telefoon
  const email = leesOptioneleTekst(body.email, 'E-mail', MAX_EMAIL)
  if (!email.ok) return email
  const bijzonderheden = leesOptioneleTekst(body.bijzonderheden, 'Bijzonderheden', MAX_BIJZONDERHEDEN)
  if (!bijzonderheden.ok) return bijzonderheden

  return {
    ok: true,
    waarde: {
      naam: naam.waarde,
      groep,
      status,
      followUpDatum: followUpDatum.waarde,
      telefoon: telefoon.waarde,
      email: email.waarde,
      bijzonderheden: bijzonderheden.waarde,
    },
  }
}

/** Alleen de meegestuurde velden wijzigen. `groep` verandert NOOIT — dat is geen
 *  wijziging maar een verhuizing, en de statussen zouden niet meer kloppen. */
export interface PersoonWijziging {
  naam?: string
  status?: string
  sortering?: number
  followUpDatum?: string | null
  telefoon?: string | null
  email?: string | null
  bijzonderheden?: string | null
  laatsteContactOp?: string | null
}

/**
 * Wijziging uit een request-body. `groep` is verplicht meegestuurd zodat we een
 * nieuwe status tegen de JUISTE groep kunnen valideren — maar de groep zelf
 * wijzigt niet.
 */
export function leesPersoonWijziging(body: unknown, groep: Groep): Validatie<PersoonWijziging> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const wijziging: PersoonWijziging = {}

  if ('naam' in body) {
    const naam = leesTekst(body.naam, 'Naam', MAX_NAAM)
    if (!naam.ok) return naam
    wijziging.naam = naam.waarde
  }
  if ('status' in body) {
    if (typeof body.status !== 'string' || !isGeldigeStatusVoorGroep(groep, body.status)) {
      return { ok: false, fout: 'Die status hoort niet bij deze groep.' }
    }
    wijziging.status = body.status
  }
  if ('sortering' in body) {
    if (typeof body.sortering !== 'number' || !Number.isFinite(body.sortering)) {
      return { ok: false, fout: 'Sortering moet een getal zijn.' }
    }
    wijziging.sortering = body.sortering
  }
  if ('followUpDatum' in body) {
    const datum = leesDatum(body.followUpDatum)
    if (!datum.ok) return datum
    wijziging.followUpDatum = datum.waarde
  }
  if ('telefoon' in body) {
    const t = leesOptioneleTekst(body.telefoon, 'Telefoon', MAX_TELEFOON)
    if (!t.ok) return t
    wijziging.telefoon = t.waarde
  }
  if ('email' in body) {
    const e = leesOptioneleTekst(body.email, 'E-mail', MAX_EMAIL)
    if (!e.ok) return e
    wijziging.email = e.waarde
  }
  if ('bijzonderheden' in body) {
    const b = leesOptioneleTekst(body.bijzonderheden, 'Bijzonderheden', MAX_BIJZONDERHEDEN)
    if (!b.ok) return b
    wijziging.bijzonderheden = b.waarde
  }
  if ('laatsteContactOp' in body) {
    // Alleen null (wissen) of een niet-lege string (een ISO-moment dat de server
    // meestal zelf zet). We narrowen 'm licht; de server is de echte bron.
    if (body.laatsteContactOp === null) {
      wijziging.laatsteContactOp = null
    } else if (typeof body.laatsteContactOp === 'string' && body.laatsteContactOp.trim().length > 0) {
      wijziging.laatsteContactOp = body.laatsteContactOp
    } else {
      return { ok: false, fout: 'Laatste contact moet een moment of null zijn.' }
    }
  }

  if (Object.keys(wijziging).length === 0) return { ok: false, fout: 'Niets om te wijzigen.' }
  return { ok: true, waarde: wijziging }
}
