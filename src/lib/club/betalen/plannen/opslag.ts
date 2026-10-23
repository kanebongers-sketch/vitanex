// ─── Club, betalen: plannen lezen en schrijven (SERVER-ONLY) ────────────────
// Elke query filtert op user_id van de sportschool (t.userId). Prijsregel: heeft
// een plan contracten, dan komt een nieuwe prijs als versie in
// club_betalen_plan_prijzen en blijft de plan-rij staan (zie prijsversie.ts).
// Een plan met contracten wordt nooit verwijderd, alleen uit de verkoop gehaald.

import type { SupabaseClient } from '@supabase/supabase-js'
import { logActie, type ClubSchrijver } from '@/lib/club/toegang'
import { gelukt, mislukt, type Resultaat } from '@/lib/club/rooster/basis-opslag'
import { vandaagInAmsterdam } from '../contract/datum'
import { PLAN_KOLOMMEN, PRIJS_KOLOMMEN, planUitRij, prijsUitRij, rijenNaar, sorteerPlannen, type Plan, type PlanPrijs } from './model'
import { planRij, type PlanInvoer } from './invoer'
import { besluitPrijs } from './prijsversie'

const OPSLAAN_MIS = 'Opslaan is niet gelukt. Probeer het opnieuw.'
const PLAN_WEG = 'Dit plan bestaat niet.'
const PLAN_DUBBEL = 'Deze lidmaatschapsvorm heeft al een plan met deze naam.'
const PAGINA = 1000
const MAX_CONTRACTEN = 100_000

function log(wat: string, code: string | undefined, bericht: string): void {
  console.error(`[club/betalen/plannen] ${wat} mislukt`, code ?? '', bericht)
}

export async function haalPlannen(admin: SupabaseClient, userId: string): Promise<Plan[] | null> {
  const { data, error } = await admin.from('club_betalen_plannen').select(PLAN_KOLOMMEN).eq('user_id', userId).order('volgorde').limit(1000)
  if (error) {
    log('plannen lezen', error.code, error.message)
    return null
  }
  return sorteerPlannen(rijenNaar(data, planUitRij))
}

export async function haalPrijzen(admin: SupabaseClient, userId: string): Promise<PlanPrijs[] | null> {
  const { data, error } = await admin.from('club_betalen_plan_prijzen').select(PRIJS_KOLOMMEN).eq('user_id', userId).order('geldig_vanaf').limit(5000)
  if (error) {
    log('prijsversies lezen', error.code, error.message)
    return null
  }
  return rijenNaar(data, prijsUitRij)
}

/** Aantal contracten per plan (alle statussen), in pagina's. */
export async function telContractenPerPlan(admin: SupabaseClient, userId: string): Promise<Map<string, number> | null> {
  const telling = new Map<string, number>()
  for (let van = 0; van < MAX_CONTRACTEN; van += PAGINA) {
    const { data, error } = await admin.from('club_betalen_contracten').select('id, plan_id').eq('user_id', userId).order('id').range(van, van + PAGINA - 1)
    if (error) {
      log('contracten tellen', error.code, error.message)
      return null
    }
    for (const r of data ?? []) {
      const plan = typeof r.plan_id === 'string' ? r.plan_id : null
      if (plan) telling.set(plan, (telling.get(plan) ?? 0) + 1)
    }
    if (!data || data.length < PAGINA) break
  }
  return telling
}

async function heeftContracten(admin: SupabaseClient, userId: string, planId: string): Promise<boolean | null> {
  const { data, error } = await admin.from('club_betalen_contracten').select('id').eq('user_id', userId).eq('plan_id', planId).limit(1)
  if (error) {
    log('contracten zoeken', error.code, error.message)
    return null
  }
  return (data ?? []).length > 0
}

async function haalPlan(admin: SupabaseClient, userId: string, id: string): Promise<Plan | null | 'fout'> {
  const { data, error } = await admin.from('club_betalen_plannen').select(PLAN_KOLOMMEN).eq('user_id', userId).eq('id', id).maybeSingle()
  if (error) {
    log('plan lezen', error.code, error.message)
    return 'fout'
  }
  return data ? planUitRij(data) : null
}

