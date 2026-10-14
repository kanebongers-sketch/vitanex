import { describe, expect, it } from 'vitest'
import { berekenBehoud } from './behoud'
import { behoudOnderdelen } from './onderdelen'

const NU = new Date('2026-10-14T12:00:00+02:00')

function op(...dagenGeleden: number[]): Date[] {
  return dagenGeleden.map((d) => new Date(NU.getTime() - d * 86_400_000 - 2 * 3_600_000))
}

function uitleg(bezoeken: Date[], lidSinds: string | null, noShows = 0): string[] {
  return behoudOnderdelen(berekenBehoud({ bezoeken, noShows, lidSinds, nu: NU })).map((o) => o.uitleg)
}

describe('behoudOnderdelen', () => {
  it('telt op tot de score en houdt de volgorde vast', () => {
    const b = berekenBehoud({ bezoeken: op(1, 4, 8, 11, 30, 45), noShows: 1, lidSinds: '2024-01-01', nu: NU })
    const delen = behoudOnderdelen(b)
    expect(delen.map((o) => o.label)).toEqual(['Frequentie', 'Trend', 'Recent', 'No-shows', 'Lid-duur'])
    expect(delen.reduce((s, o) => s + o.punten, 0)).toBe(b.score)
    expect(delen.reduce((s, o) => s + o.max, 0)).toBe(100)
  })

  it('schrijft natuurlijk Nederlands, ook bij 1 dag en bij nul', () => {
    expect(uitleg(op(1, 8, 15, 22, 40, 50), '2024-01-01')).toEqual([
      'Ongeveer 1x per week, laatste 4 weken',
      'Was minder dan 1x per week in de 8 weken daarvoor',
      'Gisteren geweest',
      'Altijd gekomen bij een geboekte les, laatste 8 weken',
      '2 jaar lid',
    ])
    expect(uitleg([], '2026-01-01', 2)).toEqual([
      'Niet geweest in de laatste 4 weken',
      'Kwam niet in de 8 weken daarvoor',
      'Geen bezoek in 12 weken',
      '2 keer niet gekomen bij een geboekte les, laatste 8 weken',
      '9 maanden lid',
    ])
  })

  it('zegt eerlijk wanneer vergelijken nog niet kan', () => {
    const delen = uitleg(op(0, 3), '2026-10-01')
    expect(delen[1]).toBe('Nog te kort lid om te vergelijken')
    expect(delen[2]).toBe('Vandaag geweest')
    expect(delen[4]).toBe('Nieuw lid: de eerste maanden zijn kwetsbaar')
  })
})
