// ─── Fit Factory Club, rooster: boeken, annuleren, afvinken (SERVER) ────────
// De regels zelf staan in regels.ts (puur); hier alleen de feiten ophalen,
// beoordelen en wegschrijven. Bij elke vrijgekomen plek schuift de wachtlijst
// automatisch door.

import type { SupabaseClient } from '@supabase/supabase-js'
import { haalLid, volledigeNaam } from '@/lib/club/kern/lid'
import { logActie, type ClubSchrijver, type ClubToegang } from '@/lib/club/toegang'
import { toetsBoeking } from '@/lib/club/lidmaatschappen/toegang-opslag'
import { gelukt, haalLesRij, haalRegels, haalReserveringenVanLes, mislukt, type Resultaat } from './basis-opslag'
import type { ReserveerInvoer } from './invoer'
import {
  BEZETTE_STATUSSEN,
  NO_SHOW_VENSTER_DAGEN,
  beoordeelAfvinken,
  beoordeelAnnulering,
  beoordeelReservering,
  gewijzigdePosities,
  planDoorschuiven,
  type AfvinkStatus,
} from './regels'
import { nlDelen } from './tijd'
import { laatHerinneringenVervallen, planLesMeldingen } from '@/lib/club/meldingen/opslag'
import { RESERVERING_KOLOMMEN, reserveringUitRij, type LesRij, type ReserveringRij } from './typen'

const DAG_MS = 86_400_000

/** Een reservering bijwerken. Kent de database de kolommen uit 384 nog niet, dan zonder die kolommen. */
async function werkReserveringBij(admin: SupabaseClient, userId: string, id: string, velden: Record<string, unknown>): Promise<boolean> {
  const metTijd = { ...velden, gewijzigd_op: new Date().toISOString() }
  const eerste = await admin.from('club_reserveringen').update(metTijd).eq('user_id', userId).eq('id', id)
  if (!eerste.error) return true
  const nieuweKolom = 'te_laat' in velden || 'geannuleerd_op' in velden
  if (nieuweKolom && /te_laat|geannuleerd_op|PGRST204|42703/.test(`${eerste.error.code} ${eerste.error.message}`)) {
    const zonder = Object.fromEntries(Object.entries(metTijd).filter(([k]) => k !== 'te_laat' && k !== 'geannuleerd_op'))
    const tweede = await admin.from('club_reserveringen').update(zonder).eq('user_id', userId).eq('id', id)
    if (!tweede.error) return true
    console.error('[club-rooster] reservering bijwerken mislukt', tweede.error.message)
    return false
  }
  console.error('[club-rooster] reservering bijwerken mislukt', eerste.error.message)
  return false
}

/** Open boekingen van een lid voor andere lessen die nog niet begonnen zijn. */
async function telOpenElders(admin: SupabaseClient, userId: string, lidId: string, lesId: string, nu: Date): Promise<number | null> {
  const { data, error } = await admin
    .from('club_reserveringen')
    .select('les_id')
    .eq('user_id', userId)
    .eq('lid_id', lidId)
    .in('status', ['geboekt', 'wachtlijst'])
    .neq('les_id', lesId)
    .limit(500)
  if (error) return null
  const ids = (data ?? []).map((r) => r.les_id).filter((x): x is string => typeof x === 'string')
  if (ids.length === 0) return 0
  const { count, error: f2 } = await admin
    .from('club_lessen')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('id', ids)
    .gt('start_op', nu.toISOString())
  return f2 ? null : (count ?? 0)
}

/** Starttijden van lessen waar het lid niet kwam, binnen het venster dat voor een blokkade telt. */
async function haalNoShows(admin: SupabaseClient, userId: string, lidId: string, nu: Date, blokkadeDagen: number): Promise<Date[] | null> {
  const grens = new Date(nu.getTime() - (NO_SHOW_VENSTER_DAGEN + blokkadeDagen) * DAG_MS)
  const { data, error } = await admin.from('club_reserveringen').select('les_id').eq('user_id', userId).eq('lid_id', lidId).eq('status', 'no_show').limit(200)
  if (error) return null
  const ids = (data ?? []).map((r) => r.les_id).filter((x): x is string => typeof x === 'string')
  if (ids.length === 0) return []
  const { data: lessen, error: f2 } = await admin.from('club_lessen').select('start_op').eq('user_id', userId).in('id', ids).gte('start_op', grens.toISOString())
  if (f2) return null
  return (lessen ?? []).map((l) => new Date(String(l.start_op))).filter((d) => !Number.isNaN(d.getTime()))
}

