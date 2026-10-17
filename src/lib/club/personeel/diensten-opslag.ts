// ─── Fit Factory Club, personeel: diensten plannen en wijzigen (SERVER) ─────
// Plannen, wijzigen, verwijderen, ziek melden en ruilen. Een verwerkte dienst
// (uren al naar de salarisadministratie) is op slot.

import { logActie, type ClubToegang } from '@/lib/club/toegang'
import { isVestigingSlug } from '@/lib/club/kern/vestigingen'
import { controleerKoppeling, dbFout, gelukt, mislukt, type Resultaat } from './api'
import { haalDienst } from './opslag'
import type { DienstInvoer } from './invoer'
import type { Dienst } from './typen'

type DienstMetVestiging = Dienst & { vestiging: string }

function onderwerp(d: Pick<Dienst, 'datum' | 'begin' | 'eind'>): string {
  return `${d.datum} ${d.begin} tot ${d.eind}`
}

async function bestaande(t: ClubToegang, id: string): Promise<Resultaat<DienstMetVestiging>> {
  const d = await haalDienst(t.admin, t.userId, id)
  if (!d) return mislukt('Deze dienst bestaat niet (meer).', 404)
  if (d.uurStatus === 'verwerkt') return mislukt('De uren van deze dienst zijn al verwerkt. Wijzigen kan niet meer.', 409)
  return gelukt(d)
}

function velden(i: DienstInvoer): Record<string, unknown> {
  return {
    datum: i.datum,
    begin: i.begin,
    eind: i.eind,
    medewerker_id: i.medewerkerId,
    soort_id: i.soortId,
    notitie: i.notitie,
    uursoort: i.uursoort,
  }
}

export async function maakDienst(t: ClubToegang, i: DienstInvoer): Promise<Resultaat<{ id: string }>> {
  const koppeling = await controleerKoppeling(t, i.vestiging, i.medewerkerId, i.soortId)
  if (koppeling) return mislukt(koppeling)
  const { data, error } = await t.admin
    .from('club_diensten')
    .insert({ user_id: t.userId, vestiging: i.vestiging, ...velden(i) })
    .select('id')
    .single()
  if (error || !data) return dbFout('Plannen', error ?? { message: 'geen rij' })
  await logActie(t, i.medewerkerId ? 'dienst gepland' : 'open dienst gepland', onderwerp(i), i.vestiging)
  return gelukt({ id: String(data.id) })
}

export async function wijzigDienst(t: ClubToegang, id: string, i: DienstInvoer): Promise<Resultaat<{ id: string }>> {
  const oud = await bestaande(t, id)
  if (!oud.ok) return oud
  if (oud.waarde.vestiging !== i.vestiging) return mislukt('Een dienst verhuist niet naar een andere vestiging.')
  const koppeling = await controleerKoppeling(t, i.vestiging, i.medewerkerId, i.soortId)
  if (koppeling) return mislukt(koppeling)
  const status = oud.waarde.status === 'ziek' && i.uursoort === 'werk' ? 'gepland' : oud.waarde.status
  const { error } = await t.admin
    .from('club_diensten')
    .update({ ...velden(i), status, bijgewerkt_op: new Date().toISOString() })
    .eq('user_id', t.userId)
    .eq('id', id)
  if (error) return dbFout('Opslaan', error)
  await logActie(t, 'dienst gewijzigd', onderwerp(i), i.vestiging)
  return gelukt({ id })
}

export async function verwijderDienst(t: ClubToegang, id: string): Promise<Resultaat<{ id: string }>> {
  const oud = await bestaande(t, id)
  if (!oud.ok) return oud
  if (oud.waarde.uurStatus !== 'gepland') return mislukt('Er zijn al uren geregistreerd op deze dienst. Zet de uren eerst terug.', 409)
  const { error } = await t.admin.from('club_diensten').delete().eq('user_id', t.userId).eq('id', id)
  if (error) return dbFout('Verwijderen', error)
  await logActie(t, 'dienst verwijderd', onderwerp(oud.waarde), oud.waarde.vestiging)
  return gelukt({ id })
}

/**
 * Ziek melden: de dienst blijft bij de zieke staan als uursoort "ziek" en er
 * komt een open dienst met dezelfde tijden bij, die iemand anders kan pakken.
 * De zieke is die dag ook niet meer beschikbaar.
 */
export async function meldZiek(t: ClubToegang, id: string): Promise<Resultaat<{ openId: string }>> {
  const oud = await bestaande(t, id)
  if (!oud.ok) return oud
  const d = oud.waarde
  if (!d.medewerkerId || d.uursoort !== 'werk') return mislukt('Alleen een ingeplande werkdienst kan ziek gemeld worden.')
  if (!isVestigingSlug(d.vestiging)) return mislukt('Onbekende vestiging.', 500)
  const nu = new Date().toISOString()
  const { error } = await t.admin
    .from('club_diensten')
    .update({ status: 'ziek', uursoort: 'ziek', bijgewerkt_op: nu })
    .eq('user_id', t.userId)
    .eq('id', id)
  if (error) return dbFout('Ziek melden', error)
  const { data, error: fout } = await t.admin
    .from('club_diensten')
    .insert({ user_id: t.userId, vestiging: d.vestiging, datum: d.datum, begin: d.begin, eind: d.eind, medewerker_id: null, soort_id: d.soortId, notitie: d.notitie, vervangt_id: id })
    .select('id')
    .single()
  if (fout || !data) return dbFout('Open dienst maken', fout ?? { message: 'geen rij' })
  const { error: beschikFout } = await t.admin
    .from('club_beschikbaarheid')
    .insert({ user_id: t.userId, medewerker_id: d.medewerkerId, datum: d.datum, beschikbaar: false, reden: 'ziek' })
  if (beschikFout) console.error('[club-personeel] ziek in beschikbaarheid zetten mislukt', beschikFout.message)
  await logActie(t, 'ziek gemeld', onderwerp(d), d.vestiging)
  return gelukt({ openId: String(data.id) })
}

/** Twee diensten van persoon wisselen (beide nog zonder geregistreerde uren). */
export async function ruilDiensten(t: ClubToegang, a: string, b: string): Promise<Resultaat<{ a: string; b: string }>> {
  const [da, db] = await Promise.all([bestaande(t, a), bestaande(t, b)])
  if (!da.ok) return da
  if (!db.ok) return db
  if (da.waarde.vestiging !== db.waarde.vestiging) return mislukt('Ruilen kan alleen binnen dezelfde vestiging.')
  if (da.waarde.uurStatus !== 'gepland' || db.waarde.uurStatus !== 'gepland') return mislukt('Op een van de diensten zijn al uren geregistreerd.', 409)
  if (da.waarde.medewerkerId === db.waarde.medewerkerId) return mislukt('Beide diensten zijn van dezelfde persoon.')
  const nu = new Date().toISOString()
  const zet = (id: string, mw: string | null) =>
    t.admin.from('club_diensten').update({ medewerker_id: mw, status: 'geruild', bijgewerkt_op: nu }).eq('user_id', t.userId).eq('id', id)
  const [ra, rb] = await Promise.all([zet(a, db.waarde.medewerkerId), zet(b, da.waarde.medewerkerId)])
  const fout = ra.error ?? rb.error
  if (fout) return dbFout('Ruilen', fout)
  await logActie(t, 'diensten geruild', `${onderwerp(da.waarde)} met ${onderwerp(db.waarde)}`, da.waarde.vestiging)
  return gelukt({ a, b })
}
