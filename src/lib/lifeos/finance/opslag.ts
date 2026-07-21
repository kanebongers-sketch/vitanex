// ─── LifeOS — Finance in de database ────────────────────────────────────────
// SERVER-ONLY. Alle databasetoegang voor transacties én facturen staat hier; de
// routes doen auth, validatie en het antwoord.
//
// De service-role-client komt als PARAMETER binnen (van `vereisLifeosToegang`):
// deze module weet niets van env of van welk Supabase-project. Zo blijft de
// LifeOS-brug op precies één plek — zie `admin.ts`.
//
// KRITIEK: die client omzeilt RLS. Elke query filtert daarom ZELF op `user_id` —
// zonder die filter zou een geraden id de rij van een ander raken. Single-tenant
// maakt dat vandaag theoretisch, maar dit is de regel die je niet één keer mag
// vergeten (zie `crm/opslag.ts`). Fout ≠ leeg: een DB-storing geeft `reden: 'db'`,
// geen lege lijst — anders leest een leeg finance-scherm als "geen omzet".

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  isFactuurStatus,
  isSoort,
  maandGrens,
  naarEuro,
  type Factuur,
  type FactuurWijziging,
  type NieuweFactuur,
  type NieuweTransactie,
  type Transactie,
  type TransactieWijziging,
} from './finance'

const TRANSACTIE_KOLOMMEN =
  'id, soort, bedrag, omschrijving, categorie, datum, persoon_id, aangemaakt_op'
const FACTUUR_KOLOMMEN =
  'id, klant, bedrag, status, factuurdatum, vervaldatum, persoon_id, aangemaakt_op'

/** Postgres: unieke index geschonden. */
const UNIEK_GESCHONDEN = '23505'
/** Postgres: check-constraint geschonden — bv. een bedrag ≤ 0 of soort buiten de allowlist. */
const CHECK_GESCHONDEN = '23514'
/** Postgres: foreign key geschonden — bv. een persoon_id dat niet (meer) bestaat. */
const FK_GESCHONDEN = '23503'
/** Postgres: tekst die geen geldig type is — bv. 'abc' als uuid. */
const ONLEESBAAR = '22P02'
/** Postgres: ongeldig datum/tijd-formaat. */
const ONLEESBARE_TIJD = '22007'

export type Reden = 'db' | 'bezet' | 'ongeldig' | 'niet_gevonden'
export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: Reden }

function foutCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null
  const code = (error as { code: unknown }).code
  return typeof code === 'string' ? code : null
}

/**
 * Postgres-fout → onze reden. Alles wat de gebruiker fout deed wordt 'ongeldig'
 * (→ 400); alleen een echte storing blijft 'db' (→ 502). De FK/uuid/tijd-takken
 * staan hier omdat een geraden persoon_id of een onleesbare uuid cliëntfouten zijn,
 * geen serverstoring — zelfde keuze als `taken/opslag.ts` en `crm/fout.ts`.
 */
function vertaalFout(error: unknown): Reden {
  const code = foutCode(error)
  if (code === UNIEK_GESCHONDEN) return 'bezet'
  if (code === CHECK_GESCHONDEN) return 'ongeldig'
  if (code === FK_GESCHONDEN) return 'ongeldig'
  if (code === ONLEESBAAR) return 'ongeldig'
  if (code === ONLEESBARE_TIJD) return 'ongeldig'
  return 'db'
}

// ─── Transacties ────────────────────────────────────────────────────────────

export interface TransactieFilter {
  /** Maandsleutel 'YYYY-MM'. Weglaten = alle transacties (o.a. voor het overzicht). */
  maand?: string
}

