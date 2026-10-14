// ─── Fit Factory Club, taken: afvinken, notities en afsluitronde (SERVER) ───
// Elke schrijfactie controleert eerst dat de taak, lijst of medewerker van
// deze gebruiker is. Vinkjes zijn uniek per taak per dag: twee mensen die
// tegelijk tikken krijgen allebei hetzelfde vinkje terug.

import type { ClubToegang } from '@/lib/club/toegang'
import { isVestiging, type Vestiging } from '@/lib/club/kern/vestiging'
import type { AfsluitInvoer, AfvinkInvoer, NotitieInvoer, Persoon } from './invoer'
import { gelukt, mislukt, type Resultaat } from './opslag'
import {
  AFSLUIT_KOLOMMEN,
  AFVINK_KOLOMMEN,
  NOTITIE_KOLOMMEN,
  afsluitrondeUitRij,
  afvinkingUitRij,
  notitieUitRij,
  type Afsluitronde,
  type Afvinking,
  type DagNotitie,
} from './typen'

const NIET_GELUKT = 'Opslaan is niet gelukt. Probeer het opnieuw.'

function logFout(wat: string, fout: { message: string }): void {
  console.error(`[club-taken] ${wat} mislukt`, fout.message)
}

/** De vestiging van een taak (via zijn lijst), of null als de taak niet van deze gebruiker is. */
async function vestigingVanTaak(t: ClubToegang, taakId: string): Promise<Vestiging | null> {
  const taak = await t.admin.from('club_taken').select('lijst_id').eq('user_id', t.userId).eq('id', taakId).maybeSingle()
  if (taak.error || !taak.data || typeof taak.data.lijst_id !== 'string') return null
  const lijst = await t.admin.from('club_takenlijsten').select('vestiging').eq('user_id', t.userId).eq('id', taak.data.lijst_id).maybeSingle()
  if (lijst.error || !lijst.data || !isVestiging(lijst.data.vestiging)) return null
  return lijst.data.vestiging
}

/** Wie het deed: bij een gekozen medewerker zijn naam uit de database, anders de ingevulde naam of initialen. */
async function bepaalPersoon(t: ClubToegang, p: Persoon): Promise<Persoon | null> {
  if (!p.medewerkerId) return p
  const { data, error } = await t.admin.from('club_medewerkers').select('naam').eq('user_id', t.userId).eq('id', p.medewerkerId).maybeSingle()
  if (error || !data || typeof data.naam !== 'string') return null
  return { medewerkerId: p.medewerkerId, wie: data.naam }
}

async function bestaandVinkje(t: ClubToegang, taakId: string, datum: string): Promise<Afvinking | null> {
  const { data } = await t.admin.from('club_taak_afvinken').select(AFVINK_KOLOMMEN).eq('user_id', t.userId).eq('taak_id', taakId).eq('datum', datum).maybeSingle()
  return afvinkingUitRij(data)
}

export async function vinkAf(t: ClubToegang, invoer: AfvinkInvoer): Promise<Resultaat<Afvinking>> {
  const vestiging = await vestigingVanTaak(t, invoer.taakId)
  if (!vestiging) return mislukt('Deze taak bestaat niet.', 404)
  const persoon = await bepaalPersoon(t, invoer)
  if (!persoon) return mislukt('Deze medewerker bestaat niet.', 400)
  const { data, error } = await t.admin
    .from('club_taak_afvinken')
    .insert({ user_id: t.userId, vestiging, taak_id: invoer.taakId, datum: invoer.datum, medewerker_id: persoon.medewerkerId, wie: persoon.wie })
    .select(AFVINK_KOLOMMEN)
    .single()
  if (error) {
    // Iemand anders was net eerder: geef zijn vinkje terug.
    const al = error.code === '23505' ? await bestaandVinkje(t, invoer.taakId, invoer.datum) : null
    if (al) return gelukt(al)
    logFout('afvinken', error)
    return mislukt(NIET_GELUKT, 500)
  }
  const vinkje = afvinkingUitRij(data)
  return vinkje ? gelukt(vinkje) : mislukt(NIET_GELUKT, 500)
}

