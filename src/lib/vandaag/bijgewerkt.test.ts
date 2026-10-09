import { describe, expect, test } from 'vitest'
import { bijgewerktRegel } from './bijgewerkt'

const NU = new Date('2026-10-09T08:30:00+02:00')

describe('bijgewerktRegel', () => {
  test('vandaag → tijd en bron, niet oud', () => {
    expect(bijgewerktRegel({ bron: 'health_connect', tijd: '2026-10-09T07:42:00+02:00' }, NU))
      .toEqual({ tekst: 'Bijgewerkt vandaag om 07:42 uit Health Connect.', oud: false })
  })
  test('gisteren → nog niet oud', () => {
    expect(bijgewerktRegel({ bron: 'healthkit', tijd: '2026-10-08T22:10:00+02:00' }, NU)?.tekst)
      .toBe('Bijgewerkt gisteren om 22:10 uit Apple Health.')
  })
  test('ouder → eerlijk zeggen dat je nacht waarschijnlijk ontbreekt', () => {
    const r = bijgewerktRegel({ bron: 'health_connect', tijd: '2026-10-03T09:00:00+02:00' }, NU)
    expect(r?.oud).toBe(true)
    expect(r?.tekst).toContain('Laatst bijgewerkt op 3 okt')
  })
  test('geen sync of onzin-tijd → geen regel', () => {
    expect(bijgewerktRegel(null, NU)).toBeNull()
    expect(bijgewerktRegel({ bron: 'health_connect', tijd: 'gisteren' }, NU)).toBeNull()
  })
})
