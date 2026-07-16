import { describe, it, expect } from 'vitest'
import { bronLabel, dagTekst, getalTekst, slaapTekst } from './formatteer'

describe('slaapTekst', () => {
  it('schrijft minuten als uren en minuten', () => {
    expect(slaapTekst(450)).toBe('7u 30m')
    expect(slaapTekst(420)).toBe('7u')
    expect(slaapTekst(45)).toBe('45m')
  })

  it('houdt null null — een ontbrekende nacht is geen 0u', () => {
    // Assert — dit is waarom de formatter geen '—' teruggeeft: de kaart moet
    // zélf kunnen zien dat er niets gemeten is.
    expect(slaapTekst(null)).toBeNull()
    expect(slaapTekst(Number.NaN)).toBeNull()
    expect(slaapTekst(-10)).toBeNull()
  })
})

describe('getalTekst', () => {
  it('gebruikt de Nederlandse komma', () => {
    expect(getalTekst(62.5, 1)).toBe('62,5')
    expect(getalTekst(48, 0)).toBe('48')
  })

  it('houdt null null', () => {
    expect(getalTekst(null)).toBeNull()
    expect(getalTekst(Number.NaN)).toBeNull()
  })

  it('maakt van een echte 0 wél een 0', () => {
    // Arrange — 0 is een geldige meting; alleen null betekent "niet gemeten".
    expect(getalTekst(0)).toBe('0')
  })
})

describe('bronLabel', () => {
  it('schrijft de merknamen zoals ze horen', () => {
    expect(bronLabel('whoop')).toBe('WHOOP')
    expect(bronLabel('oura')).toBe('Oura')
    expect(bronLabel('handmatig')).toBe('handmatig')
  })
})

describe('dagTekst', () => {
  it('zegt vandaag en gisteren', () => {
    expect(dagTekst('2026-07-15', '2026-07-15')).toBe('vandaag')
    expect(dagTekst('2026-07-14', '2026-07-15')).toBe('gisteren')
  })

  it('noemt oudere dagen bij naam', () => {
    expect(dagTekst('2026-07-13', '2026-07-15')).toBe('maandag 13 juli')
  })

  it('valt terug op de kale datum bij onzin', () => {
    expect(dagTekst('kapot', '2026-07-15')).toBe('kapot')
  })
})
