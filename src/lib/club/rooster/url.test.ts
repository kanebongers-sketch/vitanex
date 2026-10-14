import { describe, expect, it } from 'vitest'
import { leesRoosterStaat, roosterHref } from './url'

const ID = '44444444-4444-4444-8444-444444444444'

describe('rooster-URL', () => {
  it('leest geldige parameters en negeert onzin', () => {
    const s = leesRoosterStaat({ week: '2026-W42', zaal: ID, type: 'x', les: [ID, 'b'] }, 'budel')
    expect(s).toEqual({ v: 'budel', week: '2026-W42', les: ID, zaal: ID, lestype: null, instructeur: null })
    expect(leesRoosterStaat({ week: 'gisteren' }, 'budel').week).toBeNull()
  })

  it('bouwt een URL met wijzigingen', () => {
    const s = leesRoosterStaat({ week: '2026-W42', zaal: ID }, 'budel')
    expect(roosterHref(s, { les: ID })).toBe(`/clubkane/rooster?v=budel&week=2026-W42&zaal=${ID}&les=${ID}`)
    expect(roosterHref(s, { zaal: null, week: null })).toBe('/clubkane/rooster?v=budel')
  })
})