async function prijzenVan(admin: SupabaseClient, userId: string, planId: string): Promise<PlanPrijs[] | null> {
  const { data, error } = await admin.from('club_betalen_plan_prijzen').select(PRIJS_KOLOMMEN).eq('user_id', userId).eq('plan_id', planId)
  if (error) {
    log('prijsversies van plan lezen', error.code, error.message)
    return null
  }
  return rijenNaar(data, prijsUitRij)
}

/** Hoort deze lidmaatschapsvorm bij de sportschool? */
export async function vormVanSportschool(admin: SupabaseClient, userId: string, vormId: string): Promise<boolean | null> {
  const { data, error } = await admin.from('club_lidmaatschapsvormen').select('id').eq('user_id', userId).eq('id', vormId).maybeSingle()
  if (error) {
    log('vorm zoeken', error.code, error.message)
    return null
  }
  return data !== null
}

export async function maakPlan(t: ClubSchrijver, vormId: string, p: PlanInvoer): Promise<Resultaat<{ id: string }>> {
  const vorm = await vormVanSportschool(t.admin, t.userId, vormId)
  if (vorm === null) return mislukt(OPSLAAN_MIS, 500)
  if (!vorm) return mislukt('Deze lidmaatschapsvorm bestaat niet.', 404)
  const { data, error } = await t.admin.from('club_betalen_plannen').insert({ user_id: t.userId, vorm_id: vormId, ...planRij(p) }).select('id').single()
  if (error) {
    if (error.code === '23505') return mislukt(PLAN_DUBBEL, 409)
    log('plan toevoegen', error.code, error.message)
    return mislukt(OPSLAAN_MIS, 500)
  }
  await logActie(t, 'Plan toegevoegd', p.naam, null)
  return gelukt({ id: String(data.id) })
}

export type PlanWijziging = { id: string; prijs: 'gelijk' | 'direct' | 'versie'; geldigVanaf: string | null }

/** Een prijsversie bewaren; een versie op dezelfde dag wordt vervangen. */
async function bewaarVersie(t: ClubSchrijver, planId: string, p: PlanInvoer, vanaf: string): Promise<boolean> {
  const versie = { user_id: t.userId, plan_id: planId, bedrag_cent: p.bedragCent, btw_procent: p.btwProcent, geldig_vanaf: vanaf }
  const { error } = await t.admin.from('club_betalen_plan_prijzen').insert(versie)
  if (!error) return true
  if (error.code !== '23505') {
    log('prijsversie bewaren', error.code, error.message)
    return false
  }
  const { error: fout } = await t.admin
    .from('club_betalen_plan_prijzen')
    .update({ bedrag_cent: p.bedragCent, btw_procent: p.btwProcent })
    .eq('user_id', t.userId)
    .eq('plan_id', planId)
    .eq('geldig_vanaf', vanaf)
  if (fout) log('prijsversie vervangen', fout.code, fout.message)
  return !fout
}

