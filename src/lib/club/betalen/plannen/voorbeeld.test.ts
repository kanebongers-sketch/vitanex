import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { datum, plusDagen, vanDagNummer, dagNummer } from '../contract/datum'
import { eersteFactuurdag, planVoorbeeld, type VoorbeeldPlan } from './voorbeeld'

const BASIS: VoorbeeldPlan = {
  interval: 'maand',
  bedragCent: 3000,
  btwProcent: 9,
  contractMaanden: 12,
  opzegtermijnDagen: 30,
  verlenging: 'onbepaald',
  proefDagen: 0,
  inschrijfkostenCent: 0,
  factuurDag: null,
  proRataEerste: true,
}

describe('planVoorbeeld', () => {
  it('zonder factuurdag: eerste incasso op de startdag, het volle bedrag', () => {
    const v = planVoorbeeld(BASIS, datum('2026-10-23'))
    expect(v.eersteIncasso).toMatchObject({ op: '2026-10-23', bedrag: 3000, proRata: false })
    expect(v.volgendeIncasso).toEqual({ op: '2026-11-23', bedrag: 3000 })
    expect(v.vastTot).toBe('2027-10-22')
    // Opzeggen op de startdag: niet eerder klaar dan het einde van de eerste looptijd.
    expect(v.vroegsteLaatsteDag).toBe('2027-10-22')
  })

  it('met inschrijfkosten en proefdagen', () => {
    const v = planVoorbeeld({ ...BASIS, proefDagen: 7, inschrijfkostenCent: 1500 }, datum('2026-10-23'))
    expect(v.betaaltVanaf).toBe('2026-10-30')
    expect(v.eersteIncasso).toMatchObject({ op: '2026-10-30', bedrag: 4500, inschrijfkosten: 1500 })
    // 9 procent btw uit 45 euro: 45 x 9 / 109 = 3,7156 wordt 3,72.
    expect(v.eersteIncasso.btw).toBe(372)
  })

  it('factuurdag met pro rata: alleen de dagen tot de factuurdag', () => {
    const v = planVoorbeeld({ ...BASIS, factuurDag: 1 }, datum('2026-10-23'))
    // 23 oktober tot 1 november = 9 van de 31 dagen: 3000 x 9 / 31 = 870,97 wordt 871.
    expect(v.eersteIncasso).toMatchObject({ op: '2026-10-23', bedrag: 871, proRata: true })
    expect(v.volgendeIncasso).toEqual({ op: '2026-11-01', bedrag: 3000 })
  })

  it('factuurdag zonder pro rata: de dagen ervoor kosten niets', () => {
    const v = planVoorbeeld({ ...BASIS, factuurDag: 1, proRataEerste: false }, datum('2026-10-23'))
    expect(v.eersteIncasso).toMatchObject({ op: '2026-11-01', bedrag: 3000 })
    expect(v.gratisTot).toBe('2026-10-31')
    expect(v.volgendeIncasso.op).toBe('2026-12-01')
  })

  it('flex: opzeggen eindigt na de opzegtermijn', () => {
    const v = planVoorbeeld({ ...BASIS, contractMaanden: null, opzegtermijnDagen: 30 }, datum('2026-10-23'))
    expect(v.vastTot).toBeNull()
    expect(v.vroegsteLaatsteDag).toBe('2026-11-21')
  })

  it('stopt vanzelf bij verlenging geen', () => {
    expect(planVoorbeeld({ ...BASIS, verlenging: 'geen' }, datum('2026-10-23')).stoptVanzelf).toBe(true)
  })

  it('eigenschap: de eerste incasso is nooit meer dan een termijn plus inschrijfkosten en valt nooit voor de start', () => {
    const start = dagNummer(datum('2026-01-01'))
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 800 }),
        fc.option(fc.integer({ min: 1, max: 28 })),
        fc.boolean(),
        fc.integer({ min: 0, max: 60 }),
        fc.constantFrom('maand', 'kwartaal', 'jaar', 'week', 'vier_weken'),
        (dag, factuurDag, proRata, proef, interval) => {
          const d = vanDagNummer(start + dag)
          const plan = { ...BASIS, factuurDag, proRataEerste: proRata, proefDagen: proef, inschrijfkostenCent: 500, interval }
          const v = planVoorbeeld(plan, d)
          expect(v.eersteIncasso.op >= plusDagen(d, proef)).toBe(true)
          expect(v.eersteIncasso.bedrag).toBeLessThanOrEqual(3000 + 500)
          expect(v.eersteIncasso.bedrag).toBeGreaterThanOrEqual(500)
          expect(v.volgendeIncasso.op > v.eersteIncasso.op).toBe(true)
        },
      ),
    )
  })
})

describe('eersteFactuurdag', () => {
  it('dezelfde maand of de volgende', () => {
    expect(eersteFactuurdag(datum('2026-10-01'), 1)).toBe('2026-10-01')
    expect(eersteFactuurdag(datum('2026-10-02'), 1)).toBe('2026-11-01')
    expect(eersteFactuurdag(datum('2026-12-20'), 15)).toBe('2027-01-15')
  })
})
