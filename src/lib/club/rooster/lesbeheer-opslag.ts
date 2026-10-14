// ─── Fit Factory Club, rooster: een les beheren (SERVER) ────────────────────
// Het zijpaneel (deelnemers, wachtlijst, proefleden), een les annuleren of
// aanpassen, en lessen aanmaken uit het weekrooster.

import type { SupabaseClient } from '@supabase/supabase-js'
import { LID_KOLOMMEN, lidUitRij, type Lid } from '@/lib/club/kern/lid'
import { logActie, type ClubToegang } from '@/lib/club/toegang'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { gelukt, haalLesRij, haalReserveringenVanLes, haalStamdata, maakOverzicht, mislukt, type Resultaat } from './basis-opslag'
import { lesSleutel, lessenUitSeries, MAX_WEKEN_VOORUIT } from './genereren'
import type { LesWijziging } from './invoer'
import { telPerLes, type LesOverzicht } from './raster'
import { sorteerWachtlijst } from './regels'
import { schuifWachtlijstDoor } from './reserveren-opslag'
import { nlDelen } from './tijd'
import { SERIE_KOLOMMEN, rijenNaar, serieUitRij, type ReserveringRij } from './typen'

export interface Deelnemer {
  reservering: ReserveringRij
  lid: Lid | null
}

export interface Proeflid {
  id: string
  naam: string
}

export interface LesDetail {
  les: LesOverzicht
  /** Geboekt, aanwezig of no-show, op volgorde van boeken. */
  deelnemers: Deelnemer[]
  wachtlijst: Deelnemer[]
  geannuleerd: Deelnemer[]
  proefleden: Proeflid[]
}

async function haalLedenOpId(admin: SupabaseClient, userId: string, ids: readonly string[]): Promise<Map<string, Lid>> {
  if (ids.length === 0) return new Map()
  const { data, error } = await admin.from('club_leden').select(LID_KOLOMMEN).eq('user_id', userId).in('id', [...ids])
  if (error) console.error('[club-rooster] leden lezen mislukt', error.message)
  const leden = rijenNaar(data, lidUitRij)
  return new Map(leden.map((l) => [l.id, l]))
}

async function haalProefleden(admin: SupabaseClient, userId: string, lesId: string): Promise<Proeflid[]> {
  const { data, error } = await admin.from('club_leads').select('id, naam').eq('user_id', userId).eq('proefles_les_id', lesId).order('naam')
  if (error) {
    console.error('[club-rooster] proefleden lezen mislukt', error.message)
    return []
  }
  return (data ?? []).flatMap((r) => (typeof r.id === 'string' && typeof r.naam === 'string' ? [{ id: r.id, naam: r.naam }] : []))
}

/** Alles voor het zijpaneel van een les. */
export async function haalLesDetail(admin: SupabaseClient, userId: string, lesId: string): Promise<LesDetail | null> {
  const les = await haalLesRij(admin, userId, lesId)
  if (!les) return null
  const [rijen, stam, proefleden] = await Promise.all([
    haalReserveringenVanLes(admin, userId, les.id),
    haalStamdata(admin, userId, les.vestiging),
    haalProefleden(admin, userId, les.id),
  ])
  if (!rijen || !stam) return null
  const leden = await haalLedenOpId(admin, userId, [...new Set(rijen.map((r) => r.lidId))])
  const metLid = (r: ReserveringRij): Deelnemer => ({ reservering: r, lid: leden.get(r.lidId) ?? null })
  const [overzicht] = maakOverzicht([les], stam, telPerLes(rijen))
  return {
    les: overzicht,
    deelnemers: rijen.filter((r) => r.status === 'geboekt' || r.status === 'aanwezig' || r.status === 'no_show').map(metLid),
    wachtlijst: sorteerWachtlijst(rijen.filter((r) => r.status === 'wachtlijst')).map(metLid),
    geannuleerd: rijen.filter((r) => r.status === 'geannuleerd').map(metLid),
    proefleden,
  }
}

/** Annuleer een hele les; alle open reserveringen vervallen. */
export async function annuleerLes(t: ClubToegang, lesId: string, reden: string, nu = new Date()): Promise<Resultaat<{ status: 'geannuleerd'; geraakt: number }>> {
  const les = await haalLesRij(t.admin, t.userId, lesId)
  if (!les) return mislukt('Deze les bestaat niet.', 404)
  if (les.geannuleerd) return mislukt('Deze les is al geannuleerd.', 409)
  if (Date.parse(les.startOp) <= nu.getTime()) return mislukt('Deze les is al begonnen of voorbij.', 409)
  const { error } = await t.admin.from('club_lessen').update({ status: 'geannuleerd', annuleer_reden: reden }).eq('user_id', t.userId).eq('id', les.id)
  if (error) {
    console.error('[club-rooster] les annuleren mislukt', error.message)
    return mislukt('Annuleren is niet gelukt. Probeer het opnieuw.', 500)
  }
  const { data, error: f2 } = await t.admin
    .from('club_reserveringen')
    .update({ status: 'geannuleerd', wachtpositie: null, gewijzigd_op: nu.toISOString() })
    .eq('user_id', t.userId)
    .eq('les_id', les.id)
    .in('status', ['geboekt', 'wachtlijst'])
    .select('id')
  if (f2) console.error('[club-rooster] reserveringen vervallen mislukt', f2.message)
  const moment = nlDelen(new Date(les.startOp))
  await logActie(t, 'Les geannuleerd', `${moment.datum} ${moment.tijd}: ${reden}`, les.vestiging)
  return gelukt({ status: 'geannuleerd', geraakt: data?.length ?? 0 })
}

