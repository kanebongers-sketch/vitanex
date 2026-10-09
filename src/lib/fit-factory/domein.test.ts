import { describe, expect, test } from 'vitest'
import { beslis, isPtHost, ptDoorsturen, ptUrl } from './domein'

describe('isPtHost', () => {
  test('kaal, www, hoofdletters en poort', () => {
    expect(isPtHost('fitfactorypt.nl')).toBe(true)
    expect(isPtHost('www.fitfactorypt.nl')).toBe(true)
    expect(isPtHost('FitFactoryPT.nl:443')).toBe(true)
    expect(isPtHost('mentaforce.nl')).toBe(false)
    expect(isPtHost(null)).toBe(false)
  })
})

describe('ptUrl', () => {
  test('bouwt een absolute URL op het PT-domein', () => {
    expect(ptUrl('/')).toBe('https://fitfactorypt.nl/')
    expect(ptUrl('/joey/lead?nieuw=1')).toBe('https://fitfactorypt.nl/joey/lead?nieuw=1')
  })
})

describe('beslis', () => {
  test('fitfactorypt.nl: de homepage is de team-ingang, URL blijft "/"', () => {
    expect(beslis('fitfactorypt.nl', '/', '', false)).toEqual({ soort: 'herschrijven', pad: '/FitFactoryPT' })
  })

  test('fitfactorypt.nl: /FitFactoryPT wordt "/" (één adres per pagina)', () => {
    expect(beslis('fitfactorypt.nl', '/FitFactoryPT', '', false)).toEqual({ soort: 'omleiden', url: 'https://fitfactorypt.nl/' })
  })

  test('www gaat naar het kale domein, met pad en query', () => {
    expect(beslis('www.fitfactorypt.nl', '/joey', '?a=1', false)).toEqual({ soort: 'omleiden', url: 'https://fitfactorypt.nl/joey?a=1' })
  })

  test('fitfactorypt.nl: PT-pagina\'s en API gewoon door', () => {
    expect(beslis('fitfactorypt.nl', '/joey/klanten', '', true)).toEqual({ soort: 'door' })
    expect(beslis('fitfactorypt.nl', '/api/lifeos/pt-app/sessie', '', true)).toEqual({ soort: 'door' })
  })

  test('mentaforce.nl: de ingang verhuist alleen met de schakelaar aan', () => {
    expect(beslis('mentaforce.nl', '/FitFactoryPT', '', false)).toEqual({ soort: 'door' })
    expect(beslis('mentaforce.nl', '/FitFactoryPT', '', true)).toEqual({ soort: 'omleiden', url: 'https://fitfactorypt.nl/' })
  })

  test('mentaforce.nl: de rest van MentaForce blijft waar hij is', () => {
    expect(beslis('mentaforce.nl', '/lifeos', '', true)).toEqual({ soort: 'door' })
    expect(beslis('localhost:3000', '/FitFactoryPT', '', true)).toEqual({ soort: 'door' })
  })
})

describe('ptDoorsturen', () => {
  test('alleen vanaf mentaforce.nl en alleen met de schakelaar', () => {
    expect(ptDoorsturen('mentaforce.nl', true)).toBe(true)
    expect(ptDoorsturen('mentaforce.nl', false)).toBe(false)
    expect(ptDoorsturen('localhost:3000', true)).toBe(false)
    expect(ptDoorsturen('fitfactorypt.nl', true)).toBe(false)
  })
})
