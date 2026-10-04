import { describe, expect, test } from 'vitest'
import { leesBedrag, leesNieuwePositie, leesWijziging } from './invoer'

describe('invoer beleggingen', () => {
  test('bedragen met komma, leeg mag waar toegestaan', () => {
    expect(leesBedrag('6,284061', 'GAK')).toEqual({ ok: true, waarde: 6.284061 })
    expect(leesBedrag('', 'GAK', { leegMag: true })).toEqual({ ok: true, waarde: null })
    expect(leesBedrag('-1', 'GAK').ok).toBe(false)
    expect(leesBedrag(0, 'Aantal').ok).toBe(false)
  })
  test('nieuwe positie', () => {
    expect(leesNieuwePositie({ symbool: 'vusa.as', aantal: '205', aankoopprijs: '110,578' })).toEqual({
      ok: true, waarde: { symbool: 'VUSA.AS', aantal: 205, aankoopprijs: 110.578, inlegEur: null },
    })
    expect(leesNieuwePositie({ symbool: 'drop table', aantal: 1 }).ok).toBe(false)
  })
  test('wijziging: alleen wat meekomt; GAK leegmaken mag', () => {
    expect(leesWijziging({ aankoopprijs: null })).toEqual({ ok: true, waarde: { aankoopprijs: null } })
    expect(leesWijziging({}).ok).toBe(false)
  })
})
