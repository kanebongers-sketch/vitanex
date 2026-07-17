// ─── LifeOS — CRM: het historie-logboek in de database ──────────────────────
// SERVER-ONLY. Het logboek per persoon: elke statuswissel, elk contactmoment,
// elke losse notitie. Dit is wat de popup toont als "status-geschiedenis en
// bijzonderheden".
//
// De service-role-client komt als PARAMETER binnen (van `vereisLifeosToegang`):
// deze module weet niets van env of van welk Supabase-project. Zo blijft de
// LifeOS-brug op precies één plek — zie `admin.ts`.
//
// `opslag.ts` gebruikt `logGebeurtenis` om vanuit een persoon-actie een regel bij
// te schrijven; de historie-route gebruikt `haalHistorie` (lezen) en opnieuw
// `logGebeurtenis` (een losse notitie). De constraint-consistentie zit in de pure
// `historieRijVoor`, zodat hij zonder database testbaar is.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  HISTORIE_SOORTEN,
  MAX_NOTITIE,
  type HistorieItem,
  type HistorieSoort,
  type Validatie,
} from './crm'
import { vertaalFout, type Uitkomst } from './fout'

export const HISTORIE_KOLOMMEN = 'id, soort, van_status, naar_status, notitie, aangemaakt_op'

// ─── De gebeurtenis die je logt ─────────────────────────────────────────────
// Een discriminated union, zodat de DB-constraint `crm_historie_status_consistent`
// al bij het typen onmogelijk te schenden is: ALLEEN een status-wijziging draagt
// statussen; een notitie/contact/follow-up mag ze niet dragen. De runtime-check in
// `historieRijVoor` is de tweede verdediging (net als de DB naast de app).

export type Gebeurtenis =
  | { soort: 'status_wijziging'; vanStatus: string | null; naarStatus: string; notitie?: string | null }
  | { soort: 'notitie'; notitie: string }
  | { soort: 'contact_gelegd'; notitie?: string | null }
  | { soort: 'follow_up_gezet'; notitie?: string | null }

/** De velden die de historie-rij écht draagt (zonder user_id/persoon_id). */
export interface HistorieRijVelden {
  soort: HistorieSoort
  van_status: string | null
  naar_status: string | null
  notitie: string | null
}

function isHistorieSoort(v: unknown): v is HistorieSoort {
  return typeof v === 'string' && (HISTORIE_SOORTEN as readonly string[]).includes(v)
}

/** Getrimde niet-lege tekst, of null. */
function leegNaarNull(v: string | null | undefined): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

/**
 * Gebeurtenis → de rij-velden, of `null` als de gebeurtenis de DB-constraint zou
 * schenden. Puur: geen DB. Dit is de laag die de constraint `..._status_consistent`
 * spiegelt — een status-wijziging vereist een `naar_status`, en géén andere soort
 * mag status-velden dragen (anders liegt het log over wat er gebeurde).
 */
export function historieRijVoor(gebeurtenis: Gebeurtenis): HistorieRijVelden | null {
  if (!isHistorieSoort(gebeurtenis.soort)) return null

  if (gebeurtenis.soort === 'status_wijziging') {
    const naar = leegNaarNull(gebeurtenis.naarStatus)
    if (naar === null) return null // een wissel zonder naar-status is geen wissel
    return {
      soort: 'status_wijziging',
      van_status: leegNaarNull(gebeurtenis.vanStatus),
      naar_status: naar,
      notitie: leegNaarNull(gebeurtenis.notitie),
    }
  }

  // notitie / contact_gelegd / follow_up_gezet: bewust GEEN status-velden.
  return {
    soort: gebeurtenis.soort,
    van_status: null,
    naar_status: null,
    notitie: leegNaarNull(gebeurtenis.notitie),
  }
}

/**
 * Schrijft één historie-regel. De insert-helper die `opslag.ts` (statuswissel,
 * contact, follow-up) én de historie-route (losse notitie) delen.
 */
export async function logGebeurtenis(
  admin: SupabaseClient,
  userId: string,
  persoonId: string,
  gebeurtenis: Gebeurtenis,
): Promise<Uitkomst<HistorieItem>> {
  const velden = historieRijVoor(gebeurtenis)
  if (velden === null) return { ok: false, reden: 'ongeldig' }

  const { data, error } = await admin
    .from('crm_historie')
    .insert({ user_id: userId, persoon_id: persoonId, ...velden })
    .select(HISTORIE_KOLOMMEN)
    .single()

  if (error) return { ok: false, reden: vertaalFout(error) }

  const item = historieVanRij(data)
  return item ? { ok: true, waarde: item } : { ok: false, reden: 'db' }
}

/** Alle historie van één persoon, nieuwste eerst (voor de popup-tijdlijn). */
export async function haalHistorie(
  admin: SupabaseClient,
  userId: string,
  persoonId: string,
): Promise<Uitkomst<HistorieItem[]>> {
  const { data, error } = await admin
    .from('crm_historie')
    .select(HISTORIE_KOLOMMEN)
    .eq('user_id', userId)
    .eq('persoon_id', persoonId)
    .order('aangemaakt_op', { ascending: false })

  if (error) return { ok: false, reden: vertaalFout(error) }
  return { ok: true, waarde: historieVanRijen(Array.isArray(data) ? data : []) }
}

// ─── De losse notitie uit de popup ──────────────────────────────────────────

/**
 * Valideert de body van `POST /crm/personen/[id]/historie` — de "voeg een
 * bijzonderheid/notitie toe"-actie. Alleen `soort:'notitie'` met vrije tekst; een
 * statuswissel loopt via de PATCH op de persoon, niet hier.
 */
export function leesLosseNotitie(body: unknown): Validatie<string> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }
  if (body.soort !== 'notitie') {
    return { ok: false, fout: "Alleen een notitie kan hier; gebruik soort='notitie'." }
  }
  if (typeof body.notitie !== 'string') return { ok: false, fout: 'Notitie ontbreekt.' }
  const notitie = body.notitie.trim()
  if (notitie.length === 0) return { ok: false, fout: 'Een notitie zonder tekst is geen notitie.' }
  if (notitie.length > MAX_NOTITIE) {
    return { ok: false, fout: `Notitie mag maximaal ${MAX_NOTITIE} tekens zijn.` }
  }
  return { ok: true, waarde: notitie }
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
 * Eén historie-rij → `HistorieItem` (snake_case → camelCase). Geen cast: een rij
 * zonder id/soort/aangemaakt_op of met een onbekende soort is kapot en wordt
 * overgeslagen, de rest houden we. Zelfde conventie als `taakVanRij`.
 */
export function historieVanRij(rij: unknown): HistorieItem | null {
  if (!isObject(rij)) return null

  const id = tekst(rij.id)
  const aangemaaktOp = tekst(rij.aangemaakt_op)
  if (id === null || aangemaaktOp === null) return null
  if (!isHistorieSoort(rij.soort)) return null

  return {
    id,
    soort: rij.soort,
    vanStatus: tekst(rij.van_status),
    naarStatus: tekst(rij.naar_status),
    notitie: tekst(rij.notitie),
    aangemaaktOp,
  }
}

export function historieVanRijen(rijen: readonly unknown[]): HistorieItem[] {
  return rijen.map(historieVanRij).filter((h): h is HistorieItem => h !== null)
}