/** Pas capaciteit, instructeur of zaal aan voor deze ene les. Meer plekken = wachtlijst schuift door. */
export async function wijzigLes(t: ClubToegang, lesId: string, wijziging: LesWijziging, nu = new Date()): Promise<Resultaat<{ doorgeschoven: number }>> {
  const les = await haalLesRij(t.admin, t.userId, lesId)
  if (!les) return mislukt('Deze les bestaat niet.', 404)
  if (les.geannuleerd) return mislukt('Deze les is geannuleerd en kan niet meer worden aangepast.', 409)
  const stam = await haalStamdata(t.admin, t.userId, les.vestiging)
  if (!stam) return mislukt('De gegevens konden niet worden gelezen.', 500)
  if (wijziging.zaalId && !stam.zalen.some((z) => z.id === wijziging.zaalId)) return mislukt('Deze zaal hoort niet bij deze vestiging.')
  if (wijziging.instructeurId && !stam.medewerkers.some((m) => m.id === wijziging.instructeurId)) return mislukt('Onbekende instructeur.')
  const velden = {
    ...(wijziging.capaciteit !== undefined ? { capaciteit: wijziging.capaciteit } : {}),
    ...(wijziging.zaalId !== undefined ? { zaal_id: wijziging.zaalId } : {}),
    ...(wijziging.instructeurId !== undefined ? { instructeur_id: wijziging.instructeurId } : {}),
  }
  const { error } = await t.admin.from('club_lessen').update(velden).eq('user_id', t.userId).eq('id', les.id)
  if (error) {
    console.error('[club-rooster] les wijzigen mislukt', error.message)
    return mislukt('Opslaan is niet gelukt. Probeer het opnieuw.', 500)
  }
  const nieuw = { ...les, capaciteit: wijziging.capaciteit ?? les.capaciteit }
  const doorgeschoven = nieuw.capaciteit > les.capaciteit ? await schuifWachtlijstDoor(t.admin, t.userId, nieuw, nu) : []
  const moment = nlDelen(new Date(les.startOp))
  await logActie(t, 'Les aangepast', `${moment.datum} ${moment.tijd}`, les.vestiging)
  return gelukt({ doorgeschoven: doorgeschoven.length })
}

/** Maak de lessen voor de komende weken aan uit het weekrooster. Bestaande lessen blijven staan. */
export async function genereerLessen(t: ClubToegang, vestiging: Vestiging, weken: number, nu = new Date()): Promise<Resultaat<{ aangemaakt: number }>> {
  const { data, error } = await t.admin.from('club_lesseries').select(SERIE_KOLOMMEN).eq('user_id', t.userId).eq('vestiging', vestiging).eq('actief', true)
  if (error) {
    console.error('[club-rooster] weekrooster lezen mislukt', error.message)
    return mislukt('Het weekrooster kon niet worden gelezen.', 500)
  }
  const series = rijenNaar(data, serieUitRij)
  if (series.length === 0) return gelukt({ aangemaakt: 0 })
  const tot = new Date(nu.getTime() + (Math.min(weken, MAX_WEKEN_VOORUIT) * 7 + 1) * 86_400_000)
  const { data: bestaandeRijen, error: f2 } = await t.admin
    .from('club_lessen')
    .select('serie_id, start_op')
    .eq('user_id', t.userId)
    .in('serie_id', series.map((s) => s.id))
    .gte('start_op', nu.toISOString())
    .lte('start_op', tot.toISOString())
    .limit(5000)
  if (f2) return mislukt('De bestaande lessen konden niet worden gelezen.', 500)
  const bestaand = new Set(
    (bestaandeRijen ?? []).flatMap((r) => (typeof r.serie_id === 'string' && typeof r.start_op === 'string' ? [lesSleutel(r.serie_id, r.start_op)] : [])),
  )
  const nieuw = lessenUitSeries(series, nlDelen(nu).datum, weken, nu, bestaand)
  const aangemaakt = await voegLessenToe(t.admin, t.userId, nieuw)
  await logActie(t, 'Lessen aangemaakt', `${aangemaakt} lessen voor ${weken} weken`, vestiging)
  return gelukt({ aangemaakt })
}

async function voegLessenToe(admin: SupabaseClient, userId: string, lessen: ReturnType<typeof lessenUitSeries>): Promise<number> {
  if (lessen.length === 0) return 0
  const rijen = lessen.map((l) => ({
    user_id: userId,
    vestiging: l.vestiging,
    serie_id: l.serieId,
    lestype_id: l.lestypeId,
    zaal_id: l.zaalId,
    instructeur_id: l.instructeurId,
    start_op: l.startOp,
    eind_op: l.eindOp,
    capaciteit: l.capaciteit,
  }))
  const { error } = await admin.from('club_lessen').insert(rijen)
  if (!error) return rijen.length
  // Tegelijk aangemaakt door iemand anders (unieke index): dan een voor een, dubbele overslaan.
  let teller = 0
  for (const rij of rijen) {
    const { error: e } = await admin.from('club_lessen').insert(rij)
    if (!e) teller++
    else if (e.code !== '23505') console.error('[club-rooster] les aanmaken mislukt', e.message)
  }
  return teller
}
