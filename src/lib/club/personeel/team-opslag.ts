// ─── Fit Factory Club, personeel: beschikbaarheid, team en mededelingen (SERVER)

import { logActie, type ClubToegang } from '@/lib/club/toegang'
import { dbFout, gelukt, isEigenMedewerker, mislukt, type Resultaat } from './api'
import type { BeschikbaarInvoer, NotitieInvoer, VasteDag } from './invoer'
import type { Kleur } from './typen'

const GEEN_MEDEWERKER = 'Deze medewerker bestaat niet.'

export async function voegBeschikbaarheidToe(t: ClubToegang, i: BeschikbaarInvoer): Promise<Resultaat<{ id: string }>> {
  if (!(await isEigenMedewerker(t, i.medewerkerId))) return mislukt(GEEN_MEDEWERKER, 404)
  const { data, error } = await t.admin
    .from('club_beschikbaarheid')
    .insert({
      user_id: t.userId,
      medewerker_id: i.medewerkerId,
      datum: i.datum,
      datum_tot: i.datumTot,
      beschikbaar: i.beschikbaar,
      van: i.van,
      tot: i.tot,
      reden: i.reden,
      notitie: i.notitie,
    })
    .select('id')
    .single()
  if (error || !data) return dbFout('Opslaan', error ?? { message: 'geen rij' })
  await logActie(t, i.beschikbaar ? 'beschikbaarheid gezet' : `${i.reden ?? 'afwezig'} gezet`, `${i.datum}${i.datumTot ? ` tot ${i.datumTot}` : ''}`, null)
  return gelukt({ id: String(data.id) })
}

export async function verwijderBeschikbaarheid(t: ClubToegang, id: string): Promise<Resultaat<{ id: string }>> {
  const { error } = await t.admin.from('club_beschikbaarheid').delete().eq('user_id', t.userId).eq('id', id)
  if (error) return dbFout('Verwijderen', error)
  return gelukt({ id })
}

/** De vaste week vervangen: weekdagregels weg, de nieuwe erin. */
export async function zetVasteWeek(t: ClubToegang, medewerkerId: string, dagen: readonly VasteDag[]): Promise<Resultaat<{ regels: number }>> {
  if (!(await isEigenMedewerker(t, medewerkerId))) return mislukt(GEEN_MEDEWERKER, 404)
  const { error } = await t.admin.from('club_beschikbaarheid').delete().eq('user_id', t.userId).eq('medewerker_id', medewerkerId).not('weekdag', 'is', null)
  if (error) return dbFout('Vaste week opslaan', error)
  const rijen = dagen.flatMap((d, i) =>
    d.beschikbaar === null ? [] : [{ user_id: t.userId, medewerker_id: medewerkerId, weekdag: i + 1, beschikbaar: d.beschikbaar, van: d.van, tot: d.tot }],
  )
  if (rijen.length > 0) {
    const { error: fout } = await t.admin.from('club_beschikbaarheid').insert(rijen)
    if (fout) return dbFout('Vaste week opslaan', fout)
  }
  await logActie(t, 'vaste beschikbaarheid gezet', null, null)
  return gelukt({ regels: rijen.length })
}

export async function wijzigMedewerker(t: ClubToegang, id: string, w: { contracturen?: number | null; kleur?: Kleur }): Promise<Resultaat<{ id: string }>> {
  if (!(await isEigenMedewerker(t, id))) return mislukt(GEEN_MEDEWERKER, 404)
  const velden: Record<string, unknown> = {}
  if (w.contracturen !== undefined) velden.contracturen_per_week = w.contracturen
  if (w.kleur !== undefined) velden.kleur = w.kleur
  const { error } = await t.admin.from('club_medewerkers').update(velden).eq('user_id', t.userId).eq('id', id)
  if (error) return dbFout('Opslaan', error)
  await logActie(t, 'medewerker gewijzigd', w.contracturen !== undefined ? `contracturen ${w.contracturen ?? 'leeg'}` : 'roosterkleur', null)
  return gelukt({ id })
}

export async function maakNotitie(t: ClubToegang, i: NotitieInvoer): Promise<Resultaat<{ id: string }>> {
  if (i.medewerkerId && !(await isEigenMedewerker(t, i.medewerkerId, i.vestiging))) return mislukt('Deze medewerker werkt niet in deze vestiging.')
  const { data, error } = await t.admin
    .from('club_rooster_notities')
    .insert({ user_id: t.userId, vestiging: i.vestiging, datum: i.datum, van: i.van, tot: i.tot, soort: i.soort, medewerker_id: i.medewerkerId, tekst: i.tekst })
    .select('id')
    .single()
  if (error || !data) return dbFout('Mededeling opslaan', error ?? { message: 'geen rij' })
  await logActie(t, i.soort === 'geen_afspraken' ? 'geen afspraken gezet' : 'mededeling geplaatst', `${i.datum} ${i.tekst}`, i.vestiging)
  return gelukt({ id: String(data.id) })
}

export async function verwijderNotitie(t: ClubToegang, id: string): Promise<Resultaat<{ id: string }>> {
  const { error } = await t.admin.from('club_rooster_notities').delete().eq('user_id', t.userId).eq('id', id)
  if (error) return dbFout('Verwijderen', error)
  return gelukt({ id })
}
