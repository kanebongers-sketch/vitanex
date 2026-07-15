import { describe, it, expect } from 'vitest'
import {
  WEEK_DAGEN,
  amsterdamDatum,
  dagenGeleden,
  weekDatums,
  weekdagKort,
  weekdagLang,
} from './week'

describe('amsterdamDatum', () => {
  it('rekent in Amsterdamse tijd, niet in UTC', () => {
    // 22:30 UTC op 14 juli is in Amsterdam (CEST, +02:00) al 00:30 op 15 juli.
    // toISOString() zou hier 2026-07-14 zeggen — precies de fout die we vermijden.
    expect(amsterdamDatum(new Date('2026-07-14T22:30:00.000Z'))).toBe('2026-07-15')
  })

  it('houdt in de winter dezelfde dag aan bij middaguur', () => {
    expect(amsterdamDatum(new Date('2026-01-15T12:00:00.000Z'))).toBe('2026-01-15')
  })
})

describe('dagenGeleden', () => {
  it('geeft vandaag bij 0', () => {
    const nu = new Date('2026-07-15T09:00:00.000Z')
    expect(dagenGeleden(0, nu)).toBe('2026-07-15')
  })

  it('telt terug over een maandgrens', () => {
    const nu = new Date('2026-07-02T09:00:00.000Z')
    expect(dagenGeleden(6, nu)).toBe('2026-06-26')
  })

  it('verschuift niet bij de overgang naar zomertijd', () => {
    // Zomertijd gaat in op 29 maart 2026. Die dag duurt 23 uur, dus een naïeve
    // `- n * 86_400_000` landt hier op de verkeerde kalenderdag.
    const nu = new Date('2026-03-30T00:30:00.000Z')
    expect(dagenGeleden(1, nu)).toBe('2026-03-29')
    expect(dagenGeleden(2, nu)).toBe('2026-03-28')
  })

  it('verschuift niet bij de overgang naar wintertijd', () => {
    // Wintertijd gaat in op 25 oktober 2026; die dag duurt 25 uur.
    const nu = new Date('2026-10-26T00:30:00.000Z')
    expect(dagenGeleden(1, nu)).toBe('2026-10-25')
    expect(dagenGeleden(2, nu)).toBe('2026-10-24')
  })
})

describe('weekDatums', () => {
  it('geeft 7 aaneengesloten dagen, oud → nieuw, met vandaag als laatste', () => {
    const nu = new Date('2026-07-15T09:00:00.000Z')
    expect(weekDatums(nu)).toEqual([
      '2026-07-09', '2026-07-10', '2026-07-11',
      '2026-07-12', '2026-07-13', '2026-07-14', '2026-07-15',
    ])
  })

  it('levert altijd WEEK_DAGEN unieke dagen', () => {
    const datums = weekDatums(new Date('2026-03-30T23:45:00.000Z'))
    expect(datums).toHaveLength(WEEK_DAGEN)
    expect(new Set(datums).size).toBe(WEEK_DAGEN)
  })
})

describe('weekdagnamen', () => {
  it('mapt een datum op de juiste weekdag (ma=0 … zo=6)', () => {
    // 13 juli 2026 is een maandag, 19 juli een zondag.
    expect(weekdagKort('2026-07-13')).toBe('Ma')
    expect(weekdagLang('2026-07-13')).toBe('Maandag')
    expect(weekdagKort('2026-07-19')).toBe('Zo')
    expect(weekdagLang('2026-07-19')).toBe('Zondag')
  })
})
