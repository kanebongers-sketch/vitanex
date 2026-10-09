import { describe, expect, test } from 'vitest'
import { beslis, isPtHost, leesRoutes, ptDoorsturen, ptUrl } from './domein'

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

describe('beslis — niets van MentaForce op fitfactorypt.nl', () => {
  const MF = leesRoutes('home,lifeos,login,admin,kanebongers')

  test('/login wordt de Fit Factory-login (URL blijft /login)', () => {
    expect(beslis('fitfactorypt.nl', '/login', '?next=%2Fkane', true, MF)).toEqual({ soort: 'herschrijven', pad: '/FitFactoryPT/login' })
  })

  test('het favicon wordt het Fit Factory-icoon', () => {
    expect(beslis('fitfactorypt.nl', '/favicon.ico', '', true, MF)).toEqual({ soort: 'herschrijven', pad: '/icons/pt-192.png' })
  })

  test('MentaForce-routes gaan naar de team-ingang', () => {
    expect(beslis('fitfactorypt.nl', '/lifeos', '', true, MF)).toEqual({ soort: 'omleiden', url: 'https://fitfactorypt.nl/' })
    expect(beslis('fitfactorypt.nl', '/home/iets', '', true, MF)).toEqual({ soort: 'omleiden', url: 'https://fitfactorypt.nl/' })
  })

  test('een PT-naam blijft gewoon door', () => {
    expect(beslis('fitfactorypt.nl', '/joey/klanten', '', true, MF)).toEqual({ soort: 'door' })
  })

  test('op mentaforce.nl verandert er niets aan /login of /lifeos', () => {
    expect(beslis('mentaforce.nl', '/login', '', true, MF)).toEqual({ soort: 'door' })
    expect(beslis('mentaforce.nl', '/lifeos', '', true, MF)).toEqual({ soort: 'door' })
  })
})

describe('leesRoutes', () => {
  test('komma-lijst naar set, leeg is leeg', () => {
    expect([...leesRoutes(' home, lifeos ,')]).toEqual(['home', 'lifeos'])
    expect(leesRoutes(undefined).size).toBe(0)
  })
})
