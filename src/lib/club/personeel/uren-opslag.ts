// ─── Fit Factory Club, personeel: uren registreren en verwerken (SERVER) ────
// Per dienst: werkelijke tijden, pauze en opmerking, en de stap
// gepland > gewerkt > goedgekeurd > verwerkt. In bulk: alles zonder afwijking
// goedkeuren en goedgekeurde uren als verwerkt markeren.

import { logActie, type ClubToegang } from '@/lib/club/toegang'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { dbFout, gelukt, mislukt, type Resultaat } from './api'
import { haalDienst, haalDiensten } from './opslag'
import { afwijkingen, goedTeKeuren } from './uren'
import type { UrenInvoer } from './invoer'
import type { Dienst, UurStatus } from './typen'
import { magUrenActie, magUrenBeheren, UREN_NIET_TOEGESTAAN } from './uren-rechten'

function volgendeStatus(huidig: UurStatus, actie: UrenInvoer['actie']): UurStatus | null {
  if (actie === 'opslaan') return huidig
  if (actie === 'bevestig') return huidig === 'gepland' || huidig === 'gewerkt' ? 'gewerkt' : null
  if (actie === 'goedkeuren') return huidig === 'gepland' || huidig === 'gewerkt' || huidig === 'goedgekeurd' ? 'goedgekeurd' : null
  if (huidig === 'goedgekeurd') return 'gewerkt'
  if (huidig === 'gewerkt') return 'gepland'
  return null
}

function stempels(t: ClubToegang, d: Dienst, nieuw: UurStatus): Record<string, unknown> {
  const nu = new Date().toISOString()
  if (nieuw === 'gepland') return { bevestigd_door: null, bevestigd_op: null, goedgekeurd_door: null, goedgekeurd_op: null }
  const bevestigd = d.uurStatus === 'gepland' ? { bevestigd_door: t.naam.slice(0, 80), bevestigd_op: nu } : {}
  if (nieuw === 'goedgekeurd' && d.uurStatus !== 'goedgekeurd') return { ...bevestigd, goedgekeurd_door: t.naam.slice(0, 80), goedgekeurd_op: nu }
  if (nieuw === 'gewerkt') return { ...bevestigd, goedgekeurd_door: null, goedgekeurd_op: null }
  return bevestigd
}

export async function registreerUren(t: ClubToegang, id: string, i: UrenInvoer): Promise<Resultaat<{ status: UurStatus }>> {
  const d = await haalDienst(t.admin, t.userId, id)
  if (!d) return mislukt('Deze dienst bestaat niet (meer).', 404)
  if (d.uurStatus === 'verwerkt') return mislukt('Deze uren zijn al verwerkt door de administratie.', 409)
  if (!d.medewerkerId) return mislukt('Een open dienst heeft geen uren. Plan eerst iemand in.')
  if (!magUrenActie(t, d, i.actie)) return mislukt(UREN_NIET_TOEGESTAAN, 403)
  const nieuw = volgendeStatus(d.uurStatus, i.actie)
  if (!nieuw) return mislukt('Deze stap kan niet vanuit de huidige status.', 409)
  const { error } = await t.admin
    .from('club_diensten')
    .update({
      gewerkt_begin: i.gewerktBegin && i.gewerktBegin !== d.begin ? i.gewerktBegin : null,
      gewerkt_eind: i.gewerktEind && i.gewerktEind !== d.eind ? i.gewerktEind : null,
      pauze_min: i.pauzeMin,
      uren_opmerking: i.opmerking,
      uur_status: nieuw,
      ...stempels(t, d, nieuw),
      bijgewerkt_op: new Date().toISOString(),
    })
    .eq('user_id', t.userId)
    .eq('id', id)
  if (error) return dbFout('Uren opslaan', error)
  const actie = i.actie === 'opslaan' ? 'uren aangepast' : i.actie === 'bevestig' ? 'uren bevestigd' : i.actie === 'goedkeuren' ? 'uren goedgekeurd' : 'uren teruggezet'
  await logActie(t, actie, `${d.datum} ${d.begin} tot ${d.eind}`, d.vestiging)
  return gelukt({ status: nieuw })
}

export async function urenInBulk(
  t: ClubToegang,
  vestiging: Vestiging,
  actie: 'goedkeuren' | 'verwerken',
  van: string,
  tot: string,
  nu: { datum: string; minuten: number },
): Promise<Resultaat<{ aantal: number; overgeslagen: number }>> {
  if (!magUrenBeheren(t)) return mislukt(UREN_NIET_TOEGESTAAN, 403)
  const diensten = await haalDiensten(t.admin, t.userId, vestiging, van, tot)
  if (!diensten) return mislukt('De diensten konden niet worden gelezen.', 500)
  const stempel = new Date().toISOString()
  if (actie === 'goedkeuren') {
    const afw = afwijkingen(diensten, nu.datum, nu.minuten)
    const ids = goedTeKeuren(diensten, afw)
    const overgeslagen = diensten.filter((d) => d.uurStatus === 'gewerkt').length - ids.length
    if (ids.length === 0) return mislukt(overgeslagen > 0 ? 'Alle gewerkte diensten hebben een afwijking. Bekijk die eerst een voor een.' : 'Er zijn geen gewerkte diensten om goed te keuren.', 409)
    const { error } = await t.admin
      .from('club_diensten')
      .update({ uur_status: 'goedgekeurd', goedgekeurd_door: t.naam.slice(0, 80), goedgekeurd_op: stempel })
      .eq('user_id', t.userId)
      .eq('uur_status', 'gewerkt')
      .in('id', ids)
    if (error) return dbFout('Goedkeuren', error)
    await logActie(t, 'uren goedgekeurd', `${ids.length} diensten van ${van} tot ${tot}`, vestiging)
    return gelukt({ aantal: ids.length, overgeslagen })
  }
  const ids = diensten.filter((d) => d.uurStatus === 'goedgekeurd').map((d) => d.id)
  if (ids.length === 0) return mislukt('Er zijn geen goedgekeurde uren om te verwerken.', 409)
  const { error } = await t.admin.from('club_diensten').update({ uur_status: 'verwerkt', verwerkt_op: stempel }).eq('user_id', t.userId).eq('uur_status', 'goedgekeurd').in('id', ids)
  if (error) return dbFout('Verwerken', error)
  await logActie(t, 'uren verwerkt', `${ids.length} diensten van ${van} tot ${tot}`, vestiging)
  return gelukt({ aantal: ids.length, overgeslagen: diensten.length - ids.length })
}
