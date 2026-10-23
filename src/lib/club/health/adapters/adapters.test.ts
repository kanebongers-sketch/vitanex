import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Tokens } from '../adapter'
import { withings } from './withings'
import { strava, STRAVA_PER_PAGINA } from './strava'
import { polar } from './polar'
import { oura } from './oura'
import { whoop } from './whoop'

const fixture = (naam: string): unknown => JSON.parse(readFileSync(join(__dirname, '..', 'fixtures', naam), 'utf8')) as unknown
const NU = new Date('2026-10-23T12:00:00Z')
const TOKENS: Tokens = { accessToken: 'abc', refreshToken: 'ref', verlooptOp: null, externGebruikerId: '42', scope: null }
const SLEUTELS = { clientId: 'id', secret: 'geheim' }

describe('Withings', () => {
  it('leest tokens uit het antwoord met status 0', () => {
    const t = withings.leesTokens(fixture('withings-token.json'), NU)
    expect(t?.externGebruikerId).toBe('363')
    expect(t?.verlooptOp).toBe(new Date(NU.getTime() + 10800 * 1000).toISOString())
  })

  it('weigert een antwoord met een andere status', () => {
    expect(withings.leesTokens({ status: 503, body: {} }, NU)).toBeNull()
  })

  it('zet gewicht, vet en spiermassa om en slaat onzekere en verkeerde categorie over', () => {
    const p = withings.leesData(fixture('withings-getmeas.json'), NU, null)
    expect(p?.metingen).toEqual([
      { soort: 'gewicht_kg', waarde: 82.45, training: null, bron: 'withings', externId: '12:1', gemetenOp: new Date(1761100000 * 1000).toISOString() },
      { soort: 'vetpercentage', waarde: expect.closeTo(21.4, 5), training: null, bron: 'withings', externId: '12:6', gemetenOp: new Date(1761100000 * 1000).toISOString() },
      { soort: 'spiermassa_kg', waarde: expect.closeTo(61.23, 5), training: null, bron: 'withings', externId: '12:76', gemetenOp: new Date(1761100000 * 1000).toISOString() },
    ])
    expect(p?.volgendePagina).toBe('3')
    expect(p?.nieuweCursor).toBe('1761200000')
  })

  it('bouwt het verzoek met lastupdate, offset en Bearer', () => {
    const v = withings.dataVerzoek(TOKENS, '1700000000', '3', NU)
    const body = new URLSearchParams(v.body)
    expect(v.url).toBe('https://wbsapi.withings.net/measure')
    expect(body.get('action')).toBe('getmeas')
    expect(body.get('lastupdate')).toBe('1700000000')
    expect(body.get('offset')).toBe('3')
    expect(v.headers.Authorization).toBe('Bearer abc')
  })

  it('ziet 401 en 601 in de body als token en rem', () => {
    expect(withings.beoordeel({ status: 200, headers: {}, json: { status: 401 } })).toBe('token_ongeldig')
    expect(withings.beoordeel({ status: 200, headers: {}, json: { status: 601 } })).toBe('rem')
    expect(withings.beoordeel({ status: 200, headers: {}, json: { status: 0, body: {} } })).toBe('ok')
  })

  it('stuurt het secret alleen in de body van het tokenverzoek', () => {
    const v = withings.tokenVerzoek(SLEUTELS, { soort: 'code', code: 'c', codeVerifier: null, redirectUri: 'https://x/cb' })
    expect(new URLSearchParams(v.body).get('client_secret')).toBe('geheim')
    expect(v.url).not.toContain('geheim')
  })
})

describe('Strava', () => {
  it('leest tokens met athlete id en expires_at', () => {
    const t = strava.leesTokens(fixture('strava-token.json'), NU)
    expect(t?.externGebruikerId).toBe('134815')
    expect(t?.verlooptOp).toBe(new Date(1761210000 * 1000).toISOString())
  })

  it('houdt bij verversen het athlete id van de vorige tokens', () => {
    const t = strava.leesTokens({ access_token: 'n', refresh_token: 'r', expires_at: 1 }, NU, TOKENS)
    expect(t?.externGebruikerId).toBe('42')
  })

  it('zet trainingen om zonder kcal te verzinnen', () => {
    const p = strava.leesData(fixture('strava-activiteiten.json'), NU, null)
    expect(p?.metingen).toHaveLength(2)
    expect(p?.metingen[0]).toMatchObject({ soort: 'training', externId: '154504250376823', training: { soort: 'Run', duurSec: 1980, kcal: null, gemHartslag: 151.3 } })
    expect(p?.metingen[1].training).toMatchObject({ soort: 'MountainBikeRide', kcal: null, gemHartslag: null })
    expect(p?.volgendePagina).toBeNull()
    expect(p?.nieuweCursor).toBe(String(Date.parse('2026-10-21T15:00:00Z') / 1000))
  })

  it('vraagt de volgende pagina bij een volle pagina', () => {
    const vol = Array.from({ length: STRAVA_PER_PAGINA }, (_, i) => ({ id: i + 1, start_date: '2026-10-20T06:30:00Z', moving_time: 600 }))
    expect(strava.leesData(vol, NU, '2')?.volgendePagina).toBe('3')
  })

  it('wacht na een 429 tot het volgende kwartier', () => {
    const ms = strava.wachtNaRem?.({ status: 429, headers: {}, json: null }, new Date('2026-10-23T12:07:00Z'))
    expect(ms).toBe(8 * 60_000 + 5_000)
  })

  it('kan intrekken via deauthorize', () => {
    expect(strava.intrekVerzoek(TOKENS, SLEUTELS)?.url).toBe('https://www.strava.com/oauth/deauthorize')
  })
})