/**
 * Vrije plekken opvullen vanaf de wachtlijst en de rest hernummeren.
 * Alleen voor lessen die nog niet begonnen zijn en doorgaan. Geeft de lid-ids
 * die zijn doorgeschoven, in volgorde.
 */
export async function schuifWachtlijstDoor(admin: SupabaseClient, userId: string, les: LesRij, nu: Date): Promise<string[]> {
  const rijen = await haalReserveringenVanLes(admin, userId, les.id)
  if (!rijen) return []
  const bezet = rijen.filter((r) => BEZETTE_STATUSSEN.includes(r.status)).length
  const wachtlijst = rijen.filter((r) => r.status === 'wachtlijst')
  const magDoor = !les.geannuleerd && Date.parse(les.startOp) > nu.getTime()
  const plan = planDoorschuiven(wachtlijst, magDoor ? les.capaciteit - bezet : 0)
  const doorgeschoven: Array<{ id: string; lidId: string | null; geboektOp: string }> = []
  for (const r of plan.naarGeboekt) {
    if (await werkReserveringBij(admin, userId, r.id, { status: 'geboekt', wachtpositie: null })) doorgeschoven.push(r)
  }
  for (const r of gewijzigdePosities(wachtlijst, plan)) {
    await werkReserveringBij(admin, userId, r.id, { wachtpositie: r.wachtpositie })
  }
  // Meldingen (best effort): wie doorschoof, krijgt bericht en een herinnering.
  // Een reservering zonder lid (verwijderd na AVG) krijgt geen melding.
  const metLid = doorgeschoven.flatMap((r) => (r.lidId ? [{ ...r, lidId: r.lidId }] : []))
  await planLesMeldingen(admin, userId, les, metLid.map((r) => ({ lidId: r.lidId, reserveringId: r.id, geboektOp: r.geboektOp, soort: 'les_doorgeschoven' as const })), nu)
  return metLid.map((r) => r.lidId)
}

/** Na een boeking: is de les toch overboekt (twee boekingen tegelijk), dan gaat de laatste naar de wachtlijst. */
async function controleerOverboeking(admin: SupabaseClient, userId: string, les: LesRij, reserveringId: string): Promise<number | null> {
  const rijen = await haalReserveringenVanLes(admin, userId, les.id)
  if (!rijen) return null
  const bezet = rijen.filter((r) => BEZETTE_STATUSSEN.includes(r.status))
  const plek = bezet.findIndex((r) => r.id === reserveringId)
  if (plek === -1 || plek < les.capaciteit) return null
  const laatste = rijen.reduce((m, r) => Math.max(m, r.status === 'wachtlijst' ? (r.wachtpositie ?? 0) : 0), 0)
  await werkReserveringBij(admin, userId, reserveringId, { status: 'wachtlijst', wachtpositie: laatste + 1 })
  return laatste + 1
}

export type ReserveerAntwoord =
  | { id: string; status: 'geboekt' | 'wachtlijst'; wachtpositie: number | null }
  /** Balie: past niet bij het lidmaatschap. Niets geboekt; opnieuw met toch = true boekt wel. */
  | { status: 'waarschuwing'; waarschuwing: string }