export async function vinkUit(t: ClubToegang, taakId: string, datum: string): Promise<Resultaat<{ weg: true }>> {
  const { error } = await t.admin.from('club_taak_afvinken').delete().eq('user_id', t.userId).eq('taak_id', taakId).eq('datum', datum)
  if (error) {
    logFout('vinkje weghalen', error)
    return mislukt('Weghalen is niet gelukt. Probeer het opnieuw.', 500)
  }
  return gelukt({ weg: true })
}

export async function voegNotitieToe(t: ClubToegang, invoer: NotitieInvoer): Promise<Resultaat<DagNotitie>> {
  const persoon = await bepaalPersoon(t, invoer)
  if (!persoon) return mislukt('Deze medewerker bestaat niet.', 400)
  const { data, error } = await t.admin
    .from('club_taak_notities')
    .insert({ user_id: t.userId, vestiging: invoer.vestiging, datum: invoer.datum, tekst: invoer.tekst, wie: persoon.wie, medewerker_id: persoon.medewerkerId })
    .select(NOTITIE_KOLOMMEN)
    .single()
  const notitie = notitieUitRij(data)
  if (error || !notitie) {
    if (error) logFout('notitie opslaan', error)
    return mislukt(NIET_GELUKT, 500)
  }
  return gelukt(notitie)
}

export async function verwijderNotitie(t: ClubToegang, id: string): Promise<Resultaat<{ weg: true }>> {
  const { error } = await t.admin.from('club_taak_notities').delete().eq('user_id', t.userId).eq('id', id)
  if (error) {
    logFout('notitie verwijderen', error)
    return mislukt('Verwijderen is niet gelukt. Probeer het opnieuw.', 500)
  }
  return gelukt({ weg: true })
}

/** Hoeveel actieve afsluittaken van deze vestiging staan vandaag nog open? */
async function openAfsluittaken(t: ClubToegang, vestiging: Vestiging, datum: string): Promise<number | null> {
  const lijsten = await t.admin.from('club_takenlijsten').select('id').eq('user_id', t.userId).eq('vestiging', vestiging).eq('actief', true)
  if (lijsten.error) return null
  const ids = (lijsten.data ?? []).map((r) => r.id).filter((id): id is string => typeof id === 'string')
  if (ids.length === 0) return 0
  const taken = await t.admin.from('club_taken').select('id').eq('user_id', t.userId).eq('actief', true).eq('moment', 'afsluiten').in('lijst_id', ids)
  if (taken.error) return null
  const taakIds = (taken.data ?? []).map((r) => r.id).filter((id): id is string => typeof id === 'string')
  if (taakIds.length === 0) return 0
  const klaar = await t.admin.from('club_taak_afvinken').select('taak_id').eq('user_id', t.userId).eq('datum', datum).in('taak_id', taakIds)
  if (klaar.error) return null
  return taakIds.length - (klaar.data ?? []).length
}

/** Afsluitronde klaar: wie en wanneer, plus hoeveel er nog open stond. Nogmaals = bijwerken. */
export async function meldAfsluitronde(t: ClubToegang, invoer: AfsluitInvoer, datum: string): Promise<Resultaat<Afsluitronde>> {
  const persoon = await bepaalPersoon(t, invoer)
  if (!persoon) return mislukt('Deze medewerker bestaat niet.', 400)
  const open = await openAfsluittaken(t, invoer.vestiging, datum)
  if (open === null) return mislukt(NIET_GELUKT, 500)
  const { data, error } = await t.admin
    .from('club_taak_afsluitrondes')
    .upsert(
      { user_id: t.userId, vestiging: invoer.vestiging, datum, wie: persoon.wie, medewerker_id: persoon.medewerkerId, open_taken: open, op: new Date().toISOString() },
      { onConflict: 'user_id,vestiging,datum' },
    )
    .select(AFSLUIT_KOLOMMEN)
    .single()
  const ronde = afsluitrondeUitRij(data)
  if (error || !ronde) {
    if (error) logFout('afsluitronde opslaan', error)
    return mislukt(NIET_GELUKT, 500)
  }
  return gelukt(ronde)
}