export async function haalTransacties(
  admin: SupabaseClient,
  userId: string,
  filter: TransactieFilter = {},
): Promise<Uitkomst<Transactie[]>> {
  let query = admin.from('finance_transacties').select(TRANSACTIE_KOLOMMEN).eq('user_id', userId)

  if (filter.maand !== undefined) {
    const { start, eindExclusief } = maandGrens(filter.maand)
    query = query.gte('datum', start).lt('datum', eindExclusief)
  }

  const { data, error } = await query
    .order('datum', { ascending: false })
    .order('aangemaakt_op', { ascending: false })

  if (error) return { ok: false, reden: vertaalFout(error) }
  return { ok: true, waarde: transactiesVanRijen(Array.isArray(data) ? data : []) }
}

export async function maakTransactie(
  admin: SupabaseClient,
  userId: string,
  nieuw: NieuweTransactie,
): Promise<Uitkomst<Transactie>> {
  const { data, error } = await admin
    .from('finance_transacties')
    .insert({
      user_id: userId,
      soort: nieuw.soort,
      bedrag: nieuw.bedrag,
      omschrijving: nieuw.omschrijving,
      categorie: nieuw.categorie,
      datum: nieuw.datum,
      persoon_id: nieuw.persoonId,
    })
    .select(TRANSACTIE_KOLOMMEN)
    .single()

  if (error) return { ok: false, reden: vertaalFout(error) }
  const transactie = transactieVanRij(data)
  return transactie ? { ok: true, waarde: transactie } : { ok: false, reden: 'db' }
}

export async function wijzigTransactie(
  admin: SupabaseClient,
  userId: string,
  id: string,
  wijziging: TransactieWijziging,
): Promise<Uitkomst<Transactie>> {
  const velden: Record<string, unknown> = {}
  if (wijziging.soort !== undefined) velden.soort = wijziging.soort
  if (wijziging.bedrag !== undefined) velden.bedrag = wijziging.bedrag
  if (wijziging.omschrijving !== undefined) velden.omschrijving = wijziging.omschrijving
  if (wijziging.categorie !== undefined) velden.categorie = wijziging.categorie
  if (wijziging.datum !== undefined) velden.datum = wijziging.datum
  if (wijziging.persoonId !== undefined) velden.persoon_id = wijziging.persoonId

  const { data, error } = await admin
    .from('finance_transacties')
    .update(velden)
    .eq('id', id)
    .eq('user_id', userId)
    .select(TRANSACTIE_KOLOMMEN)
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }
  const transactie = transactieVanRij(data)
  return transactie ? { ok: true, waarde: transactie } : { ok: false, reden: 'db' }
}

export async function verwijderTransactie(
  admin: SupabaseClient,
  userId: string,
  id: string,
): Promise<Uitkomst<null>> {
  const { data, error } = await admin
    .from('finance_transacties')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }
  return { ok: true, waarde: null }
}

// ─── Facturen ───────────────────────────────────────────────────────────────

export async function haalFacturen(
  admin: SupabaseClient,
  userId: string,
): Promise<Uitkomst<Factuur[]>> {
  const { data, error } = await admin
    .from('finance_facturen')
    .select(FACTUUR_KOLOMMEN)
    .eq('user_id', userId)
    .order('factuurdatum', { ascending: false })
    .order('aangemaakt_op', { ascending: false })

  if (error) return { ok: false, reden: vertaalFout(error) }
  return { ok: true, waarde: facturenVanRijen(Array.isArray(data) ? data : []) }
}

export async function maakFactuur(
  admin: SupabaseClient,
  userId: string,
  nieuw: NieuweFactuur,
): Promise<Uitkomst<Factuur>> {
  // Geen `status`: de DB-default 'open' bepaalt de beginstatus (zie migratie 150).
  const { data, error } = await admin
    .from('finance_facturen')
    .insert({
      user_id: userId,
      klant: nieuw.klant,
      bedrag: nieuw.bedrag,
      factuurdatum: nieuw.factuurdatum,
      vervaldatum: nieuw.vervaldatum,
      persoon_id: nieuw.persoonId,
    })
    .select(FACTUUR_KOLOMMEN)
    .single()

  if (error) return { ok: false, reden: vertaalFout(error) }
  const factuur = factuurVanRij(data)
  return factuur ? { ok: true, waarde: factuur } : { ok: false, reden: 'db' }
}

