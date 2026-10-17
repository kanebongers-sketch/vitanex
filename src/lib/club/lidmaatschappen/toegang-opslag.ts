// ─── Club, lidmaatschappen: feiten voor check-in en reserveren (SERVER-ONLY) ─
// De vorm van een lid en het aantal lessen in een week. Alles op user_id van
// de sportschool. Bij een leesfout: loggen en geen beperking (de balie mag
// nooit vastlopen op een storing; Sportivity blijft de bron voor het abonnement).

import type { SupabaseClient } from '@supabase/supabase-js'
import { haalVormen } from './lezen'
import { TELT_VOOR_MAXIMUM, besluitBoeking, lesAanvraag, telLessenInWeek, weekVanLes, type BoekBesluit, type BoekBron, type WeekBoeking } from './koppeling'
import { magLesBoeken, vormVoorLid } from './regels'
import type { Lidmaatschapsvorm } from './model'

/** De vorm bij het abonnement van een lid, of null (geen abonnement, geen passende vorm of een leesfout). */
export async function haalVormVanLid(admin: SupabaseClient, userId: string, abonnement: string | null): Promise<Lidmaatschapsvorm | null> {
  if (!abonnement?.trim()) return null
  const vormen = await haalVormen(admin, userId)
  return vormen ? vormVoorLid(vormen, abonnement) : null
}

function naarWeekBoeking(rij: unknown): WeekBoeking | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  const les = Array.isArray(r.club_lessen) ? r.club_lessen[0] : r.club_lessen
  const start = typeof les === 'object' && les !== null ? (les as Record<string, unknown>).start_op : null
  if (typeof r.les_id !== 'string' || typeof r.status !== 'string' || typeof start !== 'string') return null
  const datum = new Date(start)
  return Number.isNaN(datum.getTime()) ? null : { lesId: r.les_id, status: r.status, start: datum }
}

/** Lessen van dit lid in de week van deze les (deze les niet meegeteld). Null bij een leesfout. */
export async function telLessenVanLid(admin: SupabaseClient, userId: string, lidId: string, lesId: string, lesStart: Date): Promise<number | null> {
  const { van, tot } = weekVanLes(lesStart)
  const { data, error } = await admin
    .from('club_reserveringen')
    .select('les_id, status, club_lessen!inner(start_op)')
    .eq('user_id', userId)
    .eq('lid_id', lidId)
    .in('status', [...TELT_VOOR_MAXIMUM])
    .gte('club_lessen.start_op', van.toISOString())
    .lt('club_lessen.start_op', tot.toISOString())
    .limit(200)
  if (error) {
    console.error('[club] lessen per week tellen mislukt', error.message)
    return null
  }
  const boekingen = (data ?? []).map(naarWeekBoeking).filter((b): b is WeekBoeking => b !== null)
  return telLessenInWeek(boekingen, lesId, lesStart)
}

export interface BoekToets {
  lidId: string
  abonnement: string | null
  les: { id: string; vestiging: string; startOp: string; eindOp: string }
  bron: BoekBron
  toch: boolean
}

/** Past deze boeking bij de vorm van het lid? Zonder vorm altijd door. */
export async function toetsBoeking(admin: SupabaseClient, userId: string, b: BoekToets): Promise<BoekBesluit> {
  const vorm = await haalVormVanLid(admin, userId, b.abonnement)
  if (!vorm) return { soort: 'door', ondanks: null }
  const start = new Date(b.les.startOp)
  const lessen = vorm.groepslessen && vorm.maxLessenPerWeek !== null ? await telLessenVanLid(admin, userId, b.lidId, b.les.id, start) : 0
  const aanvraag = lesAanvraag({ vestiging: b.les.vestiging, start, eind: new Date(b.les.eindOp) }, lessen ?? 0)
  return besluitBoeking(magLesBoeken(vorm, aanvraag), b.bron, b.toch)
}