describe('Polar', () => {
  it('rekent de lokale starttijd om naar UTC en leest de ISO-duur', () => {
    const p = polar.leesData(fixture('polar-trainingen.json'), NU, null)
    expect(p?.metingen).toEqual([
      { soort: 'training', waarde: 62.5, training: { soort: 'RUNNING_ROAD', duurSec: 3750, kcal: 530, gemHartslag: 141 }, bron: 'polar', externId: '2AC312F', gemetenOp: '2026-10-20T06:15:00.000Z' },
    ])
  })

  it('gebruikt Basic-authenticatie voor het token en registreert het lid daarna', () => {
    const v = polar.tokenVerzoek(SLEUTELS, { soort: 'code', code: 'c', codeVerifier: null, redirectUri: 'https://x/cb' })
    expect(v.headers.Authorization).toBe(`Basic ${Buffer.from('id:geheim').toString('base64')}`)
    expect(polar.leesTokens({ access_token: 't', x_user_id: 99 }, NU)?.externGebruikerId).toBe('99')
    expect(polar.naKoppelen?.(TOKENS)?.url).toBe('https://www.polaraccesslink.com/v3/users')
    expect(polar.intrekVerzoek(TOKENS, SLEUTELS)?.methode).toBe('DELETE')
  })
})

describe('Oura', () => {
  it('leest de hoofdslaap (slaap, HRV, rusthartslag) en slaat dutjes over', () => {
    const p = oura.leesData(fixture('oura-sleep.json'), NU, null)
    expect(p?.metingen.map((m) => [m.soort, m.waarde])).toEqual([['slaap_minuten', 420], ['hrv_ms', 48], ['rusthartslag', 52]])
    expect(p?.volgendePagina).toBe('0|volgende')
  })

  it('gaat na de laatste pagina van een lijst door naar de volgende lijst', () => {
    const p = oura.leesData(fixture('oura-activiteit.json'), NU, '1|')
    expect(p?.metingen[0]).toMatchObject({ soort: 'stappen', waarde: 9234, externId: 'stappen:2026-10-21' })
    expect(p?.volgendePagina).toBe('2|')
    expect(oura.leesData({ data: [] }, NU, '3|')?.volgendePagina).toBeNull()
  })

  it('vraagt de juiste lijst met datum en next_token', () => {
    const v = oura.dataVerzoek(TOKENS, '2026-10-01', '0|abc', NU)
    expect(v.url).toContain('/v2/usercollection/sleep?')
    expect(v.url).toContain('start_date=2026-10-01')
    expect(v.url).toContain('next_token=abc')
  })
})

describe('WHOOP', () => {
  it('leest rusthartslag en HRV uit gescoord herstel', () => {
    const p = whoop.leesData(fixture('whoop-herstel.json'), NU, null)
    expect(p?.metingen.map((m) => [m.soort, m.waarde])).toEqual([['rusthartslag', 64], ['hrv_ms', 31.81]])
    expect(p?.volgendePagina).toBe('0|MTIzOjEyMzEyMw')
  })

  it('rekent kilojoule om naar kcal', () => {
    const p = whoop.leesData(fixture('whoop-training.json'), NU, '2|')
    expect(p?.metingen[0].training?.kcal).toBeCloseTo(1569.34 / 4.184, 5)
    expect(p?.metingen[0].training?.duurSec).toBe(3600)
    expect(p?.volgendePagina).toBe('3|')
  })

  it('vraagt het id van het lid op na het koppelen', () => {
    expect(whoop.naKoppelen?.(TOKENS)?.url).toBe('https://api.prod.whoop.com/developer/v2/user/profile/basic')
    expect(whoop.externIdNaKoppelen?.({ user_id: 10129, email: 'x@y.nl' })).toBe('10129')
  })
})

describe('alle adapters', () => {
  it('zetten de state en het terugkeeradres in de autorisatie-URL en nooit het secret', () => {
    for (const a of [withings, strava, polar, oura, whoop]) {
      const url = new URL(a.autorisatieUrl({ clientId: 'id', redirectUri: 'https://aiyourgym.com/cb', state: 'st', codeChallenge: null }))
      expect(url.protocol).toBe('https:')
      expect(url.searchParams.get('state')).toBe('st')
      expect(url.searchParams.get('redirect_uri')).toBe('https://aiyourgym.com/cb')
      expect(url.toString()).not.toContain('geheim')
    }
  })
})
