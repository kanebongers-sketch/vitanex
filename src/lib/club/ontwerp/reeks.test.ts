import { describe, expect, it } from 'vitest'
import { bereikVan, bezettingVan, bezoekPerMaand, padVan, ringDeel, rondeDezeWeek, sparkStukken, vorigeMaand } from './reeks'

describe('sparkStukken', () => {
  it('geeft niets zonder waarden', () => {
    expect(sparkStukken([], 100, 20)).toEqual([])
    expect(sparkStukken([null, null], 100, 20)).toEqual([])
  })

  it('breekt de lijn bij een gat in plaats van een nul te verzinnen', () => {
    const stukken = sparkStukken([1, 2, null, 4], 100, 20)
    expect(stukken).toHaveLength(2)
    expect(stukken[0]).toHaveLength(2)
    expect(stukken[1]).toHaveLength(1)
  })

  it('zet de hoogste waarde boven en de laagste onder, binnen de marge', () => {
    const [stuk] = sparkStukken([0, 10], 100, 20, 2)
    expect(stuk[0]).toEqual({ x: 2, y: 18 })
    expect(stuk[1]).toEqual({ x: 98, y: 2 })
  })

  it('zet een vlakke reeks in het midden', () => {
    const [stuk] = sparkStukken([5, 5, 5], 60, 20)
    expect(stuk.every((p) => p.y === 10)).toBe(true)
  })

  it('maakt een pad van rechte stukken', () => {
    expect(padVan([{ x: 0, y: 1 }, { x: 2, y: 3 }])).toBe('M0.0 1.0 L2.0 3.0')
  })
})

describe('bereikVan', () => {
  it('slaat gaten over', () => {
    expect(bereikVan([null, 3, 1, null])).toEqual({ laag: 1, hoog: 3 })
  })
})

describe('ringDeel', () => {
  it('kapt af tussen 0 en 1 en geeft 0 zonder totaal', () => {
    expect(ringDeel(2, 3)).toBeCloseTo(2 / 3)
    expect(ringDeel(5, 3)).toBe(1)
    expect(ringDeel(1, 0)).toBe(0)
    expect(ringDeel(-1, 3)).toBe(0)
  })
})

describe('bezoekPerMaand', () => {
  it('telt dagen met een bezoek per kalendermaand, een dag telt een keer', () => {
    const nu = new Date('2026-10-28T12:00:00Z')
    const bezoeken = [
      new Date('2026-10-01T08:00:00Z'),
      new Date('2026-10-01T18:00:00Z'),
      new Date('2026-10-20T08:00:00Z'),
      new Date('2026-09-30T08:00:00Z'),
      new Date('2026-08-31T08:00:00Z'),
    ]
    expect(bezoekPerMaand(bezoeken, nu)).toEqual({ dezeMaand: 2, vorigeMaand: 1 })
  })

  it('gaat over de jaargrens', () => {
    expect(vorigeMaand('2027-01')).toBe('2026-12')
  })
})

describe('rondeDezeWeek', () => {
  const dagen = [{ dag: 1 }, { dag: 2 }, { dag: 3 }]
  it('telt alleen trainingsdagen van dit schema in deze kalenderweek', () => {
    const nu = new Date('2026-10-28T12:00:00Z') // woensdag
    const logs = [
      { schemaId: 's', dag: 1, op: '2026-10-26T09:00:00Z' },
      { schemaId: 's', dag: 1, op: '2026-10-27T09:00:00Z' },
      { schemaId: 's', dag: 3, op: '2026-10-25T09:00:00Z' }, // vorige week
      { schemaId: 'ander', dag: 2, op: '2026-10-27T09:00:00Z' },
    ]
    const r = rondeDezeWeek(dagen, logs, 's', nu)
    expect(r.gedaan).toBe(1)
    expect(r.totaal).toBe(3)
    expect(r.dagen).toEqual([
      { dag: 1, gedaan: true },
      { dag: 2, gedaan: false },
      { dag: 3, gedaan: false },
    ])
  })
})

describe('bezettingVan', () => {
  it('telt alleen lessen die doorgaan en kapt een overboeking af', () => {
    expect(
      bezettingVan([
        { capaciteit: 10, geboekt: 5, geannuleerd: false },
        { capaciteit: 10, geboekt: 12, geannuleerd: false },
        { capaciteit: 10, geboekt: 10, geannuleerd: true },
      ]),
    ).toBeCloseTo(15 / 20)
  })

  it('geeft null zonder plekken', () => {
    expect(bezettingVan([])).toBeNull()
  })
})
