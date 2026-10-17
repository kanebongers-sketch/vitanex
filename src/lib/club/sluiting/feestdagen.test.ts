import { describe, expect, it } from 'vitest'
import { isFeestdagSleutel, koningsdag, nederlandseFeestdagen, paaszondag } from './feestdagen'

describe('paaszondag (Computus)', () => {
  it.each([
    [2000, '2000-04-23'],
    [2019, '2019-04-21'],
    [2024, '2024-03-31'],
    [2025, '2025-04-20'],
    [2026, '2026-04-05'],
    [2027, '2027-03-28'],
    [2038, '2038-04-25'],
    [2008, '2008-03-23'],
    [2011, '2011-04-24'],
  ])('Pasen %i valt op %s', (jaar, verwacht) => {
    expect(paaszondag(jaar)).toBe(verwacht)
  })

  it('kent de vroegst en laatst mogelijke datum', () => {
    expect(paaszondag(2285)).toBe('2285-03-22')
    expect(paaszondag(2038)).toBe('2038-04-25')
  })
})

describe('koningsdag', () => {
  it('is 27 april op een gewone dag', () => {
    expect(koningsdag(2026)).toBe('2026-04-27')
  })

  it('schuift naar 26 april als de 27e op zondag valt', () => {
    // 27 april 2025 en 2031 zijn zondagen.
    expect(koningsdag(2025)).toBe('2025-04-26')
    expect(koningsdag(2031)).toBe('2031-04-26')
  })
})

describe('nederlandseFeestdagen', () => {
  it('geeft alle tien feestdagen van 2026 op datum', () => {
    // Act
    const dagen = nederlandseFeestdagen(2026)
    // Assert
    expect(dagen.map((d) => [d.naam, d.datum])).toEqual([
      ['Nieuwjaarsdag', '2026-01-01'],
      ['Eerste Paasdag', '2026-04-05'],
      ['Tweede Paasdag', '2026-04-06'],
      ['Koningsdag', '2026-04-27'],
      ['Bevrijdingsdag', '2026-05-05'],
      ['Hemelvaartsdag', '2026-05-14'],
      ['Eerste Pinksterdag', '2026-05-24'],
      ['Tweede Pinksterdag', '2026-05-25'],
      ['Eerste Kerstdag', '2026-12-25'],
      ['Tweede Kerstdag', '2026-12-26'],
    ])
  })

  it('rekent Hemelvaart en Pinksteren vanaf Pasen in 2027', () => {
    const per = Object.fromEntries(nederlandseFeestdagen(2027).map((d) => [d.sleutel, d.datum]))
    expect(per['tweede-paasdag']).toBe('2027-03-29')
    expect(per.hemelvaartsdag).toBe('2027-05-06')
    expect(per['eerste-pinksterdag']).toBe('2027-05-16')
    expect(per['tweede-pinksterdag']).toBe('2027-05-17')
  })

  it('herkent alleen bekende sleutels', () => {
    expect(isFeestdagSleutel('koningsdag')).toBe(true)
    expect(isFeestdagSleutel('sinterklaas')).toBe(false)
  })
})
