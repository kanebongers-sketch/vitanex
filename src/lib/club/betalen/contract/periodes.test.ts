import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { cent, plus, som, type Cent } from '../geld/cent'
import { dagenTussen, dagNummer, datum, plusDagen, plusMaanden, vanDagNummer, type Datum } from './datum'
import {
  bedragenPerSegment,
  controleerPauzes,
  dagenIn,
  INTERVALLEN,
  periodeStart,
  periodeVoor,
  proRata,
  schema,
  splitsOpDatum,
  verschovenEinde,
  volgendePeriodeStart,
  type Interval,
  type Pauze,
  type Segment,
} from './periodes'

const d = datum
const VAN_2020 = dagNummer(d('2020-01-01'))
const TOT_2040 = dagNummer(d('2040-12-31'))
const datumArb = fc.integer({ min: VAN_2020, max: TOT_2040 }).map(vanDagNummer)
const intervalArb = fc.constantFrom<Interval>(...INTERVALLEN)
const bedragArb = fc.integer({ min: 0, max: 1_000_000 }).map(cent)

describe('periodeStart en periodeVoor', () => {
  it('maand vanaf 31 januari: februari geklemd, maart weer de 31e', () => {
    const a = d('2026-01-31')
    expect([0, 1, 2, 3].map((k) => periodeStart(a, 'maand', k))).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30'])
    expect(periodeStart(d('2028-01-31'), 'maand', 1)).toBe('2028-02-29')
  })

  it('week, vier weken, kwartaal en jaar', () => {
    const a = d('2026-01-01')
    expect(periodeStart(a, 'week', 1)).toBe('2026-01-08')
    expect(periodeStart(a, 'vier_weken', 1)).toBe('2026-01-29')
    expect(periodeStart(a, 'kwartaal', 1)).toBe('2026-04-01')
    expect(periodeStart(a, 'jaar', 1)).toBe('2027-01-01')
    expect(periodeStart(d('2024-02-29'), 'jaar', 1)).toBe('2025-02-28')
    expect(periodeStart(d('2024-02-29'), 'jaar', 4)).toBe('2028-02-29')
  })

  it('periodeVoor vindt de juiste periode, ook rond een geklemde maand', () => {
    const a = d('2026-01-31')
    expect(periodeVoor(a, 'maand', d('2026-02-27'))).toEqual({ van: '2026-01-31', tot: '2026-02-28' })
    expect(periodeVoor(a, 'maand', d('2026-02-28'))).toEqual({ van: '2026-02-28', tot: '2026-03-31' })
    expect(periodeVoor(a, 'maand', d('2026-03-30'))).toEqual({ van: '2026-02-28', tot: '2026-03-31' })
    expect(volgendePeriodeStart(a, 'maand', d('2026-01-31'))).toBe('2026-02-28')
    expect(() => periodeVoor(a, 'maand', d('2026-01-30'))).toThrow()
  })

  it('periodeVoor: de datum valt altijd in de periode en de periode is een periode van het schema', () => {
    fc.assert(
      fc.property(datumArb, fc.integer({ min: 0, max: 3000 }), intervalArb, (anker, extra, interval) => {
        const x = plusDagen(anker, extra)
        const p = periodeVoor(anker, interval, x)
        expect(p.van <= x && x < p.tot).toBe(true)
        expect(volgendePeriodeStart(anker, interval, p.van)).toBe(p.tot)
        expect(periodeVoor(anker, interval, p.van)).toEqual(p)
      }),
    )
  })
})

