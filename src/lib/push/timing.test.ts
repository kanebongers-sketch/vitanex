import { describe, it, expect } from 'vitest'
import { minutenVanTijd, tijdVanMinuten, binnenStiltetijd, slimVerzendMoment } from './timing'

describe('minutenVanTijd', () => {
  it('leest geldige tijden', () => {
    expect(minutenVanTijd('00:00')).toBe(0)
    expect(minutenVanTijd('08:30')).toBe(510)
    expect(minutenVanTijd('23:59')).toBe(1439)
  })
  it('weigert onzin', () => {
    expect(minutenVanTijd('24:00')).toBeNull()
    expect(minutenVanTijd('8')).toBeNull()
    expect(minutenVanTijd('08:60')).toBeNull()
    expect(minutenVanTijd('')).toBeNull()
  })
})

describe('tijdVanMinuten', () => {
  it('formatteert en normaliseert', () => {
    expect(tijdVanMinuten(510)).toBe('08:30')
    expect(tijdVanMinuten(0)).toBe('00:00')
    expect(tijdVanMinuten(1440)).toBe('00:00') // wrap
    expect(tijdVanMinuten(-30)).toBe('23:30') // negatief wrapt netjes
  })
})

describe('binnenStiltetijd', () => {
  it('venster over middernacht (22:00–08:00)', () => {
    expect(binnenStiltetijd(minutenVanTijd('23:00')!, '22:00', '08:00')).toBe(true)
    expect(binnenStiltetijd(minutenVanTijd('07:00')!, '22:00', '08:00')).toBe(true)
    expect(binnenStiltetijd(minutenVanTijd('08:00')!, '22:00', '08:00')).toBe(false) // eind exclusief
    expect(binnenStiltetijd(minutenVanTijd('12:00')!, '22:00', '08:00')).toBe(false)
    expect(binnenStiltetijd(minutenVanTijd('22:00')!, '22:00', '08:00')).toBe(true) // begin inclusief
  })
  it('normaal venster binnen de dag (13:00–14:00)', () => {
    expect(binnenStiltetijd(minutenVanTijd('13:30')!, '13:00', '14:00')).toBe(true)
    expect(binnenStiltetijd(minutenVanTijd('14:30')!, '13:00', '14:00')).toBe(false)
  })
  it('leeg/gelijk venster = geen stiltetijd', () => {
    expect(binnenStiltetijd(600, '10:00', '10:00')).toBe(false)
    expect(binnenStiltetijd(600, 'x', '08:00')).toBe(false)
  })
})

describe('slimVerzendMoment', () => {
  it('valt terug op standaard bij te weinig data', () => {
    expect(slimVerzendMoment([], { standaard: '20:00' })).toBe('20:00')
    expect(slimVerzendMoment(['19:00', '20:00'], { standaard: '20:00', minPunten: 3 })).toBe('20:00')
  })
  it('neemt de mediaan en rondt af op 30 min', () => {
    // mediaan van 19:00,19:40,20:20 = 19:40 → afgerond op 30 = 19:30
    expect(slimVerzendMoment(['19:00', '19:40', '20:20'], { standaard: '20:00' })).toBe('19:30')
  })
  it('klemt binnen het toegestane venster', () => {
    // mediaan 06:00 maar vroegste 08:00 → 08:00
    expect(slimVerzendMoment(['06:00', '06:00', '06:00'], { standaard: '20:00', vroegste: '08:00' })).toBe('08:00')
    // mediaan 23:00 maar laatste 21:30 → 21:30
    expect(slimVerzendMoment(['23:00', '23:00', '23:00'], { standaard: '20:00', laatste: '21:30' })).toBe('21:30')
  })
  it('negeert ongeldige tijden bij het tellen', () => {
    expect(slimVerzendMoment(['x', 'y', '20:00'], { standaard: '18:00', minPunten: 3 })).toBe('18:00')
  })
})
