// ─── Fit Factory Club, rooster: lezen uit de database (SERVER) ──────────────
// Stamdata (zalen, lestypen, medewerkers), regels per vestiging en het
// lesoverzicht met tellingen. Elke query filtert op user_id.

import type { SupabaseClient } from '@supabase/supabase-js'
import { medewerkerUitRij, type Medewerker } from '@/lib/club/kern/medewerker'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { openingstijdenUitJson, type Openingstijden } from './openingstijden'
import { telPerLes, legeTelling, type LesOverzicht } from './raster'
import { regelsUitJson, type ReserveringStatus, type RoosterRegels } from './regels'
import {
  LES_KOLOMMEN,
  RESERVERING_KOLOMMEN,
  isReserveringStatus,
  lesUitRij,
  lestypeUitRij,
  reserveringUitRij,
  rijenNaar,
  zaalUitRij,
  type LesRij,
  type Lestype,
  type ReserveringRij,
  type Zaal,
} from './typen'

/** Een uitkomst voor de API: een waarde of een nette fout met HTTP-status. */
export type Resultaat<T> = { ok: true; waarde: T } | { ok: false; fout: string; status: number }

export function gelukt<T>(waarde: T): Resultaat<T> {
  return { ok: true, waarde }
}

export function mislukt<T>(fout: string, status = 400): Resultaat<T> {
  return { ok: false, fout, status }
}

const PAGINA = 1000
const BROK = 60

export interface Stamdata {
  zalen: Zaal[]
  lestypen: Lestype[]
  medewerkers: Medewerker[]
}

/** Zalen van de vestiging, alle lestypen en alle medewerkers (ook inactief, voor namen). */
export async function haalStamdata(admin: SupabaseClient, userId: string, vestiging: Vestiging): Promise<Stamdata | null> {
  const [z, t, m] = await Promise.all([
    admin.from('club_zalen').select('id, vestiging, naam, capaciteit, actief').eq('user_id', userId).eq('vestiging', vestiging).order('naam'),
    admin.from('club_lestypen').select('id, naam, omschrijving, soort, duur_min, intensiteit, actief').eq('user_id', userId).order('naam'),
    admin.from('club_medewerkers').select('id, naam, email, rollen, vestigingen, actief').eq('user_id', userId).order('naam'),
  ])
  const fout = z.error ?? t.error ?? m.error
  if (fout) {
    console.error('[club-rooster] stamdata lezen mislukt', fout.message)
    return null
  }
  return {
    zalen: rijenNaar(z.data, zaalUitRij),
    lestypen: rijenNaar(t.data, lestypeUitRij),
    medewerkers: rijenNaar(m.data, medewerkerUitRij),
  }
}

export interface VestigingInstellingen {
  regels: RoosterRegels
  openingstijden: Openingstijden
}

/** Regels en openingstijden van een vestiging; ontbreekt de rij, dan de standaard. */
export async function haalRegels(admin: SupabaseClient, userId: string, vestiging: Vestiging): Promise<VestigingInstellingen> {
  const { data, error } = await admin
    .from('club_vestigingen')
    .select('regels, openingstijden')
    .eq('user_id', userId)
    .eq('vestiging', vestiging)
    .maybeSingle()
  if (error) console.error('[club-rooster] regels lezen mislukt', error.message)
  const rij: Record<string, unknown> = typeof data === 'object' && data !== null ? data : {}
  return { regels: regelsUitJson(rij.regels), openingstijden: openingstijdenUitJson(rij.openingstijden) }
}

/** Eén les op id (van deze gebruiker), of null. */
export async function haalLesRij(admin: SupabaseClient, userId: string, lesId: string): Promise<LesRij | null> {
  const { data, error } = await admin.from('club_lessen').select(LES_KOLOMMEN).eq('user_id', userId).eq('id', lesId).maybeSingle()
  if (error) console.error('[club-rooster] les lezen mislukt', error.message)
  return lesUitRij(data)
}