/** Een plan aanpassen. `vanaf` is de ingangsdatum van een nieuwe prijs als het plan al contracten heeft. */
export async function wijzigPlan(t: ClubSchrijver, id: string, p: PlanInvoer, vanaf: unknown, nu: Date = new Date()): Promise<Resultaat<PlanWijziging>> {
  const [plan, versies, contracten] = await Promise.all([haalPlan(t.admin, t.userId, id), prijzenVan(t.admin, t.userId, id), heeftContracten(t.admin, t.userId, id)])
  if (plan === 'fout' || versies === null || contracten === null) return mislukt(OPSLAAN_MIS, 500)
  if (!plan) return mislukt(PLAN_WEG, 404)
  const besluit = besluitPrijs({ plan, versies, nieuw: p, heeftContracten: contracten, vanaf, vandaag: vandaagInAmsterdam(nu) })
  if (besluit.soort === 'fout') return mislukt(besluit.fout, 400)
  const rij = planRij(p)
  // Met contracten blijft de prijs van de plan-rij staan: de nieuwe prijs is een versie.
  const bijwerken = besluit.soort === 'direct' ? rij : { ...rij, bedrag_cent: plan.bedragCent, btw_procent: plan.btwProcent }
  const { data, error } = await t.admin
    .from('club_betalen_plannen')
    .update({ ...bijwerken, gewijzigd_op: nu.toISOString() })
    .eq('user_id', t.userId)
    .eq('id', id)
    .select('id')
  if (error) {
    if (error.code === '23505') return mislukt(PLAN_DUBBEL, 409)
    log('plan wijzigen', error.code, error.message)
    return mislukt(OPSLAAN_MIS, 500)
  }
  if (!data || data.length === 0) return mislukt(PLAN_WEG, 404)
  const geldigVanaf = besluit.soort === 'versie' ? besluit.geldigVanaf : null
  if (geldigVanaf && !(await bewaarVersie(t, id, p, geldigVanaf))) return mislukt('Het plan is bewaard, maar de nieuwe prijs niet. Probeer het opnieuw.', 500)
  await logActie(t, geldigVanaf ? `Nieuwe prijs gepland vanaf ${geldigVanaf}` : 'Plan aangepast', p.naam, null)
  return gelukt({ id, prijs: besluit.soort, geldigVanaf })
}

export type PlanWeg = 'weg' | 'inactief'

/** Verwijderen kan alleen zonder contracten; met contracten gaat het plan uit de verkoop. */
export async function verwijderPlan(t: ClubSchrijver, id: string): Promise<Resultaat<{ uitkomst: PlanWeg }>> {
  const [plan, contracten] = await Promise.all([haalPlan(t.admin, t.userId, id), heeftContracten(t.admin, t.userId, id)])
  if (plan === 'fout' || contracten === null) return mislukt('Verwijderen is niet gelukt. Probeer het opnieuw.', 500)
  if (!plan) return mislukt(PLAN_WEG, 404)
  if (!contracten) {
    const { error } = await t.admin.from('club_betalen_plannen').delete().eq('user_id', t.userId).eq('id', id)
    if (!error) {
      await logActie(t, 'Plan verwijderd', plan.naam, null)
      return gelukt({ uitkomst: 'weg' })
    }
    // 23503: een gezin of contract verwijst er nog naar (via een korting): dan uit de verkoop.
    if (error.code !== '23503') {
      log('plan verwijderen', error.code, error.message)
      return mislukt('Verwijderen is niet gelukt. Probeer het opnieuw.', 500)
    }
  }
  const { error } = await t.admin.from('club_betalen_plannen').update({ actief: false, gewijzigd_op: new Date().toISOString() }).eq('user_id', t.userId).eq('id', id)
  if (error) {
    log('plan uit de verkoop halen', error.code, error.message)
    return mislukt('Uit de verkoop halen is niet gelukt. Probeer het opnieuw.', 500)
  }
  await logActie(t, 'Plan uit de verkoop gehaald', plan.naam, null)
  return gelukt({ uitkomst: 'inactief' })
}

/** De ingangsdatum van een prijsversie die nog niet is ingegaan, weer intrekken. */
export async function trekPrijsIn(t: ClubSchrijver, planId: string, vanaf: string, nu: Date = new Date()): Promise<Resultaat<{ ingetrokken: true }>> {
  if (vanaf <= vandaagInAmsterdam(nu)) return mislukt('Een prijs die al geldt, kun je niet meer intrekken.', 409)
  const { data, error } = await t.admin.from('club_betalen_plan_prijzen').delete().eq('user_id', t.userId).eq('plan_id', planId).eq('geldig_vanaf', vanaf).select('id')
  if (error) {
    log('prijsversie intrekken', error.code, error.message)
    return mislukt('Intrekken is niet gelukt. Probeer het opnieuw.', 500)
  }
  if (!data || data.length === 0) return mislukt('Deze prijswijziging bestaat niet.', 404)
  await logActie(t, `Prijswijziging per ${vanaf} ingetrokken`, null, null)
  return gelukt({ ingetrokken: true })
}
