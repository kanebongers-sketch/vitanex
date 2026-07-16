import { describe, it, expect } from 'vitest'
import { datumSleutel, leesDatumSleutel, tijdLabel, duurLabel } from './datum'

describe('datumSleutel', () => {
  it('geeft de LOKALE dag, niet de UTC-dag', () => {
    // Arrange — 15 juli, 01:00 lokaal. In UTC is dat 's zomers nog 14 juli.
    const nacht = new Date(2026, 6, 15, 1, 0)

    // Act
    const sleutel = datumSleutel(nacht)

    // Assert — toISOString().slice(0,10) zou hier 2026-07-14 geven.
    expect(sleutel).toBe('2026-07-15')
  })

  it('vult maand en dag aan tot twee cijfers', () => {
    expect(datumSleutel(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('leesDatumSleutel', () => {
  it('leest een sleutel als lokale middernacht', () => {
    // Act
    const d = leesDatumSleutel('2026-07-15')

    // Assert
    expect(d?.getFullYear()).toBe(2026)
    expect(d?.getMonth()).toBe(6)
    expect(d?.getDate()).toBe(15)
    expect(d?.getHours()).toBe(0)
  })

  it('is het spiegelbeeld van datumSleutel', () => {
    const heen = datumSleutel(new Date(2026, 11, 31, 23, 59))
    const terug = leesDatumSleutel(heen)

    expect(terug ? datumSleutel(terug) : null).toBe(heen)
  })

  it('weigert een dag die niet bestaat in plaats van door te rollen', () => {
    // 31 februari rolt in JS stilletjes door naar 3 maart.
    expect(leesDatumSleutel('2026-02-31')).toBeNull()
    expect(leesDatumSleutel('2026-13-01')).toBeNull()
    expect(leesDatumSleutel('2026-00-10')).toBeNull()
  })

  it('weigert een verkeerd formaat', () => {
    expect(leesDatumSleutel('15-07-2026')).toBeNull()
    expect(leesDatumSleutel('2026-7-15')).toBeNull()
    expect(leesDatumSleutel('morgen')).toBeNull()
    expect(leesDatumSleutel('')).toBeNull()
  })

  it('accepteert een schrikkeldag', () => {
    expect(leesDatumSleutel('2028-02-29')).not.toBeNull()
    expect(leesDatumSleutel('2026-02-29')).toBeNull()
  })
})

describe('tijdLabel', () => {
  it('geeft 24-uurs tijd', () => {
    expect(tijdLabel(new Date(2026, 6, 15, 14, 30))).toBe('14:30')
    expect(tijdLabel(new Date(2026, 6, 15, 9, 5))).toBe('09:05')
  })
})

describe('duurLabel', () => {
  it('schrijft minuten, uren en de combinatie kort op', () => {
    expect(duurLabel(45)).toBe('45m')
    expect(duurLabel(60)).toBe('1u')
    expect(duurLabel(90)).toBe('1u 30m')
    expect(duurLabel(240)).toBe('4u')
  })

  it('struikelt niet over rare invoer', () => {
    expect(duurLabel(0)).toBe('0m')
    expect(duurLabel(-10)).toBe('0m')
    expect(duurLabel(44.6)).toBe('45m')
  })
})
