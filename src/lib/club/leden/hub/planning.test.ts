import { describe, expect, it } from 'vitest'
import { boekbareLessen } from './planning'

const NU = new Date('2026-10-27T10:00:00Z')

function les(id: string, start: string, extra: Partial<{ geannuleerd: boolean; geboekt: number; capaciteit: number }> = {}) {
  return {
    id,
    startOp: start,
    eindOp: start,
    capaciteit: extra.capaciteit ?? 10,
    geannuleerd: extra.geannuleerd ?? false,
    geboekt: extra.geboekt ?? 0,
    lestype: { naam: `Les ${id}` },
    instructeur: { naam: 'Sam' },
  }
}

describe('boekbareLessen', () => {
  it('laat voorbije, geannuleerde en al geboekte lessen weg, vroegste eerst', () => {
    const uit = boekbareLessen(
      [les('c', '2026-10-29T09:00:00Z'), les('a', '2026-10-27T09:00:00Z'), les('b', '2026-10-28T09:00:00Z'), les('d', '2026-10-28T10:00:00Z', { geannuleerd: true }), les('e', '2026-10-28T08:00:00Z')],
      new Set(['e']),
      NU,
    )
    expect(uit.map((l) => l.id)).toEqual(['b', 'c'])
    expect(uit[0]).toMatchObject({ naam: 'Les b', instructeur: 'Sam', vol: false })
  })

  it('markeert een volle les (wachtlijst) en houdt zich aan het maximum', () => {
    const lijst = Array.from({ length: 5 }, (_, i) => les(String(i), `2026-10-30T0${i}:00:00Z`, { geboekt: 10 }))
    const uit = boekbareLessen(lijst, new Set(), NU, 3)
    expect(uit).toHaveLength(3)
    expect(uit.every((l) => l.vol)).toBe(true)
  })
})
