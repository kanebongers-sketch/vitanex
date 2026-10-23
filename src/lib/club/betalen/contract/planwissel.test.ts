import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { cent, plus } from '../geld/cent'
import { dagenTussen, dagNummer, datum, plusDagen, vanDagNummer } from './datum'
import { INTERVALLEN, periodeVoor, type Interval } from './periodes'
import { magCrediteren, maxCredit, planwissel } from './planwissel'

const d = datum
const maart = { van: d('2026-03-01'), tot: d('2026-04-01') }

describe('planwissel', () => {
  it('halverwege maart van 31 naar 62 euro', () => {
    const u = planwissel({ periode: maart, wisselDatum: d('2026-03-17'), oudGefactureerd: cent(3100), alGecrediteerd: cent(0), nieuwBedragVoorPeriode: cent(6200) })
    expect(u).toEqual({ credit: 1500, debet: 3000, verschil: 1500, oudGebruikt: 1600 })
  })

  it('wissel op de eerste dag: alles terug, alles nieuw', () => {
    const u = planwissel({ periode: maart, wisselDatum: maart.van, oudGefactureerd: cent(3100), alGecrediteerd: cent(0), nieuwBedragVoorPeriode: cent(2000) })
    expect(u).toEqual({ credit: 3100, debet: 2000, verschil: -1100, oudGebruikt: 0 })
  })

  it('credit is begrensd door wat al gecrediteerd is', () => {
    const u = planwissel({ periode: maart, wisselDatum: d('2026-03-02'), oudGefactureerd: cent(3100), alGecrediteerd: cent(3000), nieuwBedragVoorPeriode: cent(0) })
    expect(u.credit).toBe(100)
  })

  it('weigert foute invoer', () => {
    const basis = { periode: maart, wisselDatum: d('2026-03-10'), oudGefactureerd: cent(3100), alGecrediteerd: cent(0), nieuwBedragVoorPeriode: cent(3100) }
    expect(() => planwissel({ ...basis, oudGefactureerd: cent(-1) })).toThrow()
    expect(() => planwissel({ ...basis, alGecrediteerd: cent(4000) })).toThrow()
    expect(() => planwissel({ ...basis, wisselDatum: d('2026-04-02') })).toThrow()
  })

  it('creditnota nooit meer dan gefactureerd, en gebruikt plus credit is het oude bedrag', () => {
    const VAN = dagNummer(d('2020-01-01'))
    fc.assert(
      fc.property(
        fc.integer({ min: VAN, max: dagNummer(d('2040-12-31')) }).map(vanDagNummer),
        fc.constantFrom<Interval>(...INTERVALLEN),
        fc.integer({ min: 0, max: 400 }),
        fc.integer({ min: 0, max: 500_000 }),
        fc.integer({ min: 0, max: 500_000 }),
        fc.integer({ min: 0, max: 100 }),
        (anker, interval, na, oud, nieuw, alProcent) => {
          const periode = periodeVoor(anker, interval, plusDagen(anker, na))
          const wissel = plusDagen(periode.van, na % (dagenTussen(periode.van, periode.tot) + 1))
          const al = cent(Math.floor((oud * alProcent) / 1000))
          const u = planwissel({ periode, wisselDatum: wissel, oudGefactureerd: cent(oud), alGecrediteerd: al, nieuwBedragVoorPeriode: cent(nieuw) })
          expect(u.credit >= 0).toBe(true)
          expect(plus(al, u.credit) <= oud).toBe(true)
          expect(u.debet >= 0 && u.debet <= nieuw).toBe(true)
          if (al === 0) expect(plus(u.oudGebruikt, u.credit)).toBe(oud)
        },
      ),
    )
  })
})

describe('crediteren', () => {
  it('mag nooit boven het gefactureerde bedrag', () => {
    expect(magCrediteren(cent(1000), cent(400), cent(600))).toBe(true)
    expect(magCrediteren(cent(1000), cent(400), cent(601))).toBe(false)
    expect(magCrediteren(cent(1000), cent(0), cent(0))).toBe(false)
    expect(maxCredit(cent(1000), cent(400))).toBe(600)
    expect(maxCredit(cent(1000), cent(1200))).toBe(0)
  })

  it('een reeks creditnota tot maxCredit blijft altijd binnen het gefactureerde', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1_000_000 }), fc.array(fc.integer({ min: 1, max: 500_000 }), { maxLength: 20 }), (gef, pogingen) => {
        let al = cent(0)
        for (const p of pogingen) {
          if (magCrediteren(cent(gef), al, cent(p))) al = plus(al, cent(p))
          expect(al <= gef).toBe(true)
          expect(maxCredit(cent(gef), al)).toBe(gef - al)
        }
      }),
    )
  })
})
