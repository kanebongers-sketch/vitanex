// ─── Fit Factory Club, instellingen: invoer controleren (PUUR) ──────────────
// Regels per vestiging, zalen, lestypen, het weekrooster en medewerkers.
// Elke lezer krijgt `unknown` en geeft nette databasevelden (snake_case) of een
// Nederlandse foutmelding. `gedeeltelijk` = een PATCH: alleen meegegeven velden.

import { MEDEWERKER_ROLLEN } from '@/lib/club/kern/medewerker'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { isVestigingSlug } from '@/lib/club/kern/vestigingen'
import { controleerOpeningstijden, openingstijdenNaarJson } from '@/lib/club/rooster/openingstijden'
import { REGEL_DEFINITIES, REGEL_SLEUTELS, regelsNaarJson, type RoosterRegels } from '@/lib/club/rooster/regels'
import { isDatum, isTijd } from '@/lib/club/rooster/tijd'
import { LES_SOORTEN } from '@/lib/club/rooster/typen'
import { isUuid } from '@/lib/club/rooster/invoer'

export type Gelezen<T> = { ok: true; waarde: T } | { ok: false; fout: string }
type Velden = Record<string, unknown>
type Lezer = (v: unknown) => Gelezen<unknown>

function object(v: unknown): Velden | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Velden) : null
}

const ok = <T>(waarde: T): Gelezen<T> => ({ ok: true, waarde })
const nee = <T>(fout: string): Gelezen<T> => ({ ok: false, fout })

// ── Veldlezers ────────────────────────────────────────────────────────────

export function tekstVeld(label: string, min: number, max: number): Lezer {
  return (v) => {
    const s = typeof v === 'string' ? v.trim() : ''
    if (s.length < min) return nee(min <= 1 ? `Vul ${label} in.` : `${label} is te kort.`)
    if (s.length > max) return nee(`${label} is te lang (maximaal ${max} tekens).`)
    return ok(s)
  }
}

export function optioneleTekst(label: string, max: number): Lezer {
  return (v) => {
    if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) return ok(null)
    if (typeof v !== 'string') return nee(`${label} is ongeldig.`)
    return v.trim().length > max ? nee(`${label} is te lang (maximaal ${max} tekens).`) : ok(v.trim())
  }
}

export function getalVeld(label: string, min: number, max: number): Lezer {
  return (v) => {
    const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
    if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) return nee(`${label} moet tussen ${min} en ${max} liggen.`)
    return ok(n)
  }
}

const jaNee: Lezer = (v) => (typeof v === 'boolean' ? ok(v) : nee('Kies aan of uit.'))

function idVeld(label: string, verplicht: boolean): Lezer {
  return (v) => {
    if ((v === null || v === '' || v === undefined) && !verplicht) return ok(null)
    return isUuid(v) ? ok(v) : nee(`Kies ${label}.`)
  }
}

function keuzeVeld(label: string, opties: readonly string[]): Lezer {
  return (v) => (typeof v === 'string' && opties.includes(v) ? ok(v) : nee(`Kies ${label}.`))
}

function lijstVeld(label: string, opties: readonly string[], minimaal: number): Lezer {
  return (v) => {
    if (!Array.isArray(v) || v.some((x) => typeof x !== 'string' || !opties.includes(x))) return nee(`Ongeldige keuze bij ${label}.`)
    const uniek = [...new Set(v.map(String))]
    return uniek.length < minimaal ? nee(`Kies minstens een ${label}.`) : ok(uniek)
  }
}

const emailVeld: Lezer = (v) => {
  if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) return ok(null)
  const s = typeof v === 'string' ? v.trim().toLowerCase() : ''
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 160 ? ok(s) : nee('Vul een geldig e-mailadres in.')
}

const datumVeld = (label: string, verplicht: boolean): Lezer => (v) => {
  if ((v === null || v === '' || v === undefined) && !verplicht) return ok(null)
  return isDatum(v) ? ok(v) : nee(`Vul ${label} in als datum.`)
}

const tijdVeld: Lezer = (v) => (isTijd(v) ? ok(v.slice(0, 5)) : nee('Vul een starttijd in, bijvoorbeeld 19:00.'))

/**
 * Lees velden volgens een schema { invoernaam: [kolomnaam, lezer] }.
 * Volledig: elk veld moet er zijn (ontbrekend = undefined, de lezer beslist).
 * Gedeeltelijk: alleen meegegeven velden, en minstens een.
 */
export function leesVolgensSchema(ruw: unknown, schema: Record<string, readonly [string, Lezer]>, gedeeltelijk: boolean): Gelezen<Velden> {
  const b = object(ruw)
  if (!b) return nee('Ongeldig verzoek.')
  let uit: Velden = {}
  for (const [invoer, [kolom, lees]] of Object.entries(schema)) {
    if (gedeeltelijk && b[invoer] === undefined) continue
    const r = lees(b[invoer])
    if (!r.ok) return r
    uit = { ...uit, [kolom]: r.waarde }
  }
  if (Object.keys(uit).length === 0) return nee('Er is niets om op te slaan.')
  return ok(uit)
}

