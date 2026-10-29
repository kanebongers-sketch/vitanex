// ─── Fit Factory Club: de ledenkaart lezen (SERVER-ONLY) ────────────────────
// Alles wat de kaart van een lid nodig heeft. Bezoeken en no-shows tellen over
// alle vestigingen (een lid dat in Bergeijk traint, is niet weg), precies als
// in de ledenlijst: beide rekenen via behoudVoorLid.

import type { SupabaseClient } from '@supabase/supabase-js'
import { haalLid, type Lid } from '@/lib/club/kern/lid'
import { haalMedewerkers, type Medewerker } from '@/lib/club/kern/medewerker'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { behoudVoorLid, NO_SHOW_DAGEN, VENSTER_DAGEN, type Behoud } from './behoud'
import { checkinUitRij, notitieUitRij, RESERVERING_SELECT, reserveringUitRij, sorteerNotities, type CheckinRij, type LidReservering, type Notitie } from './rijen'

const MS_DAG = 86_400_000
/** Even ver terug als de no-shows in de score (8 weken), zodat de telling klopt. */
const RESERVERING_TERUG_DAGEN = NO_SHOW_DAGEN
const RESERVERING_VOORUIT_DAGEN = 21

export interface LidKaart {
  lid: Lid
  bezoeken: CheckinRij[]
  /** Ook ouder dan 12 weken, voor "laatste bezoek". */
  laatsteBezoek: Date | null
  behoud: Behoud | null
  noShows: number
  aankomend: LidReservering[]
  recent: LidReservering[]
  notities: Notitie[]
  /** Alle actieve medewerkers van de vestiging van het lid. */
  medewerkers: Medewerker[]
  /** Delen die niet te lezen waren; de kaart toont dan een melding. */
  fouten: string[]
}

async function haalBezoekenLid(admin: SupabaseClient, userId: string, lidId: string, sinds: Date): Promise<CheckinRij[] | null> {
  const { data, error } = await admin.from('club_checkins').select('id, lid_id, op, bron, vestiging')
    .eq('user_id', userId).eq('lid_id', lidId).gte('op', sinds.toISOString()).order('op', { ascending: false }).limit(500)
  if (error) {
    console.error('[club] bezoeken lid lezen mislukt', error.message)
    return null
  }
  return (data ?? []).map(checkinUitRij).filter((c): c is CheckinRij => c !== null)
}

async function haalLaatsteBezoek(admin: SupabaseClient, userId: string, lidId: string): Promise<Date | null> {
  const { data, error } = await admin.from('club_checkins').select('id, lid_id, op')
    .eq('user_id', userId).eq('lid_id', lidId).order('op', { ascending: false }).limit(1).maybeSingle()
  if (error) console.error('[club] laatste bezoek lezen mislukt', error.message)
  return checkinUitRij(data)?.op ?? null
}

async function haalReserveringenLid(admin: SupabaseClient, userId: string, lidId: string, nu: Date): Promise<LidReservering[] | null> {
  const { data, error } = await admin.from('club_reserveringen').select(RESERVERING_SELECT)
    .eq('user_id', userId).eq('lid_id', lidId)
    .gte('club_lessen.start_op', new Date(nu.getTime() - RESERVERING_TERUG_DAGEN * MS_DAG).toISOString())
    .lte('club_lessen.start_op', new Date(nu.getTime() + RESERVERING_VOORUIT_DAGEN * MS_DAG).toISOString())
    .limit(300)
  if (error) {
    console.error('[club] reserveringen lid lezen mislukt', error.message)
    return null
  }
  return (data ?? []).map(reserveringUitRij).filter((r): r is LidReservering => r !== null)
}

async function haalNotities(admin: SupabaseClient, userId: string, lidId: string): Promise<Notitie[] | null> {
  const { data, error } = await admin.from('club_notities').select('id, tekst, auteur, vastgepind, aangemaakt_op')
    .eq('user_id', userId).eq('lid_id', lidId).order('aangemaakt_op', { ascending: false }).limit(200)
  if (error) {
    console.error('[club] notities lezen mislukt', error.message)
    return null
  }
  return sorteerNotities((data ?? []).map(notitieUitRij).filter((n): n is Notitie => n !== null))
}

function telNoShows(reserveringen: readonly LidReservering[], nu: Date): number {
  const grens = nu.getTime() - NO_SHOW_DAGEN * MS_DAG
  return reserveringen.filter((r) => r.status === 'no_show' && r.start.getTime() >= grens && r.start <= nu).length
}

/** De ledenkaart, of null als het lid niet bestaat. */
export async function haalLidKaart(admin: SupabaseClient, userId: string, id: string, nu: Date, taal: Taal = 'nl'): Promise<LidKaart | null> {
  const lid = await haalLid(admin, userId, id)
  if (!lid) return null
  const [bezoeken, laatsteBezoek, reserveringen, notities, medewerkers] = await Promise.all([
    haalBezoekenLid(admin, userId, id, new Date(nu.getTime() - (VENSTER_DAGEN + 1) * MS_DAG)),
    haalLaatsteBezoek(admin, userId, id),
    haalReserveringenLid(admin, userId, id, nu),
    haalNotities(admin, userId, id),
    haalMedewerkers(admin, userId, lid.vestiging),
  ])
  const fouten = [
    bezoeken ? null : 'bezoeken',
    reserveringen ? null : 'reserveringen',
    notities ? null : 'notities',
    medewerkers ? null : 'medewerkers',
  ].filter((f): f is string => f !== null)
  const res = reserveringen ?? []
  const noShows = telNoShows(res, nu)
  const behoud = bezoeken ? behoudVoorLid(lid, bezoeken.map((b) => b.op), noShows, nu, taal) : null
  return {
    lid,
    bezoeken: bezoeken ?? [],
    laatsteBezoek,
    behoud,
    noShows,
    aankomend: res.filter((r) => r.eind > nu).sort((a, b) => a.start.getTime() - b.start.getTime()).slice(0, 6),
    recent: res.filter((r) => r.eind <= nu).sort((a, b) => b.start.getTime() - a.start.getTime()).slice(0, 8),
    notities: notities ?? [],
    medewerkers: medewerkers ?? [],
    fouten,
  }
}