export async function wijzigFactuur(
  admin: SupabaseClient,
  userId: string,
  id: string,
  wijziging: FactuurWijziging,
): Promise<Uitkomst<Factuur>> {
  const velden: Record<string, unknown> = {}
  if (wijziging.klant !== undefined) velden.klant = wijziging.klant
  if (wijziging.bedrag !== undefined) velden.bedrag = wijziging.bedrag
  if (wijziging.status !== undefined) velden.status = wijziging.status
  if (wijziging.factuurdatum !== undefined) velden.factuurdatum = wijziging.factuurdatum
  if (wijziging.vervaldatum !== undefined) velden.vervaldatum = wijziging.vervaldatum
  if (wijziging.persoonId !== undefined) velden.persoon_id = wijziging.persoonId

  const { data, error } = await admin
    .from('finance_facturen')
    .update(velden)
    .eq('id', id)
    .eq('user_id', userId)
    .select(FACTUUR_KOLOMMEN)
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }
  const factuur = factuurVanRij(data)
  return factuur ? { ok: true, waarde: factuur } : { ok: false, reden: 'db' }
}

export async function verwijderFactuur(
  admin: SupabaseClient,
  userId: string,
  id: string,
): Promise<Uitkomst<null>> {
  const { data, error } = await admin
    .from('finance_facturen')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }
  return { ok: true, waarde: null }
}

// ─── Systeemgrens: rijen uit de database ────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

/**
 * Een geld-bedrag uit een rij. PostgREST kan `numeric` als getal óf als string
 * teruggeven; beide worden hier een euro-getal op de cent. `null` als het onzin is
 * (dan valt de hele rij weg — een transactie zonder bedrag is kapot).
 */
function bedragVanRij(v: unknown): number | null {
  const getal = typeof v === 'string' ? Number(v) : v
  if (typeof getal !== 'number' || !Number.isFinite(getal)) return null
  return naarEuro(Math.round(getal * 100))
}

function transactieVanRij(rij: unknown): Transactie | null {
  if (!isObject(rij)) return null
  const id = tekst(rij.id)
  const omschrijving = tekst(rij.omschrijving)
  const datum = tekst(rij.datum)
  const aangemaaktOp = tekst(rij.aangemaakt_op)
  const bedrag = bedragVanRij(rij.bedrag)
  if (id === null || omschrijving === null || datum === null || aangemaaktOp === null) return null
  if (bedrag === null || !isSoort(rij.soort)) return null

  return {
    id,
    soort: rij.soort,
    bedrag,
    omschrijving,
    categorie: tekst(rij.categorie),
    datum,
    persoonId: tekst(rij.persoon_id),
    aangemaaktOp,
  }
}

export function transactiesVanRijen(rijen: readonly unknown[]): Transactie[] {
  return rijen.map(transactieVanRij).filter((t): t is Transactie => t !== null)
}

function factuurVanRij(rij: unknown): Factuur | null {
  if (!isObject(rij)) return null
  const id = tekst(rij.id)
  const klant = tekst(rij.klant)
  const factuurdatum = tekst(rij.factuurdatum)
  const aangemaaktOp = tekst(rij.aangemaakt_op)
  const bedrag = bedragVanRij(rij.bedrag)
  if (id === null || klant === null || factuurdatum === null || aangemaaktOp === null) return null
  if (bedrag === null || !isFactuurStatus(rij.status)) return null

  return {
    id,
    klant,
    bedrag,
    status: rij.status,
    factuurdatum,
    vervaldatum: tekst(rij.vervaldatum),
    persoonId: tekst(rij.persoon_id),
    aangemaaktOp,
  }
}

export function facturenVanRijen(rijen: readonly unknown[]): Factuur[] {
  return rijen.map(factuurVanRij).filter((f): f is Factuur => f !== null)
}