// ── Schema's per onderdeel ────────────────────────────────────────────────

export const ZAAL_SCHEMA = {
  naam: ['naam', tekstVeld('de naam van de zaal', 1, 60)],
  capaciteit: ['capaciteit', getalVeld('Capaciteit', 1, 500)],
  actief: ['actief', jaNee],
} as const

export const LESTYPE_SCHEMA = {
  naam: ['naam', tekstVeld('de naam van de les', 1, 60)],
  omschrijving: ['omschrijving', optioneleTekst('De omschrijving', 600)],
  soort: ['soort', keuzeVeld('een soort', LES_SOORTEN)],
  duurMin: ['duur_min', getalVeld('De duur', 10, 240)],
  intensiteit: ['intensiteit', getalVeld('De intensiteit', 1, 3)],
  actief: ['actief', jaNee],
} as const

export const SERIE_SCHEMA = {
  lestypeId: ['lestype_id', idVeld('een les', true)],
  zaalId: ['zaal_id', idVeld('een zaal', false)],
  instructeurId: ['instructeur_id', idVeld('een instructeur', false)],
  weekdag: ['weekdag', getalVeld('De weekdag', 1, 7)],
  starttijd: ['starttijd', tijdVeld],
  duurMin: ['duur_min', getalVeld('De duur', 10, 240)],
  capaciteit: ['capaciteit', getalVeld('Capaciteit', 1, 500)],
  vanaf: ['vanaf', datumVeld('de startdatum', true)],
  tot: ['tot', datumVeld('de einddatum', false)],
  actief: ['actief', jaNee],
} as const

/** Medewerkers: de vestigingen moeten bij de sportschool horen (de sleutels van haar vestigingen). */
export function medewerkerSchema(vestigingen: readonly string[]) {
  return {
    naam: ['naam', tekstVeld('een naam', 1, 80)],
    email: ['email', emailVeld],
    rollen: ['rollen', lijstVeld('rol', MEDEWERKER_ROLLEN, 1)],
    vestigingen: ['vestigingen', lijstVeld('vestiging', vestigingen, 1)],
    actief: ['actief', jaNee],
  } as const
}

/** Een nieuw item: velden die niet zijn meegegeven krijgen hun standaard voordat ze gelezen worden. */
export function leesNieuw(ruw: unknown, schema: Record<string, readonly [string, Lezer]>, standaard: Velden): Gelezen<Velden> {
  const b = object(ruw)
  if (!b) return nee('Ongeldig verzoek.')
  return leesVolgensSchema({ ...standaard, ...b }, schema, false)
}

/** Een serie: "tot" mag niet voor "vanaf" liggen. */
export function controleerLooptijd(v: Velden): string | null {
  const vanaf = v.vanaf
  const tot = v.tot
  return typeof vanaf === 'string' && typeof tot === 'string' && tot < vanaf ? 'De einddatum ligt voor de startdatum.' : null
}

export function leesVestiging(ruw: unknown): Vestiging | null {
  const b = object(ruw)
  return b && isVestigingSlug(b.vestiging) ? b.vestiging : null
}

// ── Regels en openingstijden ──────────────────────────────────────────────

export interface RegelsInvoer {
  vestiging: Vestiging
  regels: Record<string, number>
  openingstijden: Record<string, [string, string]>
}

/** Strenger dan regelsUitJson: buiten de grenzen is een fout, niet stil afkappen. */
export function leesRegelsInvoer(ruw: unknown): Gelezen<RegelsInvoer> {
  const b = object(ruw)
  const vestiging = leesVestiging(ruw)
  if (!b || !vestiging) return nee('Kies een vestiging.')
  const r = object(b.regels)
  if (!r) return nee('De regels ontbreken.')
  let regels: RoosterRegels = { annuleerUren: 0, noShowDrempel: 0, noShowBlokkadeDagen: 0, reserveerDagenVooruit: 0, maxOpenReserveringen: 0, checkinVensterMin: 0 }
  for (const sleutel of REGEL_SLEUTELS) {
    const def = REGEL_DEFINITIES[sleutel]
    const g = getalVeld(def.label, def.min, def.max)(r[sleutel])
    if (!g.ok) return nee(g.fout)
    regels = { ...regels, [sleutel]: Number(g.waarde) }
  }
  const open = controleerOpeningstijden(b.openingstijden)
  if (!open.ok) return nee(open.fout)
  return ok({ vestiging, regels: regelsNaarJson(regels), openingstijden: openingstijdenNaarJson(open.waarde) })
}
