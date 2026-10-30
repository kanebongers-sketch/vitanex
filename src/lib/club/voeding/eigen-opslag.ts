// ─── Club, voeding: eigen plannen van leden (SERVER-ONLY) ───────────────────
// Het lid schrijft alleen het eigen plan (lid uit de sessie, nooit uit de body).
// De trainer neemt een eigen plan of een voorstel over, of wijst een voorstel af.
// Elke query filtert op user_id van de sportschool en lid_id.

import type { SupabaseClient } from '@supabase/supabase-js'
import { logActie, type ClubToegang } from '@/lib/club/toegang'
import { gelukt, mislukt, type Resultaat } from '@/lib/club/rooster/basis-opslag'
import { volledigeNaam, type Lid } from '@/lib/club/kern/lid'
import { lidPlanModus, regelsUitRij, voorstelVan, type LidPlanInvoer, type TrainerActie, type VoedingRegels } from './eigen'
export { isTrainerActie, type TrainerActie } from './eigen'
import { haalPlan } from './lezen'
import type { VoedingPlan } from './model'

const OPSLAAN_MISLUKT = 'Opslaan is niet gelukt. Probeer het opnieuw.'
const GEEN_PLAN = 'Er is geen voedingsplan.'

function meld(wat: string, fout: { message: string }): void {
  console.error(`[club/voeding] ${wat} mislukt`, fout.message)
}

/** De regels van de sportschool; null bij een leesfout. Geen rij = de standaard. */
export async function haalVoedingRegels(admin: SupabaseClient, userId: string): Promise<VoedingRegels | null> {
  const { data, error } = await admin.from('club_voeding_regels').select('leden_overschrijven').eq('user_id', userId).maybeSingle()
  if (error) {
    meld('regels lezen', error)
    return null
  }
  return regelsUitRij(data)
}