/** Boek een lid in een les (of zet het op de wachtlijst). */
export async function reserveer(t: ClubSchrijver, invoer: ReserveerInvoer, nu = new Date()): Promise<Resultaat<ReserveerAntwoord>> {
  const [les, lid] = await Promise.all([haalLesRij(t.admin, t.userId, invoer.lesId), haalLid(t.admin, t.userId, invoer.lidId)])
  if (!les) return mislukt('Deze les bestaat niet.', 404)
  if (!lid) return mislukt('Dit lid bestaat niet.', 404)
  const { regels } = await haalRegels(t.admin, t.userId, les.vestiging)
  const [rijen, openElders, noShows] = await Promise.all([
    haalReserveringenVanLes(t.admin, t.userId, les.id),
    telOpenElders(t.admin, t.userId, lid.id, les.id, nu),
    haalNoShows(t.admin, t.userId, lid.id, nu, regels.noShowBlokkadeDagen),
  ])
  if (!rijen || openElders === null || !noShows) return mislukt('De gegevens konden niet worden gelezen. Probeer het opnieuw.', 500)
  const bestaand = rijen.find((r) => r.lidId === lid.id) ?? null
  const uitkomst = beoordeelReservering({
    nu,
    regels,
    les: { start: new Date(les.startOp), geannuleerd: les.geannuleerd, capaciteit: les.capaciteit },
    lidStatus: lid.status,
    bestaand: bestaand?.status ?? null,
    openElders,
    bezet: rijen.filter((r) => BEZETTE_STATUSSEN.includes(r.status)).length,
    laatsteWachtpositie: rijen.reduce((m, r) => Math.max(m, r.status === 'wachtlijst' ? (r.wachtpositie ?? 0) : 0), 0),
    noShows,
  })
  if (!uitkomst.ok) return mislukt(uitkomst.fout, 409)
  const vorm = await toetsBoeking(t.admin, t.userId, { lidId: lid.id, abonnement: lid.abonnement, les, bron: invoer.bron, toch: invoer.toch })
  if (vorm.soort === 'weiger') return mislukt(vorm.melding, 409)
  if (vorm.soort === 'waarschuw') return gelukt({ status: 'waarschuwing', waarschuwing: vorm.reden })
  const velden = { status: uitkomst.status, wachtpositie: uitkomst.wachtpositie, bron: invoer.bron, geboekt_op: nu.toISOString() }
  const id = await schrijfBoeking(t.admin, t.userId, les, lid.id, bestaand, velden)
  if (!id) return mislukt('Boeken is niet gelukt. Probeer het opnieuw.', 500)
  let status = uitkomst.status
  let wachtpositie = uitkomst.wachtpositie
  if (status === 'geboekt') {
    const nieuwePositie = await controleerOverboeking(t.admin, t.userId, les, id)
    if (nieuwePositie !== null) {
      status = 'wachtlijst'
      wachtpositie = nieuwePositie
    }
  }
  const moment = nlDelen(new Date(les.startOp))
  await logActie(t, status === 'geboekt' ? 'Les geboekt' : 'Op wachtlijst gezet', `${volledigeNaam(lid)}, les ${moment.datum} ${moment.tijd}`, les.vestiging)
  if (vorm.ondanks) await logActie(t, 'Geboekt ondanks lidmaatschap', `${volledigeNaam(lid)}, les ${moment.datum} ${moment.tijd}: ${vorm.ondanks}`, les.vestiging)
  // Meldingen (best effort, breekt de boeking nooit): bevestiging en herinnering.
  await planLesMeldingen(t.admin, t.userId, les, [{ lidId: lid.id, reserveringId: id, geboektOp: nu.toISOString(), soort: status === 'geboekt' ? 'les_geboekt' : 'les_wachtlijst', wachtpositie }], nu)
  return gelukt({ id, status, wachtpositie })
}

async function schrijfBoeking(
  admin: SupabaseClient,
  userId: string,
  les: LesRij,
  lidId: string,
  bestaand: ReserveringRij | null,
  velden: Record<string, unknown>,
): Promise<string | null> {
  if (bestaand) {
    const ok = await werkReserveringBij(admin, userId, bestaand.id, { ...velden, te_laat: false, geannuleerd_op: null })
    return ok ? bestaand.id : null
  }
  const { data, error } = await admin
    .from('club_reserveringen')
    .insert({ ...velden, user_id: userId, les_id: les.id, lid_id: lidId })
    .select('id')
    .single()
  if (error || typeof data?.id !== 'string') {
    console.error('[club-rooster] boeking opslaan mislukt', error?.message)
    return null
  }
  return data.id
}

