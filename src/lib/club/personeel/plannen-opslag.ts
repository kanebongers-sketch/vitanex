// ─── Fit Factory Club, personeel: snel plannen opslaan (SERVER) ─────────────
// Vorige week kopieren en vaste patronen opslaan of toepassen. Aanvullen voegt
// alleen toe wat er nog niet staat; vervangen haalt eerst de diensten van die
// weken weg waar nog geen uren op staan.

import { logActie, type ClubToegang } from '@/lib/club/toegang'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { plusDagen } from '@/lib/club/rooster/tijd'
import { dbFout, gelukt, mislukt, type Resultaat } from './api'
import { haalDiensten } from './opslag'
import { kopieerDiensten, sjabloonToepassen, sjabloonUitWeek, wekenVanaf, zonderDubbele } from './planning'
import { sjabloonDienstNaarJson, sjabloonUitRij, type NieuweDienst } from './typen'

const BROK = 200

async function zetDiensten(t: ClubToegang, vestiging: Vestiging, nieuw: readonly NieuweDienst[]): Promise<Resultaat<number>> {
  for (let i = 0; i < nieuw.length; i += BROK) {
    const rijen = nieuw.slice(i, i + BROK).map((d) => ({
      user_id: t.userId,
      vestiging,
      datum: d.datum,
      begin: d.begin,
      eind: d.eind,
      medewerker_id: d.medewerkerId,
      soort_id: d.soortId,
      notitie: d.notitie,
    }))
    const { error } = await t.admin.from('club_diensten').insert(rijen)
    if (error) return dbFout('Diensten zetten', error)
  }
  return gelukt(nieuw.length)
}

/** Haal geplande diensten (zonder uren) weg uit een tijdvak. */
async function leegmaken(t: ClubToegang, vestiging: Vestiging, van: string, tot: string): Promise<Resultaat<null>> {
  const { error } = await t.admin
    .from('club_diensten')
    .delete()
    .eq('user_id', t.userId)
    .eq('vestiging', vestiging)
    .eq('uur_status', 'gepland')
    .gte('datum', van)
    .lt('datum', tot)
  return error ? dbFout('Leegmaken', error) : gelukt(null)
}

async function plaats(t: ClubToegang, vestiging: Vestiging, van: string, tot: string, nieuw: NieuweDienst[], vervang: boolean): Promise<Resultaat<{ toegevoegd: number }>> {
  if (vervang) {
    const leeg = await leegmaken(t, vestiging, van, tot)
    if (!leeg.ok) return leeg
  }
  const bestaand = await haalDiensten(t.admin, t.userId, vestiging, van, tot)
  if (!bestaand) return mislukt('Het rooster kon niet worden gelezen.', 500)
  const r = await zetDiensten(t, vestiging, zonderDubbele(nieuw, bestaand))
  return r.ok ? gelukt({ toegevoegd: r.waarde }) : r
}

export async function kopieerVorigeWeek(t: ClubToegang, vestiging: Vestiging, maandag: string, vervang: boolean): Promise<Resultaat<{ toegevoegd: number }>> {
  const vorige = await haalDiensten(t.admin, t.userId, vestiging, plusDagen(maandag, -7), maandag)
  if (!vorige) return mislukt('Vorige week kon niet worden gelezen.', 500)
  if (vorige.length === 0) return mislukt('Vorige week staan geen diensten om te kopieren.')
  const r = await plaats(t, vestiging, maandag, plusDagen(maandag, 7), kopieerDiensten(vorige, 7), vervang)
  if (r.ok) await logActie(t, 'week gekopieerd', `${r.waarde.toegevoegd} diensten naar week van ${maandag}`, vestiging)
  return r
}

export async function bewaarPatroon(t: ClubToegang, vestiging: Vestiging, maandag: string, naam: string): Promise<Resultaat<{ id: string }>> {
  const week = await haalDiensten(t.admin, t.userId, vestiging, maandag, plusDagen(maandag, 7))
  if (!week) return mislukt('De week kon niet worden gelezen.', 500)
  if (week.length === 0) return mislukt('Deze week staan nog geen diensten.')
  const { data, error } = await t.admin
    .from('club_dienst_sjablonen')
    .insert({ user_id: t.userId, vestiging, naam, diensten: sjabloonUitWeek(week).map(sjabloonDienstNaarJson) })
    .select('id')
    .single()
  if (error || !data) return dbFout('Patroon opslaan', error ?? { message: 'geen rij' })
  await logActie(t, 'patroon opgeslagen', naam, vestiging)
  return gelukt({ id: String(data.id) })
}

export async function pasPatroonToe(
  t: ClubToegang,
  id: string,
  vestiging: Vestiging,
  maandag: string,
  weken: number,
  vervang: boolean,
): Promise<Resultaat<{ toegevoegd: number }>> {
  const { data, error } = await t.admin.from('club_dienst_sjablonen').select('id, naam, diensten').eq('user_id', t.userId).eq('vestiging', vestiging).eq('id', id).maybeSingle()
  if (error) return dbFout('Patroon lezen', error)
  const sjabloon = sjabloonUitRij(data)
  if (!sjabloon) return mislukt('Dit patroon bestaat niet (meer).', 404)
  const nieuw = sjabloonToepassen(sjabloon.diensten, wekenVanaf(maandag, weken))
  const r = await plaats(t, vestiging, maandag, plusDagen(maandag, weken * 7), nieuw, vervang)
  if (r.ok) await logActie(t, 'patroon toegepast', `${sjabloon.naam}: ${weken} weken vanaf ${maandag}`, vestiging)
  return r
}

export async function verwijderPatroon(t: ClubToegang, id: string): Promise<Resultaat<{ id: string }>> {
  const { error } = await t.admin.from('club_dienst_sjablonen').delete().eq('user_id', t.userId).eq('id', id)
  if (error) return dbFout('Patroon verwijderen', error)
  await logActie(t, 'patroon verwijderd', null, null)
  return gelukt({ id })
}
