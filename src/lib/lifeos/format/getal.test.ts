import { describe, it, expect } from 'vitest'
import { getalTekst } from './getal'

// De kop van getal.ts belooft het: "Null blijft null." Een ontbrekende meting is
// geen 0 — dat onderscheid is de dragende invariant van dit project en hoort in
// de weergavelaag te zitten, niet pas in het component dat de functie aanroept.

describe('getalTekst — null blijft null', () => {
  it('geeft null terug voor een ontbrekende meting', () => {
    expect(getalTekst(null)).toBeNull()
  })

  it('geeft null bij NaN — geen getal om te tonen, en zeker geen 0', () => {
    expect(getalTekst(NaN)).toBeNull()
  })

  it('geeft null bij oneindig, in beide richtingen', () => {
    expect(getalTekst(Infinity)).toBeNull()
    expect(getalTekst(-Infinity)).toBeNull()
  })
})

describe('getalTekst — NL-notatie', () => {
  it('gebruikt een komma als decimaalteken en een punt als duizendtal', () => {
    expect(getalTekst(1234.5, 1)).toBe('1.234,5')
    expect(getalTekst(1234567.89, 2)).toBe('1.234.567,89')
  })

  it('groepeert duizendtallen ook zonder decimalen', () => {
    expect(getalTekst(1000)).toBe('1.000')
  })

  it('rondt af op het aantal decimalen (standaard 0)', () => {
    expect(getalTekst(3.7)).toBe('4')
    expect(getalTekst(3.4)).toBe('3')
  })

  it('dwingt trailing nullen af via minimumFractionDigits', () => {
    expect(getalTekst(2, 2)).toBe('2,00')
  })

  it('toont 0 als "0" — nul is een echte meting, geen ontbrekende', () => {
    expect(getalTekst(0)).toBe('0')
  })

  it('behoudt het minteken', () => {
    expect(getalTekst(-5)).toBe('-5')
  })
})
