import { describe, expect, it } from 'vitest'
import { dagGrenzen, dagSleutel, dagenGeleden, datumUitSleutel, laatsteBezoekTekst, leeftijd, middernachtNl, weekdagNl } from './tijd'

const NU = new Date('2026-10-14T12:00:00+02:00')

describe('tijd in Nederlandse dagen', () => {
  it('rekent de dag in Nederlandse tijd, ook vlak na middernacht', () => {
    expect(dagSleutel(new Date('2026-10-13T22:30:00Z'))).toBe('2026-10-14')
  })

  it('vindt middernacht in zomer- en wintertijd', () => {
    expect(middernachtNl('2026-07-01').toISOString()).toBe('2026-06-30T22:00:00.000Z')
    expect(middernachtNl('2026-12-01').toISOString()).toBe('2026-11-30T23:00:00.000Z')
  })

  it('geeft de grenzen van de dag, ook rond de wisseling naar wintertijd', () => {
    const { van, tot } = dagGrenzen(new Date('2026-10-25T10:00:00Z'))
    expect(van.toISOString()).toBe('2026-10-24T22:00:00.000Z')
    expect(tot.toISOString()).toBe('2026-10-25T23:00:00.000Z')
  })

  it('telt dagen geleden per kalenderdag', () => {
    expect(dagenGeleden(new Date('2026-10-13T23:59:00+02:00'), NU)).toBe(1)
    expect(dagenGeleden(new Date('2026-10-14T00:01:00+02:00'), NU)).toBe(0)
  })

  it('geeft maandag 1 en zondag 7', () => {
    expect(weekdagNl(new Date('2026-10-12T12:00:00+02:00'))).toBe(1)
    expect(weekdagNl(new Date('2026-10-18T12:00:00+02:00'))).toBe(7)
  })

  it('schrijft het laatste bezoek in mensentaal', () => {
    expect(laatsteBezoekTekst(null, NU)).toBe('Nooit')
    expect(laatsteBezoekTekst(new Date('2026-10-14T07:00:00+02:00'), NU)).toBe('Vandaag')
    expect(laatsteBezoekTekst(new Date('2026-10-13T07:00:00+02:00'), NU)).toBe('Gisteren')
    expect(laatsteBezoekTekst(new Date('2026-10-10T07:00:00+02:00'), NU)).toBe('4 dagen geleden')
    expect(laatsteBezoekTekst(new Date('2026-09-02T07:00:00+02:00'), NU)).toMatch(/^2 sep/)
    expect(laatsteBezoekTekst(new Date('2025-09-02T07:00:00+02:00'), NU)).toMatch(/2025$/)
  })

  it('berekent de leeftijd rond de verjaardag', () => {
    expect(leeftijd('1990-10-14', NU)).toBe(36)
    expect(leeftijd('1990-10-15', NU)).toBe(35)
    expect(leeftijd(null, NU)).toBeNull()
    expect(leeftijd('onzin', NU)).toBeNull()
  })

  it('schrijft een databasedatum als Nederlandse datum', () => {
    expect(datumUitSleutel('2022-03-03')).toMatch(/^3 mrt 2022$/)
    expect(datumUitSleutel(null)).toBeNull()
  })
})