/** Een reservering op id (van deze gebruiker). */
export async function haalReservering(admin: SupabaseClient, userId: string, id: string): Promise<ReserveringRij | null> {
  const { data, error } = await admin.from('club_reserveringen').select(RESERVERING_KOLOMMEN).eq('user_id', userId).eq('id', id).maybeSingle()
  if (error) console.error('[club-rooster] reservering lezen mislukt', error.message)
  return reserveringUitRij(data)
}

export interface AnnuleerAntwoord {
  status: 'geannuleerd'
  teLaat: boolean
  /** Het lid-id van wie van de wachtlijst doorschoof naar geboekt, of null. */
  doorgeschoven: string | null
}

/** Annuleer een reservering; een vrijgekomen plek gaat naar de eerste op de wachtlijst. */
export async function annuleerReservering(t: ClubSchrijver, id: string, nu = new Date()): Promise<Resultaat<AnnuleerAntwoord>> {
  const res = await haalReservering(t.admin, t.userId, id)
  if (!res) return mislukt('Deze reservering bestaat niet.', 404)
  const les = await haalLesRij(t.admin, t.userId, res.lesId)
  if (!les) return mislukt('De les van deze reservering bestaat niet meer.', 404)
  const { regels } = await haalRegels(t.admin, t.userId, les.vestiging)
  const oordeel = beoordeelAnnulering(res.status, new Date(les.startOp), nu, regels)
  if (!oordeel.ok) return mislukt(oordeel.fout, 409)
  const ok = await werkReserveringBij(t.admin, t.userId, res.id, {
    status: 'geannuleerd',
    wachtpositie: null,
    te_laat: oordeel.teLaat,
    geannuleerd_op: nu.toISOString(),
  })
  if (!ok) return mislukt('Annuleren is niet gelukt. Probeer het opnieuw.', 500)
  // Meldingen (best effort): de herinnering vervalt, het lid krijgt een bevestiging.
  await laatHerinneringenVervallen(t.admin, t.userId, [res.id])
  if (res.lidId) await planLesMeldingen(t.admin, t.userId, les, [{ lidId: res.lidId, reserveringId: res.id, geboektOp: res.geboektOp, soort: 'les_afgemeld' }], nu)
  const doorgeschoven = await schuifWachtlijstDoor(t.admin, t.userId, les, nu)
  const lid = res.lidId ? await haalLid(t.admin, t.userId, res.lidId) : null
  const moment = nlDelen(new Date(les.startOp))
  const wie = lid ? volledigeNaam(lid) : 'Lid'
  await logActie(t, oordeel.teLaat ? 'Reservering te laat geannuleerd' : 'Reservering geannuleerd', `${wie}, les ${moment.datum} ${moment.tijd}`, les.vestiging)
  return gelukt({ status: 'geannuleerd', teLaat: oordeel.teLaat, doorgeschoven: doorgeschoven[0] ?? null })
}

/** Vink een deelnemer af: aanwezig, no-show, of terug naar geboekt. */
export async function zetAfvinkStatus(t: ClubToegang, id: string, status: AfvinkStatus, nu = new Date()): Promise<Resultaat<{ id: string; status: AfvinkStatus }>> {
  const res = await haalReservering(t.admin, t.userId, id)
  if (!res) return mislukt('Deze reservering bestaat niet.', 404)
  const les = await haalLesRij(t.admin, t.userId, res.lesId)
  if (!les) return mislukt('De les van deze reservering bestaat niet meer.', 404)
  if (les.geannuleerd) return mislukt('Deze les gaat niet door.', 409)
  const { regels } = await haalRegels(t.admin, t.userId, les.vestiging)
  const reden = beoordeelAfvinken(res.status, status, new Date(les.startOp), nu, regels)
  if (reden) return mislukt(reden, 409)
  if (res.status !== status && !(await werkReserveringBij(t.admin, t.userId, res.id, { status }))) {
    return mislukt('Opslaan is niet gelukt. Probeer het opnieuw.', 500)
  }
  return gelukt({ id: res.id, status })
}
