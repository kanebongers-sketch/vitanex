// ─── Club: uitgebreide instellingen van een sportschool (PUUR) ──────────────
// Wat de eigenaar zelf instelt en geen eigen tabel nodig heeft, staat in
// club_organisaties.instellingen (migratie 409). Lezen is vergevingsgezind
// (onbekend of kapot = standaard), opslaan is streng (leesOrgInstellingenInvoer).

import { MEDEWERKER_ROLLEN, RECHTEN, type MedewerkerRol } from './medewerker'

/**
 * De onderdelen van Club waarvoor je rechten per rol instelt. Zelfde sleutels
 * als ONDERDELEN in src/components/club/shell/onderdelen.ts (een test bewaakt dat).
 */
export const ONDERDEEL_SLEUTELS = [
  'vandaag', 'checkin', 'taken', 'notities', 'leden', 'leads', 'app', 'rooster', 'personeel', 'agenda', 'schemas', 'cijfers', 'beheer', 'bedrijf', 'sluiting', 'berichten', 'huisstijl', 'instellingen',
] as const

export const LEDENAPP_TABS = ['lessen', 'schema', 'voortgang'] as const
export type LedenappTab = (typeof LEDENAPP_TABS)[number]

export const LEDENAPP_TAB_LABEL: Record<LedenappTab, string> = {
  lessen: 'Lessen (groepslessen boeken)',
  schema: 'Schema (trainingsschema met coaching)',
  voortgang: 'Voortgang (metingen en trainingen per week)',
}

export const MAX_WELKOM = 160

export interface LedenappInstellingen {
  /** Een eigen zin op het beginscherm van de app, of null. */
  welkom: string | null
  /** Tabbladen die uit staan (Home en Profiel staan altijd aan). */
  tabsUit: LedenappTab[]
  /** Toont de app de check-in QR-code? */
  qr: boolean
}

/** Per rol de sleutels van de onderdelen die die rol ziet (zie shell/onderdelen.ts). */
export type Rechten = Record<MedewerkerRol, string[]>

export interface OrgInstellingen {
  ledenapp: LedenappInstellingen
  rechten: Rechten
}

export const STANDAARD_LEDENAPP: LedenappInstellingen = { welkom: null, tabsUit: [], qr: true }

export function standaardRechten(): Rechten {
  return Object.fromEntries(MEDEWERKER_ROLLEN.map((r) => [r, [...RECHTEN[r]]])) as Rechten
}

function object(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function isTab(v: unknown): v is LedenappTab {
  return (LEDENAPP_TABS as readonly unknown[]).includes(v)
}

function schoon(v: unknown): string {
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : ''
}

function leesLedenapp(v: unknown): LedenappInstellingen {
  const o = object(v)
  if (!o) return STANDAARD_LEDENAPP
  const welkom = schoon(o.welkom).slice(0, MAX_WELKOM)
  return {
    welkom: welkom || null,
    tabsUit: Array.isArray(o.tabs_uit) ? [...new Set(o.tabs_uit.filter(isTab))] : [],
    qr: o.qr !== false,
  }
}

function leesRechten(v: unknown, onderdelen: readonly string[]): Rechten {
  const o = object(v)
  const standaard = standaardRechten()
  if (!o) return standaard
  return Object.fromEntries(
    MEDEWERKER_ROLLEN.map((rol) => {
      const lijst = o[rol]
      return [rol, Array.isArray(lijst) ? [...new Set(lijst.filter((x): x is string => typeof x === 'string' && onderdelen.includes(x)))] : standaard[rol]]
    }),
  ) as Rechten
}

/** Uit de database, vergevingsgezind: alles wat niet klopt wordt de standaard. */
export function orgInstellingenUitRij(v: unknown, onderdelen: readonly string[]): OrgInstellingen {
  const o = object(v)
  return { ledenapp: leesLedenapp(o?.ledenapp), rechten: leesRechten(o?.rechten, onderdelen) }
}

/** Naar de database (snake_case zoals de kolom). */
export function orgInstellingenNaarJson(i: OrgInstellingen): Record<string, unknown> {
  return {
    ledenapp: { welkom: i.ledenapp.welkom, tabs_uit: i.ledenapp.tabsUit, qr: i.ledenapp.qr },
    rechten: i.rechten,
  }
}

export type Uitslag<T> = { ok: true; waarde: T } | { ok: false; fout: string }

/** Een wijziging van de pagina: streng, alleen bekende waarden. Wat ontbreekt blijft zoals het was. */
export function leesOrgInstellingenInvoer(body: unknown, huidig: OrgInstellingen, onderdelen: readonly string[]): Uitslag<OrgInstellingen> {
  const o = object(body)
  if (!o) return { ok: false, fout: 'Ongeldige invoer.' }
  let ledenapp = huidig.ledenapp
  if ('ledenapp' in o) {
    const l = object(o.ledenapp)
    if (!l) return { ok: false, fout: 'Ongeldige instellingen voor de ledenapp.' }
    const welkom = schoon(l.welkom)
    if (welkom.length > MAX_WELKOM) return { ok: false, fout: `De welkomsttekst mag maximaal ${MAX_WELKOM} tekens zijn.` }
    if (!Array.isArray(l.tabsUit) || !l.tabsUit.every(isTab)) return { ok: false, fout: 'Onbekend tabblad.' }
    if (typeof l.qr !== 'boolean') return { ok: false, fout: 'Kies of de check-in code zichtbaar is.' }
    ledenapp = { welkom: welkom || null, tabsUit: [...new Set(l.tabsUit as LedenappTab[])], qr: l.qr }
  }
  let rechten = huidig.rechten
  if ('rechten' in o) {
    const r = object(o.rechten)
    if (!r) return { ok: false, fout: 'Ongeldige rechten.' }
    const nieuw = { ...huidig.rechten }
    for (const [rol, lijst] of Object.entries(r)) {
      if (!(MEDEWERKER_ROLLEN as readonly string[]).includes(rol)) return { ok: false, fout: 'Onbekende rol.' }
      if (!Array.isArray(lijst) || !lijst.every((x) => typeof x === 'string' && onderdelen.includes(x))) return { ok: false, fout: 'Onbekend onderdeel bij de rechten.' }
      nieuw[rol as MedewerkerRol] = [...new Set(lijst as string[])]
    }
    rechten = nieuw
  }
  return { ok: true, waarde: { ledenapp, rechten } }
}
