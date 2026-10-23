import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { cent, plus } from './cent'
import { btwPerTarief, btwTotalen, btwUitInclusief } from './btw'
import { BTW_REGELS, BTW_SLEUTELS, btwProcentVan, isBekendBtwProcent, type BtwProcent } from './btw-tarieven'

const tarief = fc.constantFrom<BtwProcent>(...BTW_SLEUTELS.map((s) => BTW_REGELS[s].procent))

describe('btw-tarieven', () => {
  it('kent 9, 21 en 0 (vrijgesteld), elk met bron', () => {
    expect(btwProcentVan('laag')).toBe(9)
    expect(btwProcentVan('hoog')).toBe(21)
    expect(btwProcentVan('vrijgesteld')).toBe(0)
    for (const s of BTW_SLEUTELS) expect(BTW_REGELS[s].bron.length).toBeGreaterThan(10)
    expect(isBekendBtwProcent(6)).toBe(false)
    expect(isBekendBtwProcent('9')).toBe(false)
  })
})

describe('btwUitInclusief', () => {
  it('rekent bekende voorbeelden', () => {
    expect(btwUitInclusief(cent(4000), 9)).toEqual({ procent: 9, grondslag: 3670, btw: 330, totaal: 4000 })
    expect(btwUitInclusief(cent(12100), 21)).toEqual({ procent: 21, grondslag: 10000, btw: 2100, totaal: 12100 })
    expect(btwUitInclusief(cent(-4000), 9)).toEqual({ procent: 9, grondslag: -3670, btw: -330, totaal: -4000 })
    expect(btwUitInclusief(cent(999), 0)).toEqual({ procent: 0, grondslag: 999, btw: 0, totaal: 999 })
    expect(btwUitInclusief(cent(1), 21).btw).toBe(0)
  })

  it('weigert een onbekend tarief', () => {
    expect(() => btwUitInclusief(cent(100), 6 as BtwProcent)).toThrow()
  })

  it('grondslag plus btw is altijd het bedrag, en de btw zit binnen een halve cent van exact', () => {
    fc.assert(
      fc.property(fc.integer({ min: -10_000_000, max: 10_000_000 }), tarief, (b, p) => {
        const u = btwUitInclusief(cent(b), p)
        expect(plus(u.grondslag, u.btw)).toBe(b)
        expect(Math.abs(u.btw * (100 + p) - b * p) * 2).toBeLessThanOrEqual(100 + p)
      }),
    )
  })
})

describe('btwPerTarief', () => {
  it('splitst per tarief, oplopend, en de totalen kloppen met de regels', () => {
    fc.assert(
      fc.property(fc.array(fc.record({ bedrag: fc.integer({ min: -500_000, max: 500_000 }).map(cent), procent: tarief }), { maxLength: 30 }), (regels) => {
        const per = btwPerTarief(regels)
        const totaal = btwTotalen(per)
        expect(totaal.totaal).toBe(regels.reduce((s, r) => s + r.bedrag, 0))
        expect(plus(totaal.grondslag, totaal.btw)).toBe(totaal.totaal)
        for (const u of per) {
          expect(plus(u.grondslag, u.btw)).toBe(u.totaal)
          const regelsVanTarief = regels.filter((r) => r.procent === u.procent)
          expect(u.btw).toBe(regelsVanTarief.reduce((s, r) => s + btwUitInclusief(r.bedrag, r.procent).btw, 0))
        }
        expect(per.map((u) => u.procent)).toEqual([...per.map((u) => u.procent)].sort((a, b) => a - b))
      }),
    )
  })

  it('geeft een lege lijst zonder regels', () => {
    expect(btwPerTarief([])).toEqual([])
    expect(btwTotalen([])).toEqual({ grondslag: 0, btw: 0, totaal: 0 })
  })
})
