// De prijsregel en de verwijderregel in de opslag, met een nep-Supabase: welke
// tabellen worden geraakt, met welke waarden, en altijd op user_id.
import { describe, expect, it } from 'vitest'
import { nepSupabase, type Vraag } from '@/lib/club/beheerders/nep-supabase'
import { leesPlanInvoer, type PlanInvoer } from './invoer'
import { verwijderPlan, wijzigPlan } from './opslag'

const GYM = 'de000000-0000-4000-8000-0000000000c1'
const PLAN_ID = '44444444-4444-4444-8444-444444444444'
const NU = new Date('2026-10-23T10:00:00Z')

const PLAN_RIJ = {
  id: PLAN_ID, vorm_id: '55555555-5555-4555-8555-555555555555', naam: '12 maanden', actief: true, interval_soort: 'maand', bedrag_cent: 3995, btw_procent: 9,
  contract_maanden: 12, opzegtermijn_dagen: 30, verlenging: 'onbepaald', proef_dagen: 0, inschrijfkosten_cent: 0, vestigingen: null, doelgroep: 'iedereen',
  vereist_bewijs: false, factuur_dag: null, pro_rata_eerste: true, volgorde: 0,
}

function invoer(bedragCent: number): PlanInvoer {
  const uit = leesPlanInvoer({ naam: '12 maanden', interval: 'maand', bedragCent, btwProcent: 9, contractMaanden: 12, opzegtermijnDagen: 30 }, ['budel'])
  if (!uit.ok) throw new Error(uit.fout)
  return uit.waarde
}

function db(contracten: number) {
  return nepSupabase((v: Vraag) => {
    if (v.tabel === 'club_betalen_plannen' && v.actie === 'select') return { data: PLAN_RIJ, error: null }
    if (v.tabel === 'club_betalen_plannen' && v.actie === 'update') return { data: [{ id: PLAN_ID }], error: null }
    if (v.tabel === 'club_betalen_contracten') return { data: Array.from({ length: contracten }, (_, i) => ({ id: String(i) })), error: null }
    if (v.tabel === 'club_betalen_plan_prijzen' && v.actie === 'select') return { data: [], error: null }
    return { data: null, error: null }
  })
}

function opTenant(vragen: Vraag[]): void {
  for (const v of vragen) {
    const filter = v.filters.some(([op, k, w]) => op === 'eq' && k === 'user_id' && w === GYM)
    const payload = typeof v.waarde === 'object' && v.waarde !== null && (v.waarde as Record<string, unknown>).user_id === GYM
    expect(filter || payload, `${v.tabel} ${v.actie} zonder user_id`).toBe(true)
  }
}

describe('wijzigPlan: de prijsregel', () => {
  it('met contracten: plan-rij houdt de oude prijs en er komt een prijsversie', async () => {
    const { admin, vragen } = db(3)
    const uit = await wijzigPlan({ admin, userId: GYM, naam: 'Kane' }, PLAN_ID, invoer(4495), '2026-12-01', NU)
    expect(uit).toEqual({ ok: true, waarde: { id: PLAN_ID, prijs: 'versie', geldigVanaf: '2026-12-01' } })
    const update = vragen.find((v) => v.tabel === 'club_betalen_plannen' && v.actie === 'update')
    expect((update?.waarde as Record<string, unknown>).bedrag_cent).toBe(3995)
    const versie = vragen.find((v) => v.tabel === 'club_betalen_plan_prijzen' && v.actie === 'insert')
    expect(versie?.waarde).toMatchObject({ user_id: GYM, plan_id: PLAN_ID, bedrag_cent: 4495, btw_procent: 9, geldig_vanaf: '2026-12-01' })
    opTenant(vragen)
  })

  it('met contracten en zonder ingangsdatum: geweigerd, niets gewijzigd', async () => {
    const { admin, vragen } = db(1)
    const uit = await wijzigPlan({ admin, userId: GYM, naam: 'Kane' }, PLAN_ID, invoer(4495), null, NU)
    expect(uit.ok).toBe(false)
    expect(vragen.some((v) => v.actie === 'update' || v.actie === 'insert')).toBe(false)
  })

  it('zonder contracten: de prijs gaat direct op het plan, geen versie', async () => {
    const { admin, vragen } = db(0)
    const uit = await wijzigPlan({ admin, userId: GYM, naam: 'Kane' }, PLAN_ID, invoer(4495), null, NU)
    expect(uit.ok && uit.waarde.prijs).toBe('direct')
    const update = vragen.find((v) => v.tabel === 'club_betalen_plannen' && v.actie === 'update')
    expect((update?.waarde as Record<string, unknown>).bedrag_cent).toBe(4495)
    expect(vragen.some((v) => v.tabel === 'club_betalen_plan_prijzen' && v.actie === 'insert')).toBe(false)
    opTenant(vragen)
  })
})

describe('verwijderPlan', () => {
  it('met contracten: uit de verkoop, nooit verwijderd', async () => {
    const { admin, vragen } = db(2)
    const uit = await verwijderPlan({ admin, userId: GYM, naam: 'Kane' }, PLAN_ID)
    expect(uit).toEqual({ ok: true, waarde: { uitkomst: 'inactief' } })
    expect(vragen.some((v) => v.tabel === 'club_betalen_plannen' && v.actie === 'delete')).toBe(false)
    expect(vragen.find((v) => v.tabel === 'club_betalen_plannen' && v.actie === 'update')?.waarde).toMatchObject({ actief: false })
    opTenant(vragen)
  })

  it('zonder contracten: weg', async () => {
    const { admin, vragen } = db(0)
    const uit = await verwijderPlan({ admin, userId: GYM, naam: 'Kane' }, PLAN_ID)
    expect(uit).toEqual({ ok: true, waarde: { uitkomst: 'weg' } })
    expect(vragen.some((v) => v.tabel === 'club_betalen_plannen' && v.actie === 'delete')).toBe(true)
    opTenant(vragen)
  })
})