describe('pro rata', () => {
  it('voorbeelden', () => {
    const p = { van: d('2026-02-01'), tot: d('2026-03-01') }
    expect(dagenIn(p)).toBe(28)
    expect(splitsOpDatum(cent(4000), p, d('2026-02-15'))).toEqual([2000, 2000])
    expect(splitsOpDatum(cent(4000), p, d('2026-02-01'))).toEqual([0, 4000])
    expect(splitsOpDatum(cent(4000), p, d('2026-03-01'))).toEqual([4000, 0])
    expect(proRata(cent(3100), { van: d('2026-01-01'), tot: d('2026-02-01') }, { van: d('2026-01-01'), tot: d('2026-01-02') })).toBe(100)
    expect(proRata(cent(1000), p, p)).toBe(1000)
    expect(() => splitsOpDatum(cent(1), p, d('2026-03-02'))).toThrow()
    expect(() => proRata(cent(1), p, { van: d('2026-02-10'), tot: d('2026-02-05') })).toThrow()
  })

  it('oud plus nieuw is precies een volle periode, voor elke datum van 2020 tot en met 2040', () => {
    const ankers = [d('2019-12-31'), d('2019-01-29'), d('2016-02-29'), d('2019-11-30')]
    const bedragen = [cent(1), cent(3999), cent(4000), cent(12345), cent(100_000)]
    for (const interval of INTERVALLEN) {
      for (const anker of ankers) {
        for (let n = VAN_2020; n <= TOT_2040; n++) {
          const x = vanDagNummer(n)
          const p = periodeVoor(anker, interval, x)
          for (const b of bedragen) {
            const [oud, nieuw] = splitsOpDatum(b, p, x)
            if (plus(oud, nieuw) !== b || oud < 0 || nieuw < 0) throw new Error(`Fout bij ${interval} ${anker} ${x} ${b}`)
          }
        }
      }
    }
  })

  it('oud plus nieuw is een volle periode bij willekeurige bedragen, en het eerste deel is proRata', () => {
    fc.assert(
      fc.property(datumArb, datumArb, intervalArb, bedragArb, (a, b, interval, bedrag) => {
        const anker = a <= b ? a : b
        const x = a <= b ? b : a
        const p = periodeVoor(anker, interval, x)
        const [oud, nieuw] = splitsOpDatum(bedrag, p, x)
        expect(plus(oud, nieuw)).toBe(bedrag)
        expect(oud).toBe(proRata(bedrag, p, { van: p.van, tot: x }))
      }),
    )
  })
})

// ─── Schema met pauzes ──────────────────────────────────────────────────────

interface PauzeStap {
  gat: number
  lengte: number
  schuift: boolean
}

function bouwPauzes(anker: Datum, stappen: readonly PauzeStap[]): Pauze[] {
  let cursor = anker
  return stappen.map((s) => {
    const van = plusDagen(cursor, s.gat)
    const tot = plusDagen(van, s.lengte)
    cursor = tot
    return { van, tot, schuiftContract: s.schuift }
  })
}

const pauzeStappen = fc.array(fc.record({ gat: fc.integer({ min: 0, max: 200 }), lengte: fc.integer({ min: 1, max: 90 }), schuift: fc.boolean() }), { maxLength: 6 })

function controleerAansluiting(segs: readonly Segment[], anker: Datum): void {
  expect(segs.length).toBeGreaterThan(0)
  expect(segs[0].van).toBe(anker)
  for (let i = 0; i < segs.length; i++) {
    expect(segs[i].van < segs[i].tot).toBe(true)
    if (i > 0) expect(segs[i].van).toBe(segs[i - 1].tot)
  }
}

