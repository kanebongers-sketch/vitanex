import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { datum } from '../contract/datum'
import type { PlanPrijs } from './model'
import { besluitPrijs, komendeVersies, laatstePrijs, prijsOp } from './prijsversie'

const VANDAAG = datum('2026-10-23')
const PLAN = { bedragCent: 3995, btwProcent: 9 as const }
const versie = (geldigVanaf: string, bedragCent: number): PlanPrijs => ({ id: geldigVanaf, planId: 'p', bedragCent, btwProcent: 9, geldigVanaf, aangekondigdOp: null })

describe('besluitPrijs (prijsregel)', () => {
  it('zelfde prijs: niets te doen', () => {
    expect(besluitPrijs({ plan: PLAN, versies: [], nieuw: PLAN, heeftContracten: true, vanaf: null, vandaag: VANDAAG })).toEqual({ soort: 'gelijk' })
  })

  it('zonder contracten: de prijs gaat direct op het plan', () => {
    expect(besluitPrijs({ plan: PLAN, versies: [], nieuw: { ...PLAN, bedragCent: 4495 }, heeftContracten: false, vanaf: null, vandaag: VANDAAG })).toEqual({ soort: 'direct' })
  })

  it('met contracten: een nieuwe prijsversie met een ingangsdatum, nooit direct', () => {
    const nieuw = { ...PLAN, bedragCent: 4495 }
    expect(besluitPrijs({ plan: PLAN, versies: [], nieuw, heeftContracten: true, vanaf: '2026-12-01', vandaag: VANDAAG })).toEqual({ soort: 'versie', geldigVanaf: '2026-12-01' })
    expect(besluitPrijs({ plan: PLAN, versies: [], nieuw, heeftContracten: true, vanaf: null, vandaag: VANDAAG }).soort).toBe('fout')
    expect(besluitPrijs({ plan: PLAN, versies: [], nieuw, heeftContracten: true, vanaf: '2026-10-23', vandaag: VANDAAG }).soort).toBe('fout')
    expect(besluitPrijs({ plan: PLAN, versies: [], nieuw, heeftContracten: true, vanaf: '2028-01-01', vandaag: VANDAAG }).soort).toBe('fout')
  })

  it('ook een ander btw-tarief is een prijswijziging', () => {
    expect(besluitPrijs({ plan: PLAN, versies: [], nieuw: { ...PLAN, btwProcent: 21 }, heeftContracten: true, vanaf: '2026-11-01', vandaag: VANDAAG }).soort).toBe('versie')
  })

  it('vergelijkt met de laatst geplande versie', () => {
    const versies = [versie('2026-12-01', 4495)]
    expect(besluitPrijs({ plan: PLAN, versies, nieuw: { ...PLAN, bedragCent: 4495 }, heeftContracten: true, vanaf: null, vandaag: VANDAAG })).toEqual({ soort: 'gelijk' })
  })

  it('eigenschap: met contracten wordt de plan-rij nooit direct gewijzigd', () => {
    fc.assert(
      fc.property(fc.integer({ min: 50, max: 1_000_000 }), fc.option(fc.constantFrom('2026-10-22', '2026-10-24', '2027-06-01', 'nee')), (bedrag, vanaf) => {
        const b = besluitPrijs({ plan: PLAN, versies: [], nieuw: { ...PLAN, bedragCent: bedrag }, heeftContracten: true, vanaf, vandaag: VANDAAG })
        expect(b.soort).not.toBe('direct')
        if (b.soort === 'versie') expect(b.geldigVanaf > VANDAAG).toBe(true)
      }),
    )
  })
})

describe('prijsOp, laatstePrijs en komendeVersies', () => {
  const versies = [versie('2027-01-01', 4995), versie('2026-11-01', 4495)]
  it('een nieuw contract krijgt de prijs die op zijn startdag geldt', () => {
    expect(prijsOp(PLAN, versies, datum('2026-10-31')).bedragCent).toBe(3995)
    expect(prijsOp(PLAN, versies, datum('2026-11-01')).bedragCent).toBe(4495)
    expect(prijsOp(PLAN, versies, datum('2027-03-01')).bedragCent).toBe(4995)
  })
  it('laatste en komende', () => {
    expect(laatstePrijs(PLAN, versies).bedragCent).toBe(4995)
    expect(laatstePrijs(PLAN, []).bedragCent).toBe(3995)
    expect(komendeVersies(versies, VANDAAG).map((v) => v.geldigVanaf)).toEqual(['2026-11-01', '2027-01-01'])
    expect(komendeVersies(versies, datum('2026-12-15')).map((v) => v.geldigVanaf)).toEqual(['2027-01-01'])
  })
})
