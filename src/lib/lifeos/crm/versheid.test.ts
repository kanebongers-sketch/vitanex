import { describe, expect, it } from 'vitest'
import { contactVersheid, KOUD_NA_DAGEN, versheidTekst } from './versheid'

const VANDAAG = new Date(2026, 6, 20) // 20 juli 2026, lokaal

function dagenGeleden(n: number): string {
  const d = new Date(2026, 6, 20 - n, 9, 0, 0)
  return d.toISOString()
}

describe('contactVersheid', () => {
  it('geeft "nog geen contact" en niet-koud als er nooit contact was', () => {
    expect(contactVersheid(null, VANDAAG)).toEqual({ dagen: null, tekst: 'nog geen contact', koud: false })
  })

  it('is neutraal (niet koud) als vandaag nog onbekend is (SSR)', () => {
    expect(contactVersheid(dagenGeleden(90), null)).toEqual({ dagen: null, tekst: 'nog geen contact', koud: false })
  })

  it('telt hele dagen en zegt "vandaag" bij 0', () => {
    expect(contactVersheid(dagenGeleden(0), VANDAAG)).toMatchObject({ dagen: 0, tekst: 'vandaag', koud: false })
  })

  it('is niet koud net onder de drempel en wél koud erop', () => {
    expect(contactVersheid(dagenGeleden(KOUD_NA_DAGEN - 1), VANDAAG).koud).toBe(false)
    expect(contactVersheid(dagenGeleden(KOUD_NA_DAGEN), VANDAAG).koud).toBe(true)
  })

  it('negeert een onleesbaar contactmoment', () => {
    expect(contactVersheid('geen-datum', VANDAAG)).toEqual({ dagen: null, tekst: 'nog geen contact', koud: false })
  })
})

describe('versheidTekst', () => {
  it('kiest de juiste eenheid per afstand', () => {
    expect(versheidTekst(0)).toBe('vandaag')
    expect(versheidTekst(1)).toBe('gisteren')
    expect(versheidTekst(3)).toBe('3 dagen geleden')
    expect(versheidTekst(21)).toBe('3 weken geleden')
    expect(versheidTekst(60)).toBe('2 maanden geleden')
    expect(versheidTekst(400)).toBe('1 jaar geleden')
  })
})