describe('schema', () => {
  it('zonder pauzes is elk stuk een volle periode', () => {
    const segs = schema({ anker: d('2026-01-31'), interval: 'maand', pauzes: [], tot: d('2026-05-01'), einde: null })
    expect(segs.map((s) => [s.van, s.tot])).toEqual([
      ['2026-01-31', '2026-02-28'],
      ['2026-02-28', '2026-03-31'],
      ['2026-03-31', '2026-04-30'],
      ['2026-04-30', '2026-05-31'],
    ])
    expect(bedragenPerSegment(cent(4000), segs)).toEqual([4000, 4000, 4000, 4000])
  })

  it('schuivende pauze: periode onderbroken, rest na de pauze, schema en einde schuiven op', () => {
    const pauzes: Pauze[] = [{ van: d('2026-03-11'), tot: d('2026-03-21'), schuiftContract: true }]
    const segs = schema({ anker: d('2026-03-01'), interval: 'maand', pauzes, tot: d('2026-06-01'), einde: d('2026-06-01') })
    expect(segs.map((s) => [s.soort, s.van, s.tot, s.periodeNummer])).toEqual([
      ['periode', '2026-03-01', '2026-03-11', 0],
      ['pauze', '2026-03-11', '2026-03-21', 0],
      ['periode', '2026-03-21', '2026-04-11', 0],
      ['periode', '2026-04-11', '2026-05-11', 1],
      ['periode', '2026-05-11', '2026-06-11', 2],
    ])
    expect(verschovenEinde(d('2026-06-01'), pauzes)).toBe('2026-06-11')
    const bedragen = bedragenPerSegment(cent(3100), segs)
    expect(bedragen[1]).toBe(0)
    expect(plus(bedragen[0], bedragen[2])).toBe(3100)
  })

  it('niet schuivende pauze: schema blijft, pauzedagen worden niet betaald', () => {
    const pauzes: Pauze[] = [{ van: d('2026-03-25'), tot: d('2026-04-08'), schuiftContract: false }]
    const segs = schema({ anker: d('2026-03-01'), interval: 'maand', pauzes, tot: d('2026-05-01'), einde: null })
    expect(segs.map((s) => [s.soort, s.van, s.tot, s.periodeNummer])).toEqual([
      ['periode', '2026-03-01', '2026-03-25', 0],
      ['pauze', '2026-03-25', '2026-04-01', 0],
      ['pauze', '2026-04-01', '2026-04-08', 1],
      ['periode', '2026-04-08', '2026-05-01', 1],
    ])
    expect(bedragenPerSegment(cent(3100), segs)).toEqual([2400, 0, 0, 2377])
  })

  it('kapt af op het contracteinde en rekent de laatste periode naar rato', () => {
    const segs = schema({ anker: d('2026-01-01'), interval: 'maand', pauzes: [], tot: d('2030-01-01'), einde: d('2026-03-16') })
    expect(segs.map((s) => [s.van, s.tot])).toEqual([
      ['2026-01-01', '2026-02-01'],
      ['2026-02-01', '2026-03-01'],
      ['2026-03-01', '2026-03-16'],
    ])
    expect(bedragenPerSegment(cent(3100), segs)).toEqual([3100, 3100, 1500])
  })

  it('weigert overlappende of verkeerde pauzes', () => {
    const a = d('2026-01-01')
    expect(controleerPauzes(a, [{ van: d('2025-12-31'), tot: d('2026-01-05'), schuiftContract: false }])).not.toBeNull()
    expect(controleerPauzes(a, [{ van: d('2026-01-05'), tot: d('2026-01-05'), schuiftContract: false }])).not.toBeNull()
    expect(
      controleerPauzes(a, [
        { van: d('2026-01-05'), tot: d('2026-01-10'), schuiftContract: false },
        { van: d('2026-01-09'), tot: d('2026-01-12'), schuiftContract: true },
      ]),
    ).not.toBeNull()
    expect(() => schema({ anker: a, interval: 'maand', pauzes: [{ van: d('2026-01-05'), tot: d('2026-01-01'), schuiftContract: true }], tot: d('2026-06-01'), einde: null })).toThrow()
  })

  it('60 maanden met pauzes: geen gaten, geen overlap, en het geld per periode klopt', () => {
    fc.assert(
      fc.property(datumArb, intervalArb, pauzeStappen, bedragArb, (anker, interval, stappen, bedrag) => {
        const pauzes = bouwPauzes(anker, stappen)
        const tot = plusMaanden(anker, 60)
        const segs = schema({ anker, interval, pauzes, tot, einde: null })
        controleerAansluiting(segs, anker)
        expect(segs[segs.length - 1].tot >= tot).toBe(true)

        // Elke dag van een pauze is een pauzestuk, en geen pauzestuk buiten een pauze.
        const pauzeDagen = segs.filter((s) => s.soort === 'pauze').reduce((t, s) => t + dagenTussen(s.van, s.tot), 0)
        const verwacht = pauzes.reduce((t, p) => t + Math.max(0, dagenTussen(p.van, p.tot < segs[segs.length - 1].tot ? p.tot : segs[segs.length - 1].tot)), 0)
        expect(pauzeDagen).toBe(verwacht)

        // Volgnummers lopen op zonder sprong, en per periode tellen de dagen op tot de volle lengte.
        const bedragen = bedragenPerSegment(bedrag, segs)
        const nummers = [...new Set(segs.map((s) => s.periodeNummer))]
        expect(nummers).toEqual(nummers.map((_, i) => i))
        for (const nr of nummers) {
          const stukken = segs.map((s, i) => ({ s, b: bedragen[i] })).filter(({ s }) => s.periodeNummer === nr)
          const tellend = stukken.filter(({ s }) => s.teltMee).reduce((t, { s }) => t + dagenTussen(s.van, s.tot), 0)
          expect(tellend).toBe(stukken[0].s.periodeDagen)
          const betaald: Cent = som(stukken.map(({ b }) => b))
          const zonderPauze = stukken.every(({ s }) => s.soort === 'periode')
          if (zonderPauze) expect(betaald).toBe(bedrag)
          else expect(betaald <= bedrag).toBe(true)
        }
        segs.forEach((s, i) => {
          if (s.soort === 'pauze') expect(bedragen[i]).toBe(0)
        })
      }),
      { numRuns: 300 },
    )
  })

  it('60 maanden met een einde: stopt precies op het opgeschoven einde', () => {
    fc.assert(
      fc.property(datumArb, intervalArb, pauzeStappen, fc.integer({ min: 1, max: 60 }), (anker, interval, stappen, maanden) => {
        const pauzes = bouwPauzes(anker, stappen)
        const einde = plusMaanden(anker, maanden)
        const segs = schema({ anker, interval, pauzes, tot: plusMaanden(anker, 120), einde })
        controleerAansluiting(segs, anker)
        expect(segs[segs.length - 1].tot).toBe(verschovenEinde(einde, pauzes))
      }),
      { numRuns: 300 },
    )
  })
})
