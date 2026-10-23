import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { cent, plus } from '../geld/cent'
import { btwUitInclusief } from '../geld/btw'
import type { BtwProcent } from '../geld/btw-tarieven'
import { datum } from '../contract/datum'
import { bouwFactuur, periodeTekst, procentInHonderdsten, type FactuurOpbouwInvoer, type Korting } from './opbouw'

const d = datum
const maart = { van: d('2026-03-01'), tot: d('2026-04-01') }
const basis: FactuurOpbouwInvoer = {
  plan: { naam: 'Onbeperkt sporten', bedrag: cent(4000), btwProcent: 9 },
  periode: maart,
  deel: null,
  kortingen: [],
  gezinskorting: null,
  extraRegels: [],
}

describe('bouwFactuur', () => {
  it('een gewone maand', () => {
    const f = bouwFactuur(basis)
    expect(f.regels).toEqual([{ soort: 'plan', omschrijving: 'Onbeperkt sporten 01-03-2026 t/m 31-03-2026', bedrag: 4000, btwProcent: 9, grondslag: 3670, btw: 330 }])
    expect(f.totalen).toEqual({ grondslag: 3670, btw: 330, totaal: 4000 })
  })

  it('pro rata eerste maand met korting, gezinskorting en inschrijfkosten', () => {
    const f = bouwFactuur({
      ...basis,
      deel: { van: d('2026-03-17'), tot: maart.tot },
      kortingen: [{ soort: 'procent', procent: 10, omschrijving: 'Studentenkorting' }],
      gezinskorting: { procent: 12.5, omschrijving: 'Gezinskorting' },
      extraRegels: [{ omschrijving: 'Inschrijfkosten', bedrag: cent(2500), btwProcent: 21 }],
    })
    expect(f.regels.map((r) => [r.soort, r.bedrag, r.btwProcent])).toEqual([
      ['plan', 1935, 9],
      ['korting', -194, 9],
      ['gezinskorting', -218, 9],
      ['extra', 2500, 21],
    ])
    expect(f.regels[0].omschrijving).toBe('Onbeperkt sporten 17-03-2026 t/m 31-03-2026 (naar rato van € 40,00)')
    expect(f.perTarief.map((u) => [u.procent, u.totaal])).toEqual([
      [9, 1523],
      [21, 2500],
    ])
    expect(f.totalen.totaal).toBe(4023)
  })

  it('een te grote korting maakt de planregel nul, nooit negatief', () => {
    const f = bouwFactuur({ ...basis, kortingen: [{ soort: 'bedrag', bedrag: cent(9999), omschrijving: 'Actie' }], gezinskorting: { procent: 50, omschrijving: 'Gezin' } })
    expect(f.regels.map((r) => r.bedrag)).toEqual([4000, -4000])
    expect(f.totalen.totaal).toBe(0)
  })

  it('weigert foute invoer', () => {
    expect(() => bouwFactuur({ ...basis, plan: { ...basis.plan, bedrag: cent(-1) } })).toThrow()
    expect(() => bouwFactuur({ ...basis, kortingen: [{ soort: 'procent', procent: 101, omschrijving: 'x' }] })).toThrow()
    expect(() => bouwFactuur({ ...basis, kortingen: [{ soort: 'bedrag', bedrag: cent(-5), omschrijving: 'x' }] })).toThrow()
    expect(() => bouwFactuur({ ...basis, extraRegels: [{ omschrijving: 'x', bedrag: cent(-5), btwProcent: 21 }] })).toThrow()
    expect(() => procentInHonderdsten(12.345)).toThrow()
    expect(procentInHonderdsten(12.5)).toBe(1250)
    expect(procentInHonderdsten(33.33)).toBe(3333)
  })

  it('periodeTekst', () => {
    expect(periodeTekst({ van: d('2028-02-01'), tot: d('2028-03-01') })).toBe('01-02-2028 t/m 29-02-2028')
  })

  it('totalen kloppen altijd: grondslag plus btw is totaal, per regel en per tarief, en nooit negatief', () => {
    const tarief = fc.constantFrom<BtwProcent>(0, 9, 21)
    const korting: fc.Arbitrary<Korting> = fc.oneof(
      fc.record({ soort: fc.constant('procent' as const), procent: fc.integer({ min: 0, max: 10000 }).map((h) => h / 100), omschrijving: fc.constant('k') }),
      fc.record({ soort: fc.constant('bedrag' as const), bedrag: fc.integer({ min: 0, max: 100_000 }).map(cent), omschrijving: fc.constant('k') }),
    )
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        tarief,
        fc.integer({ min: 0, max: 31 }),
        fc.array(korting, { maxLength: 4 }),
        fc.option(fc.integer({ min: 0, max: 10000 }).map((h) => h / 100), { nil: null }),
        fc.array(fc.record({ omschrijving: fc.constant('extra'), bedrag: fc.integer({ min: 0, max: 100_000 }).map(cent), btwProcent: tarief }), { maxLength: 3 }),
        (bedrag, p, vanDag, kortingen, gezin, extra) => {
          const deel = vanDag === 0 ? null : { van: datum(`2026-03-${String(vanDag).padStart(2, '0')}`), tot: maart.tot }
          const f = bouwFactuur({ ...basis, plan: { naam: 'Plan', bedrag: cent(bedrag), btwProcent: p }, deel, kortingen, gezinskorting: gezin === null ? null : { procent: gezin, omschrijving: 'Gezin' }, extraRegels: extra })
          for (const r of f.regels) {
            expect(plus(r.grondslag, r.btw)).toBe(r.bedrag)
            expect(btwUitInclusief(r.bedrag, r.btwProcent).btw).toBe(r.btw)
          }
          for (const u of f.perTarief) expect(plus(u.grondslag, u.btw)).toBe(u.totaal)
          expect(plus(f.totalen.grondslag, f.totalen.btw)).toBe(f.totalen.totaal)
          expect(f.totalen.totaal).toBe(f.regels.reduce((s, r) => s + r.bedrag, 0))
          const planEnKorting = f.regels.filter((r) => r.soort !== 'extra').reduce((s, r) => s + r.bedrag, 0)
          expect(planEnKorting >= 0 && planEnKorting <= bedrag).toBe(true)
        },
      ),
    )
  })
})
