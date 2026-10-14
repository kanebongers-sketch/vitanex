import { describe, expect, it } from 'vitest'
import { leesLidWijziging, leesNotitie, leesVastpinnen, normaliseerTag } from './invoer'
import { notitieUitRij, reserveringUitRij, sorteerNotities } from './rijen'

const UUID = '3f2b8c1e-7a4d-4e2b-9c1a-0d5e6f7a8b9c'

describe('leesNotitie', () => {
  it('accepteert tekst en vastpinnen', () => {
    expect(leesNotitie({ tekst: '  Wil PT proberen ', vastgepind: true })).toEqual({ ok: true, waarde: { tekst: 'Wil PT proberen', vastgepind: true } })
  })

  it('weigert leeg, te lang en geen object', () => {
    expect(leesNotitie({ tekst: '   ' }).ok).toBe(false)
    expect(leesNotitie({ tekst: 'x'.repeat(2001) }).ok).toBe(false)
    expect(leesNotitie('tekst').ok).toBe(false)
  })

  it('leest vastpinnen alleen als boolean', () => {
    expect(leesVastpinnen({ vastgepind: false })).toEqual({ ok: true, waarde: false })
    expect(leesVastpinnen({ vastgepind: 'ja' }).ok).toBe(false)
  })
})

describe('normaliseerTag', () => {
  it('maakt nette tags', () => {
    expect(normaliseerTag(' PT interesse ')).toBe('pt-interesse')
    expect(normaliseerTag('Café_ochtend!')).toBe('cafe-ochtend')
    expect(normaliseerTag('***')).toBeNull()
    expect(normaliseerTag('x'.repeat(31))).toBeNull()
  })
})

describe('leesLidWijziging', () => {
  it('leest coach en tags', () => {
    expect(leesLidWijziging({ coachId: UUID })).toEqual({ ok: true, waarde: { coachId: UUID } })
    expect(leesLidWijziging({ coachId: null })).toEqual({ ok: true, waarde: { coachId: null } })
    expect(leesLidWijziging({ tags: ['Nieuw', 'nieuw', 'PT interesse'] })).toEqual({ ok: true, waarde: { tags: ['nieuw', 'pt-interesse'] } })
  })

  it('weigert onzin', () => {
    expect(leesLidWijziging({ coachId: 'drop table' }).ok).toBe(false)
    expect(leesLidWijziging({ tags: 'nieuw' }).ok).toBe(false)
    expect(leesLidWijziging({ tags: Array.from({ length: 13 }, (_, i) => `tag${i}`) }).ok).toBe(false)
    expect(leesLidWijziging({}).ok).toBe(false)
  })
})

describe('rijen', () => {
  it('leest een reservering met les en lesnaam', () => {
    const r = reserveringUitRij({
      id: 'r1', lid_id: 'l1', status: 'geboekt', wachtpositie: null,
      club_lessen: { id: 'les1', start_op: '2026-10-14T17:00:00Z', eind_op: '2026-10-14T17:45:00Z', status: 'gepland', vestiging: 'budel', club_lestypen: { naam: 'Spinning' } },
    })
    expect(r).toMatchObject({ lesNaam: 'Spinning', status: 'geboekt', lesGeannuleerd: false })
    expect(reserveringUitRij({ id: 'r1', lid_id: 'l1', status: 'raar', club_lessen: null })).toBeNull()
  })

  it('zet vastgepinde notities bovenaan, daarna de nieuwste', () => {
    const n = (id: string, op: string, vastgepind = false) => notitieUitRij({ id, tekst: 't', vastgepind, aangemaakt_op: op })
    const lijst = [n('a', '2026-10-01T10:00:00Z'), n('b', '2026-10-05T10:00:00Z'), n('c', '2026-09-01T10:00:00Z', true)]
    expect(sorteerNotities(lijst.filter((x) => x !== null)).map((x) => x.id)).toEqual(['c', 'b', 'a'])
  })
})