/** Alle reserveringen van een les. */
export async function haalReserveringenVanLes(admin: SupabaseClient, userId: string, lesId: string): Promise<ReserveringRij[] | null> {
  const vraag = (kolommen: string) =>
    admin.from('club_reserveringen').select(kolommen).eq('user_id', userId).eq('les_id', lesId).order('geboekt_op').order('id')
  // te_laat komt uit migratie 384; zolang die er niet is, lezen we zonder.
  let { data, error } = await vraag(`${RESERVERING_KOLOMMEN}, te_laat`)
  if (error) ({ data, error } = await vraag(RESERVERING_KOLOMMEN))
  if (error) {
    console.error('[club-rooster] reserveringen lezen mislukt', error.message)
    return null
  }
  return rijenNaar(data, reserveringUitRij)
}

/** Status per reservering voor veel lessen tegelijk, in brokken en pagina's (PostgREST geeft max 1000 rijen). */
async function haalStatussen(admin: SupabaseClient, userId: string, lesIds: readonly string[]): Promise<Array<{ lesId: string; status: ReserveringStatus }> | null> {
  const uit: Array<{ lesId: string; status: ReserveringStatus }> = []
  for (let i = 0; i < lesIds.length; i += BROK) {
    const brok = lesIds.slice(i, i + BROK)
    for (let van = 0; ; van += PAGINA) {
      const { data, error } = await admin
        .from('club_reserveringen')
        .select('id, les_id, status')
        .eq('user_id', userId)
        .in('les_id', brok)
        .order('id')
        .range(van, van + PAGINA - 1)
      if (error) {
        console.error('[club-rooster] tellingen lezen mislukt', error.message)
        return null
      }
      for (const r of data ?? []) {
        if (typeof r.les_id === 'string' && isReserveringStatus(r.status)) uit.push({ lesId: r.les_id, status: r.status })
      }
      if (!data || data.length < PAGINA) break
    }
  }
  return uit
}

/** Lessen plus namen en tellingen, voor het rooster en GET /lessen. */
export function maakOverzicht(lessen: readonly LesRij[], stam: Stamdata, tellingen: Map<string, ReturnType<typeof legeTelling>>): LesOverzicht[] {
  const zalen = new Map(stam.zalen.map((z) => [z.id, z]))
  const typen = new Map(stam.lestypen.map((t) => [t.id, t]))
  const mensen = new Map(stam.medewerkers.map((m) => [m.id, m]))
  return lessen.map((l) => {
    const zaal = l.zaalId ? zalen.get(l.zaalId) : undefined
    const type = typen.get(l.lestypeId)
    const mens = l.instructeurId ? mensen.get(l.instructeurId) : undefined
    return {
      id: l.id,
      vestiging: l.vestiging,
      serieId: l.serieId,
      startOp: l.startOp,
      eindOp: l.eindOp,
      capaciteit: l.capaciteit,
      geannuleerd: l.geannuleerd,
      annuleerReden: l.annuleerReden,
      lestype: type ? { id: type.id, naam: type.naam, soort: type.soort } : null,
      zaal: zaal ? { id: zaal.id, naam: zaal.naam } : null,
      instructeur: mens ? { id: mens.id, naam: mens.naam } : null,
      ...(tellingen.get(l.id) ?? legeTelling()),
    }
  })
}

/** Alle lessen van een vestiging in een tijdvak, met lestype, zaal, instructeur en tellingen. */
export async function haalLessen(
  admin: SupabaseClient,
  userId: string,
  vestiging: Vestiging,
  van: Date,
  tot: Date,
  stamdata?: Stamdata,
): Promise<LesOverzicht[] | null> {
  const { data, error } = await admin
    .from('club_lessen')
    .select(LES_KOLOMMEN)
    .eq('user_id', userId)
    .eq('vestiging', vestiging)
    .gte('start_op', van.toISOString())
    .lt('start_op', tot.toISOString())
    .order('start_op')
    .limit(2000)
  if (error) {
    console.error('[club-rooster] lessen lezen mislukt', error.message)
    return null
  }
  const lessen = rijenNaar(data, lesUitRij)
  const [stam, statussen] = await Promise.all([
    stamdata ? Promise.resolve(stamdata) : haalStamdata(admin, userId, vestiging),
    haalStatussen(admin, userId, lessen.map((l) => l.id)),
  ])
  if (!stam || !statussen) return null
  return maakOverzicht(lessen, stam, telPerLes(statussen))
}
