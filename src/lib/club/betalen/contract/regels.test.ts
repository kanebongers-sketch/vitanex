import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { dagNummer, datum, laatste, plusDagen, plusMaanden, vanDagNummer, vroegste } from './datum'
import { binnenBedenktijd, controleerVoorwaarden, eindeEersteLooptijd, laatsteContractdag, MAX_OPZEGTERMIJN_DAGEN, vroegsteEinde, WET, wettelijkLaatsteEinde, type ContractVoorwaarden } from './regels'

const d = datum
const goed: ContractVoorwaarden = { eersteLooptijdMaanden: 12, opzegtermijnDagen: 30, verlenging: 'onbepaald', onlineAfsluiten: true, onlineOpzeggen: true }

describe('WET', () => {
  it('heeft voor elke waarde een bron', () => {
    for (const regel of Object.values(WET)) expect(regel.bron.length).toBeGreaterThan(10)
    expect(WET.maxOpzegtermijnMaanden.waarde).toBe(1)
    expect(WET.maxEersteLooptijdMaanden.waarde).toBe(12)
  })
})

describe('controleerVoorwaarden', () => {
  it('keurt een wettig plan goed', () => {
    expect(controleerVoorwaarden(goed)).toEqual([])
    expect(controleerVoorwaarden({ ...goed, eersteLooptijdMaanden: null, opzegtermijnDagen: 0, verlenging: 'geen' })).toEqual([])
    expect(controleerVoorwaarden({ ...goed, onlineAfsluiten: false, onlineOpzeggen: false })).toEqual([])
  })

  it('weigert te lange looptijd, te lange opzegtermijn, verkeerde verlenging en geen online opzeggen', () => {
    const codes = (v: ContractVoorwaarden) => controleerVoorwaarden(v).map((f) => f.code)
    expect(codes({ ...goed, eersteLooptijdMaanden: 13 })).toEqual(['looptijd_te_lang'])
    expect(codes({ ...goed, eersteLooptijdMaanden: 1.5 })).toEqual(['looptijd_ongeldig'])
    expect(codes({ ...goed, eersteLooptijdMaanden: -1 })).toEqual(['looptijd_ongeldig'])
    expect(codes({ ...goed, opzegtermijnDagen: MAX_OPZEGTERMIJN_DAGEN + 1 })).toEqual(['opzegtermijn_te_lang'])
    expect(codes({ ...goed, opzegtermijnDagen: -1 })).toEqual(['opzegtermijn_ongeldig'])
    expect(codes({ ...goed, verlenging: 'zelfde_looptijd' })).toEqual(['verlenging_niet_toegestaan'])
    expect(codes({ ...goed, onlineOpzeggen: false })).toEqual(['online_opzeggen_verplicht'])
  })
})

describe('vroegsteEinde', () => {
  const start = d('2026-01-15')

  it('in de eerste looptijd: niet voor het einde ervan', () => {
    expect(eindeEersteLooptijd(start, goed)).toBe('2027-01-15')
    expect(vroegsteEinde({ start, voorwaarden: goed, opzegdatum: d('2026-03-01') })).toBe('2027-01-15')
  })

  it('kort voor het einde van de eerste looptijd: opzegtermijn loopt door, hooguit een maand', () => {
    expect(vroegsteEinde({ start, voorwaarden: goed, opzegdatum: d('2027-01-01') })).toBe('2027-01-31')
  })

  it('na de eerste looptijd: opzegdatum plus termijn', () => {
    expect(vroegsteEinde({ start, voorwaarden: goed, opzegdatum: d('2027-06-10') })).toBe('2027-07-10')
    expect(vroegsteEinde({ start, voorwaarden: { eersteLooptijdMaanden: null, opzegtermijnDagen: 0 }, opzegdatum: d('2027-06-10') })).toBe('2027-06-10')
  })

  it('een opzegtermijn van 31 dagen wordt in februari begrensd op een maand', () => {
    const v = { eersteLooptijdMaanden: null, opzegtermijnDagen: 31 }
    expect(vroegsteEinde({ start, voorwaarden: v, opzegdatum: d('2027-02-01') })).toBe('2027-03-01')
    expect(vroegsteEinde({ start, voorwaarden: v, opzegdatum: d('2027-01-31') })).toBe('2027-02-28')
    expect(wettelijkLaatsteEinde(d('2028-01-31'))).toBe('2028-02-29')
  })

  it('opzeggen voor de start telt vanaf de start', () => {
    expect(vroegsteEinde({ start, voorwaarden: { eersteLooptijdMaanden: 0, opzegtermijnDagen: 14 }, opzegdatum: d('2026-01-01') })).toBe('2026-01-29')
  })

  it('houdt rekening met een opgeschoven eerste looptijd', () => {
    expect(vroegsteEinde({ start, voorwaarden: goed, opzegdatum: d('2026-03-01'), eindeEersteLooptijdVerschoven: d('2027-02-15') })).toBe('2027-02-15')
  })

  it('nooit eerder dan toegestaan en nooit later dan het wettelijke maximum', () => {
    const VAN = dagNummer(d('2020-01-01'))
    const TOT = dagNummer(d('2040-12-31'))
    fc.assert(
      fc.property(
        fc.integer({ min: VAN, max: TOT }).map(vanDagNummer),
        fc.option(fc.integer({ min: 0, max: 12 }), { nil: null }),
        fc.integer({ min: 0, max: MAX_OPZEGTERMIJN_DAGEN }),
        fc.integer({ min: -60, max: 900 }),
        (s, looptijd, termijn, na) => {
          const v = { eersteLooptijdMaanden: looptijd, opzegtermijnDagen: termijn }
          const opzegdatum = plusDagen(s, na)
          const einde = vroegsteEinde({ start: s, voorwaarden: v, opzegdatum })
          const vanaf = laatste(opzegdatum, s)
          const eerste = eindeEersteLooptijd(s, v)
          // Niet eerder dan toegestaan.
          expect(einde >= vanaf).toBe(true)
          expect(einde >= vroegste(plusDagen(vanaf, termijn), plusMaanden(vanaf, 1))).toBe(true)
          if (eerste !== null) expect(einde >= eerste).toBe(true)
          // Nooit later dan het wettelijke maximum.
          const max = eerste !== null && eerste > plusMaanden(vanaf, 1) ? eerste : plusMaanden(vanaf, 1)
          expect(einde <= max).toBe(true)
          expect(laatsteContractdag(einde) < einde).toBe(true)
        },
      ),
      { numRuns: 2000 },
    )
  })
})

describe('binnenBedenktijd', () => {
  it('14 dagen na afsluiten', () => {
    const op = d('2026-06-20')
    expect(binnenBedenktijd(op, op)).toBe(true)
    expect(binnenBedenktijd(op, d('2026-07-04'))).toBe(true)
    expect(binnenBedenktijd(op, d('2026-07-05'))).toBe(false)
    expect(binnenBedenktijd(op, d('2026-06-19'))).toBe(false)
  })
})
