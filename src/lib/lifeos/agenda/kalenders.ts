// ─── LifeOS — agenda's spiegelen (agenda_kalenders) ─────────────────────────
// SERVER-ONLY voor de DB-functies; de pure helpers onderaan zijn client-veilig
// getest (node-env).
//
// `agenda_kalenders` spiegelt je Google-kalenderlijst, plus per agenda één
// voorkeur die Google NIET kent: `zichtbaar` (het vinkje in de weergave). Naam,
// kleur en toegang komen van Google en worden bij elke sync bijgewerkt; de
// `zichtbaar`-voorkeur blijft van jou en overleeft die ververs.
//
// De service-role client komt als PARAMETER binnen (zie `@/lib/lifeos/admin`),
// net als in `opslag.ts`/`koppeling.ts`, zodat deze module gegarandeerd met de
// LifeOS-database praat.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Uitkomst } from './opslag'
import type { GoogleAfspraak, GoogleKalender } from './google'
import type { KalenderJson } from './agenda'

/** Eén opgeslagen agenda uit `agenda_kalenders`. */
export interface OpgeslagenKalender {
  kalenderId: string
  naam: string
  kleur: string | null
  toegang: string
  zichtbaar: boolean
}

// ─── DB: spiegelen & lezen ──────────────────────────────────────────────────

/**
 * Spiegelt de Google-lijst naar `agenda_kalenders`: werkt naam/kleur/toegang bij,
 * voegt nieuwe agenda's toe, en BEHOUDT de bestaande `zichtbaar`-voorkeur.
 *
 * De truc zit in wat we NIET meesturen: `zichtbaar` staat niet in de upsert-body,
 * dus de ON CONFLICT-update raakt die kolom niet — een bestaande voorkeur blijft
 * staan, en een nieuwe rij krijgt de kolom-default (`true`, dus standaard zichtbaar).
 * Een lege lijst spiegelen we niet: dan is er niets bij te werken.
 */
export async function verversKalenders(
  admin: SupabaseClient,
  userId: string,
  lijst: readonly GoogleKalender[],
): Promise<Uitkomst<null>> {
  if (lijst.length === 0) return { ok: true, waarde: null }

  const nu = new Date().toISOString()
  const rijen = lijst.map((k) => ({
    user_id: userId,
    kalender_id: k.id,
    naam: k.naam,
    kleur: k.kleur,
    toegang: k.toegang,
    bijgewerkt_op: nu,
  }))

  const { error } = await admin
    .from('agenda_kalenders')
    .upsert(rijen, { onConflict: 'user_id,kalender_id' })

  if (error) return { ok: false, reden: 'db' }
  return { ok: true, waarde: null }
}

/** De opgeslagen agenda's van deze gebruiker. */
export async function leesKalenders(
  admin: SupabaseClient,
  userId: string,
): Promise<Uitkomst<OpgeslagenKalender[]>> {
  const { data, error } = await admin
    .from('agenda_kalenders')
    .select('kalender_id, naam, kleur, toegang, zichtbaar')
    .eq('user_id', userId)

  if (error) return { ok: false, reden: 'db' }
  return { ok: true, waarde: opgeslagenKalendersUitRijen(Array.isArray(data) ? data : []) }
}

/** Zet de zichtbaarheid (het vinkje) van één agenda. */
export async function zetZichtbaar(
  admin: SupabaseClient,
  userId: string,
  kalenderId: string,
  zichtbaar: boolean,
): Promise<Uitkomst<null>> {
  const { error } = await admin
    .from('agenda_kalenders')
    .update({ zichtbaar, bijgewerkt_op: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('kalender_id', kalenderId)

  if (error) return { ok: false, reden: 'db' }
  return { ok: true, waarde: null }
}

// ─── Pure narrowing (systeemgrens: rijen uit agenda_kalenders) ──────────────
// Supabase geeft `unknown`-achtige data terug. We narrowen hier in plaats van te
// casten: een kolomwijziging levert dan een overgeslagen rij op, geen kapot object
// dat door de app lekt. Getest zonder database.

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

/** Eén rij → een opgeslagen agenda, of null als de rij onbruikbaar is. */
export function opgeslagenKalenderUitRij(rij: unknown): OpgeslagenKalender | null {
  if (!isObject(rij)) return null

  const kalenderId = tekst(rij.kalender_id)
  const naam = tekst(rij.naam)
  if (kalenderId === null || naam === null) return null

  return {
    kalenderId,
    naam,
    kleur: tekst(rij.kleur),
    toegang: tekst(rij.toegang) ?? '',
    // Alleen een strikte `false` verbergt; alles anders (ook een ontbrekende
    // kolom vóór de migratie) telt als zichtbaar.
    zichtbaar: rij.zichtbaar !== false,
  }
}

export function opgeslagenKalendersUitRijen(rijen: readonly unknown[]): OpgeslagenKalender[] {
  return rijen
    .map(opgeslagenKalenderUitRij)
    .filter((k): k is OpgeslagenKalender => k !== null)
}

/** De ids van de zichtbare agenda's — de set die de sync ophaalt en toont. */
export function zichtbareKalenderIds(kalenders: readonly OpgeslagenKalender[]): string[] {
  return kalenders.filter((k) => k.zichtbaar).map((k) => k.kalenderId)
}

// ─── Pure merge: kleur toewijzen aan events ─────────────────────────────────

/**
 * Kent elk event de agenda-id en -kleur toe. Nieuwe objecten (immutability), zodat
 * dezelfde events onder een andere kleur hergebruikt kunnen worden zonder de bron
 * te muteren. Zo draagt de multi-agenda-sync de kleur van elke agenda mee tot in
 * de cache-rijen, en daarmee tot in de blokken.
 */
export function kleurEvents(
  events: readonly GoogleAfspraak[],
  kalenderId: string,
  kleur: string | null,
): GoogleAfspraak[] {
  return events.map((e) => ({ ...e, kalenderId, kleur }))
}

// ─── Pure merge: Google-lijst + opgeslagen zichtbaarheid → weergave ─────────

/**
 * De weergave-lijst voor `GET /agenda/kalenders`: Google's actuele lijst (naam,
 * kleur, toegang, primair) verrijkt met de opgeslagen `zichtbaar`-voorkeur.
 *
 * Google is de bron voor alles behalve zichtbaarheid; die komt uit `agenda_kalenders`.
 * Een agenda die Google wél teruggeeft maar die (nog) niet is opgeslagen, is
 * standaard zichtbaar.
 */
export function bouwKalenderWeergave(
  googleKalenders: readonly GoogleKalender[],
  opgeslagen: readonly OpgeslagenKalender[],
): KalenderJson[] {
  const zichtbaarPerId = new Map(opgeslagen.map((k) => [k.kalenderId, k.zichtbaar]))
  return googleKalenders.map((k) => ({
    id: k.id,
    naam: k.naam,
    kleur: k.kleur,
    toegang: k.toegang,
    primair: k.primair,
    zichtbaar: zichtbaarPerId.get(k.id) ?? true,
  }))
}
