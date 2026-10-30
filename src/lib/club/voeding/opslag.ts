// ─── Club, voeding: schrijven (SERVER-ONLY) ─────────────────────────────────
// Plannen per lid en sjablonen per sportschool. Alles op user_id van de
// actieve sportschool; een id van buiten wordt altijd tegen user_id gecontroleerd.

import { logActie, type ClubToegang } from '@/lib/club/toegang'
import { gelukt, mislukt, type Resultaat } from '@/lib/club/rooster/basis-opslag'
import { volledigeNaam, type Lid } from '@/lib/club/kern/lid'
import type { PlanInvoer, SjabloonInvoer } from './invoer'
import { haalSjabloon } from './lezen'

const OPSLAAN_MISLUKT = 'Opslaan is niet gelukt. Probeer het opnieuw.'
const GEEN_SJABLOON = 'Dit sjabloon bestaat niet.'

function sjabloonRij(s: SjabloonInvoer) {
  return {
    naam: s.naam,
    omschrijving: s.omschrijving,
    doel: s.doel,
    eiwit_per_kg: s.eiwitPerKg,
    kcal: s.kcal,
    eiwit_g: s.eiwitG,
    koolhydraten_g: s.koolhydratenG,
    vet_g: s.vetG,
    adviezen: s.adviezen,
    maaltijden: s.maaltijden,
  }
}

/** Het plan van een lid opslaan (een lid heeft een huidig plan). Het lid is al gecontroleerd. */
export async function bewaarPlan(t: ClubToegang, lid: Lid, p: PlanInvoer): Promise<Resultaat<{ lidId: string }>> {
  // Een sjabloon van een andere sportschool telt niet.
  const sjabloonId = p.sjabloonId && (await haalSjabloon(t.admin, t.userId, p.sjabloonId)) ? p.sjabloonId : null
  const rij = {
    user_id: t.userId,
    lid_id: lid.id,
    doel: p.doel,
    kcal: p.kcal,
    eiwit_g: p.eiwitG,
    koolhydraten_g: p.koolhydratenG,
    vet_g: p.vetG,
    adviezen: p.adviezen,
    maaltijden: p.maaltijden,
    notitie: p.notitie,
    berekening: p.berekening,
    sjabloon_id: sjabloonId,
    bijgewerkt_door: t.naam.slice(0, 80),
    bijgewerkt_op: new Date().toISOString(),
    // Wie het plan in de editor opslaat, maakt het tot een plan van de trainer (migratie 471).
    bron: 'trainer',
  }
  const { error } = await t.admin.from('club_voedingsplannen').upsert(rij, { onConflict: 'user_id,lid_id' })
  if (error) {
    console.error('[club/voeding] plan opslaan mislukt', error.message)
    return mislukt(OPSLAAN_MISLUKT, 500)
  }
  await logActie(t, 'Voedingsplan opgeslagen', volledigeNaam(lid), lid.vestiging)
  return gelukt({ lidId: lid.id })
}

export async function verwijderPlan(t: ClubToegang, lid: Lid): Promise<Resultaat<{ verwijderd: true }>> {
  const { error } = await t.admin.from('club_voedingsplannen').delete().eq('user_id', t.userId).eq('lid_id', lid.id)
  if (error) {
    console.error('[club/voeding] plan verwijderen mislukt', error.message)
    return mislukt('Verwijderen is niet gelukt. Probeer het opnieuw.', 500)
  }
  await logActie(t, 'Voedingsplan verwijderd', volledigeNaam(lid), lid.vestiging)
  return gelukt({ verwijderd: true })
}

export async function maakSjabloon(t: ClubToegang, s: SjabloonInvoer): Promise<Resultaat<{ id: string }>> {
  const { data, error } = await t.admin.from('club_voedingssjablonen').insert({ ...sjabloonRij(s), user_id: t.userId }).select('id').single()
  if (error) {
    console.error('[club/voeding] sjabloon maken mislukt', error.message)
    return mislukt(OPSLAAN_MISLUKT, 500)
  }
  await logActie(t, 'Voedingssjabloon gemaakt', s.naam, null)
  return gelukt({ id: String(data.id) })
}

export async function wijzigSjabloon(t: ClubToegang, id: string, s: SjabloonInvoer): Promise<Resultaat<{ id: string }>> {
  if (!(await haalSjabloon(t.admin, t.userId, id))) return mislukt(GEEN_SJABLOON, 404)
  const { error } = await t.admin.from('club_voedingssjablonen').update({ ...sjabloonRij(s), bijgewerkt_op: new Date().toISOString() }).eq('user_id', t.userId).eq('id', id)
  if (error) {
    console.error('[club/voeding] sjabloon wijzigen mislukt', error.message)
    return mislukt(OPSLAAN_MISLUKT, 500)
  }
  await logActie(t, 'Voedingssjabloon aangepast', s.naam, null)
  return gelukt({ id })
}

/** Verwijderen mag: plannen hebben hun eigen kopie van de inhoud (sjabloon_id wordt leeg). */
export async function verwijderSjabloon(t: ClubToegang, id: string): Promise<Resultaat<{ verwijderd: true }>> {
  const oud = await haalSjabloon(t.admin, t.userId, id)
  if (!oud) return mislukt(GEEN_SJABLOON, 404)
  const { error } = await t.admin.from('club_voedingssjablonen').delete().eq('user_id', t.userId).eq('id', id)
  if (error) {
    console.error('[club/voeding] sjabloon verwijderen mislukt', error.message)
    return mislukt('Verwijderen is niet gelukt. Probeer het opnieuw.', 500)
  }
  await logActie(t, 'Voedingssjabloon verwijderd', oud.naam, null)
  return gelukt({ verwijderd: true })
}
