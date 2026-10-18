import { describe, expect, it } from 'vitest'
import { BADGES, berekenBadges, sorteerVoorWeergave, type BadgeBron } from './badges'

const leeg: BadgeBron = { bezoeken: [], lessen: [], schemasAfgerond: [], challengesGehaald: [] }

function wekelijks(aantal: number): string[] {
  return Array.from({ length: aantal }, (_, i) => new Date(Date.UTC(2026, 6, 6 + i * 7, 8)).toISOString())
}

describe('berekenBadges', () => {
  it('geeft zonder data alle badges als niet behaald, met stand voor de telbadges', () => {
    // Act
    const badges = berekenBadges(leeg)
    // Assert
    expect(badges).toHaveLength(BADGES.length)
    expect(badges.every((b) => !b.behaald)).toBe(true)
    expect(badges.find((b) => b.sleutel === 'bezoeken-10')?.stand).toEqual({ nu: 0, doel: 10 })
  })

  it('geeft de dag van het tiende bezoek bij 10 bezoeken', () => {
    // Arrange: 12 bezoeken, een per week, in omgekeerde volgorde aangeleverd.
    const bron = { ...leeg, bezoeken: wekelijks(12).reverse() }
    // Act
    const badges = berekenBadges(bron)
    const per = new Map(badges.map((b) => [b.sleutel, b]))
    // Assert
    expect(per.get('eerste-bezoek')?.op).toBe('2026-07-06')
    expect(per.get('bezoeken-10')?.op).toBe('2026-09-07')
    expect(per.get('bezoeken-25')?.behaald).toBe(false)
    expect(per.get('weken-4')?.op).toBe('2026-07-27')
  })

  it('herkent groepsles, schema en challenge', () => {
    const badges = berekenBadges({
      ...leeg,
      lessen: ['2026-10-03T17:00:00Z', '2026-09-03T17:00:00Z'],
      schemasAfgerond: ['2026-08-15'],
      challengesGehaald: ['2026-10-20', '2026-09-28'],
    })
    const per = new Map(badges.map((b) => [b.sleutel, b]))
    expect(per.get('eerste-groepsles')?.op).toBe('2026-09-03')
    expect(per.get('eerste-schema')?.op).toBe('2026-08-15')
    expect(per.get('challenge-gehaald')?.op).toBe('2026-09-28')
  })

  it('telt bezoeken als unieke dagen in Nederlandse tijd, niet per check-in', () => {
    // Arrange: 10 check-ins op 5 dagen. 22:30 UTC op 6 juli is 7 juli in Nederland.
    const dagen = ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05']
    const bezoeken = [...dagen.flatMap((d) => [`${d}T07:00:00Z`, `${d}T15:00:00Z`]), '2026-07-06T22:30:00Z', '2026-07-07T06:00:00Z']
    // Act
    const per = new Map(berekenBadges({ ...leeg, bezoeken }).map((b) => [b.sleutel, b]))
    // Assert: 6 bezoekdagen, dus nog geen 10.
    expect(per.get('bezoeken-10')?.behaald).toBe(false)
    expect(per.get('bezoeken-10')?.stand).toEqual({ nu: 6, doel: 10 })
  })

  it('geen 4 weken op rij bij een gat', () => {
    const ops = wekelijks(5).filter((_, i) => i !== 2)
    expect(berekenBadges({ ...leeg, bezoeken: ops }).find((b) => b.sleutel === 'weken-4')?.behaald).toBe(false)
  })
})

describe('sorteerVoorWeergave', () => {
  it('zet behaalde badges eerst, nieuwste bovenaan', () => {
    const badges = berekenBadges({ ...leeg, bezoeken: wekelijks(1), lessen: ['2026-10-01T17:00:00Z'] })
    const volgorde = sorteerVoorWeergave(badges).map((b) => b.sleutel)
    expect(volgorde.slice(0, 2)).toEqual(['eerste-groepsles', 'eerste-bezoek'])
    expect(volgorde).toHaveLength(BADGES.length)
  })
})
