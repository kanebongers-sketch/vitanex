import { describe, expect, it } from 'vitest'
import { kiesbareLessen, lesUitRij, telPerLes } from './lessen'

const NU = new Date('2026-10-14T08:00:00Z')
const rij = { id: 'les1', start_op: '2026-10-14T17:00:00Z', eind_op: '2026-10-14T18:00:00Z', capaciteit: 12, status: 'gepland', lestype: { naam: 'Spinning' } }

describe('lessen voor een proefles', () => {
  it('leest een les met lestype en rekent de vrije plekken', () => {
    expect(lesUitRij(rij, 10)).toMatchObject({ naam: 'Spinning', capaciteit: 12, bezet: 10, vrij: 2 })
    expect(lesUitRij({ ...rij, lestype: [{ naam: 'Yoga' }] }, 0)?.naam).toBe('Yoga')
  })

  it('weigert geannuleerde lessen en kapotte rijen', () => {
    expect(lesUitRij({ ...rij, status: 'geannuleerd' }, 0)).toBeNull()
    expect(lesUitRij({ id: 1 }, 0)).toBeNull()
  })

  it('laat alleen niet-volle lessen in de toekomst zien, op tijd', () => {
    const vol = lesUitRij({ ...rij, id: 'vol' }, 12)
    const voorbij = lesUitRij({ ...rij, id: 'voorbij', start_op: '2026-10-14T07:00:00Z' }, 0)
    const later = lesUitRij({ ...rij, id: 'later', start_op: '2026-10-15T17:00:00Z' }, 0)
    const nu = lesUitRij(rij, 0)
    const lijst = [vol, voorbij, later, nu].filter((l) => l !== null)
    expect(kiesbareLessen(lijst, NU).map((l) => l.id)).toEqual(['les1', 'later'])
  })

  it('telt per les', () => {
    expect(telPerLes(['a', 'b', 'a', null]).get('a')).toBe(2)
  })
})