export async function bewaarVoedingRegels(t: ClubToegang, regels: VoedingRegels): Promise<Resultaat<VoedingRegels>> {
  const { error } = await t.admin
    .from('club_voeding_regels')
    .upsert({ user_id: t.userId, leden_overschrijven: regels.ledenOverschrijven, bijgewerkt_op: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) {
    meld('regels opslaan', error)
    return mislukt(OPSLAAN_MISLUKT, 500)
  }
  await logActie(t, regels.ledenOverschrijven ? 'Leden mogen het voedingsplan van de trainer overschrijven' : 'Leden sturen een voorstel bij het voedingsplan van de trainer', t.organisatie.naam, null)
  return gelukt(regels)
}

interface LidSchrijver {
  admin: SupabaseClient
  userId: string
  lid: Lid
}

export type LidPlanUitslag = { soort: 'opgeslagen' } | { soort: 'voorstel' }

/**
 * Het lid bewaart het eigen plan, of stuurt een voorstel als de trainer het plan
 * maakte en de sportschool overschrijven niet toestaat. De server beslist, niet de app.
 */
export async function bewaarLidPlan(l: LidSchrijver, invoer: LidPlanInvoer, regels: VoedingRegels): Promise<Resultaat<LidPlanUitslag>> {
  const huidig = await haalPlan(l.admin, l.userId, l.lid.id)
  if (huidig === null) return mislukt('Je voedingsplan kon niet worden geladen. Probeer het opnieuw.', 500)
  const nu = new Date().toISOString()
  const p = invoer.plan
  if (lidPlanModus(huidig, regels) === 'voorstel') {
    const { error } = await l.admin.from('club_voedingsplannen').update({ voorstel: voorstelVan(p), voorstel_op: nu }).eq('user_id', l.userId).eq('lid_id', l.lid.id)
    if (error) {
      meld('voorstel opslaan', error)
      return mislukt(OPSLAAN_MISLUKT, 500)
    }
    return gelukt({ soort: 'voorstel' })
  }
  // Notitie van de trainer blijft staan (niet in de rij = niet overschreven).
  const planRij = {
    user_id: l.userId,
    lid_id: l.lid.id,
    doel: p.doel,
    kcal: p.kcal,
    eiwit_g: p.eiwitG,
    koolhydraten_g: p.koolhydratenG,
    vet_g: p.vetG,
    adviezen: p.adviezen,
    maaltijden: p.maaltijden,
    berekening: invoer.bewaarGegevens ? p.berekening : null,
    lid_toestemming_op: invoer.bewaarGegevens ? nu : null,
    sjabloon_id: null,
    bron: 'lid',
    voorstel: null,
    voorstel_op: null,
    bijgewerkt_door: volledigeNaam(l.lid).slice(0, 80),
    bijgewerkt_op: nu,
  }
  const { error } = await l.admin.from('club_voedingsplannen').upsert(planRij, { onConflict: 'user_id,lid_id' })
  if (error) {
    meld('eigen plan opslaan', error)
    return mislukt(OPSLAAN_MISLUKT, 500)
  }
  return gelukt({ soort: 'opgeslagen' })
}

/** Het lid haalt het eigen plan weg (alleen een eigen plan) of trekt het voorstel in. */
export async function verwijderLidPlan(l: LidSchrijver, wat: 'plan' | 'voorstel'): Promise<Resultaat<{ verwijderd: true }>> {
  const huidig = await haalPlan(l.admin, l.userId, l.lid.id)
  if (huidig === null) return mislukt('Je voedingsplan kon niet worden geladen. Probeer het opnieuw.', 500)
  if (!huidig) return mislukt(GEEN_PLAN, 404)
  if (wat === 'plan' && huidig.bron !== 'lid') return mislukt('Dit plan is van je trainer.', 403)
  const { error } =
    wat === 'plan'
      ? await l.admin.from('club_voedingsplannen').delete().eq('user_id', l.userId).eq('lid_id', l.lid.id).eq('bron', 'lid')
      : await l.admin.from('club_voedingsplannen').update({ voorstel: null, voorstel_op: null }).eq('user_id', l.userId).eq('lid_id', l.lid.id)
  if (error) {
    meld(wat === 'plan' ? 'eigen plan verwijderen' : 'voorstel intrekken', error)
    return mislukt('Dat is niet gelukt. Probeer het opnieuw.', 500)
  }
  return gelukt({ verwijderd: true })
}

function actieRij(t: ClubToegang, plan: VoedingPlan, actie: TrainerActie): Record<string, unknown> | null {
  const door = { bron: 'trainer', bijgewerkt_door: t.naam.slice(0, 80), bijgewerkt_op: new Date().toISOString() }
  if (actie === 'overnemen') return plan.bron === 'lid' ? door : null
  if (!plan.voorstel) return null
  if (actie === 'voorstelAfwijzen') return { voorstel: null, voorstel_op: null }
  const v = plan.voorstel
  return { ...door, doel: v.doel, kcal: v.kcal, eiwit_g: v.eiwitG, koolhydraten_g: v.koolhydratenG, vet_g: v.vetG, adviezen: v.adviezen, maaltijden: v.maaltijden, voorstel: null, voorstel_op: null }
}

const ACTIE_LOG: Record<TrainerActie, string> = {
  overnemen: 'Eigen voedingsplan van lid overgenomen',
  voorstelOvernemen: 'Voorstel voor voedingsplan overgenomen',
  voorstelAfwijzen: 'Voorstel voor voedingsplan afgewezen',
}

/** De trainer neemt een eigen plan of een voorstel over, of wijst een voorstel af. */
export async function trainerActie(t: ClubToegang, lid: Lid, actie: TrainerActie): Promise<Resultaat<{ actie: TrainerActie }>> {
  const plan = await haalPlan(t.admin, t.userId, lid.id)
  if (plan === null) return mislukt('Het voedingsplan kon niet worden geladen.', 500)
  if (!plan) return mislukt(GEEN_PLAN, 404)
  const rij = actieRij(t, plan, actie)
  if (!rij) return mislukt(actie === 'overnemen' ? 'Dit plan is al van een trainer.' : 'Er ligt geen voorstel.', 409)
  const { error } = await t.admin.from('club_voedingsplannen').update(rij).eq('user_id', t.userId).eq('lid_id', lid.id)
  if (error) {
    meld('trainer-actie', error)
    return mislukt(OPSLAAN_MISLUKT, 500)
  }
  await logActie(t, ACTIE_LOG[actie], volledigeNaam(lid), lid.vestiging)
  return gelukt({ actie })
}
