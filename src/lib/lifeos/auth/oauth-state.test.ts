// Tests voor de OAuth-state-ondertekening — de CSRF-bescherming van elke
// koppeling (Whoop, Oura, agenda, Gmail, …). De kernbelofte van de module: je
// kunt geen state maken die wij accepteren zonder het geheim, en een
// gemanipuleerde of verlopen state wordt geweigerd. Die belofte stond in de kop
// maar werd door geen enkele test bewaakt — precies het patroon waar een echte
// bug eerder doorheen glipte.
//
// We zetten `OAUTH_STATE_SECRET` zelf en tekenen in de test met dezelfde HMAC,
// zodat we óók de gevallen kunnen bouwen die alleen iemand-mét-het-geheim kan
// maken (een geldig ondertekende maar verder kapotte payload). Fake timers maken
// `maakState`/`leesState` deterministisch rond de vervaltijd.

import { createHmac } from 'node:crypto'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isDienst, leesState, maakState } from '@/lib/lifeos/auth/oauth-state'

const TEST_GEHEIM = 'test-geheim-voor-oauth-state-32bytes!!'
const NU = 1_800_000_000_000 // vast moment, zodat exp voorspelbaar is

/** Tekent een payload zoals de module dat intern doet — met hetzelfde geheim. */
function tekenInTest(payload: string): string {
  return createHmac('sha256', TEST_GEHEIM).update(payload).digest('base64url')
}

/** Bouwt een ondertekende state uit een willekeurig object (ook een kapot object). */
function ondertekendeState(inhoud: unknown): string {
  const payload = Buffer.from(JSON.stringify(inhoud)).toString('base64url')
  return `${payload}.${tekenInTest(payload)}`
}

const OUD_GEHEIM = process.env.OAUTH_STATE_SECRET

beforeEach(() => {
  process.env.OAUTH_STATE_SECRET = TEST_GEHEIM
  vi.useFakeTimers()
  vi.setSystemTime(NU)
})

afterEach(() => {
  vi.useRealTimers()
})

afterAll(() => {
  if (OUD_GEHEIM === undefined) delete process.env.OAUTH_STATE_SECRET
  else process.env.OAUTH_STATE_SECRET = OUD_GEHEIM
})

describe('maakState + leesState — round-trip', () => {
  it('leest een verse eigen state terug, met de juiste dienst', () => {
    const state = maakState('whoop')
    expect(leesState(state)).toEqual({ dienst: 'whoop' })
  })

  it('bindt de dienst: elke dienst komt als zichzelf terug', () => {
    for (const dienst of ['oura', 'gmail', 'google_calendar', 'outlook'] as const) {
      expect(leesState(maakState(dienst))).toEqual({ dienst })
    }
  })

  it('maakt elke state uniek (de nonce verschilt)', () => {
    expect(maakState('whoop')).not.toBe(maakState('whoop'))
  })
})

describe('leesState — weigert wat niet klopt', () => {
  it('weigert null/undefined/lege string', () => {
    expect(leesState(null)).toBeNull()
    expect(leesState(undefined)).toBeNull()
    expect(leesState('')).toBeNull()
  })

  it('weigert een verkeerd aantal delen (geen punt, twee punten)', () => {
    expect(leesState('geenpunt')).toBeNull()
    expect(leesState('a.b.c')).toBeNull()
  })

  it('weigert een lege payload of lege handtekening', () => {
    expect(leesState('.handtekening')).toBeNull()
    expect(leesState('payload.')).toBeNull()
  })

  // DE kernbelofte: een omgeflipte letter in de handtekening → weigeren.
  it('weigert een gemanipuleerde handtekening', () => {
    const [payload, sig] = maakState('whoop').split('.')
    const anderTeken = sig[0] === 'A' ? 'B' : 'A'
    const kapotteSig = anderTeken + sig.slice(1)
    expect(leesState(`${payload}.${kapotteSig}`)).toBeNull()
  })

  // Payload aanpassen (dienst omschrijven) → de bestaande handtekening klopt niet
  // meer → weigeren. Zonder het geheim kun je geen nieuwe maken.
  it('weigert een gemanipuleerde payload met de oude handtekening', () => {
    const [, sig] = maakState('whoop').split('.')
    const anderePayload = Buffer.from(JSON.stringify({ n: 'x', d: 'oura', exp: NU + 1000 }))
      .toString('base64url')
    expect(leesState(`${anderePayload}.${sig}`)).toBeNull()
  })

  it('weigert een te korte handtekening (ongelijke lengte, geen crash)', () => {
    const [payload] = maakState('whoop').split('.')
    expect(leesState(`${payload}.kort`)).toBeNull()
  })
})

describe('leesState — geldig ondertekend maar kapotte inhoud', () => {
  // Deze gevallen komen voorbij de handtekeningcheck (we tekenen ze met het
  // geheim) en toetsen de payload-validatie daarachter.
  it('weigert een payload die geen geldige JSON is', () => {
    const payload = Buffer.from('dit is geen json').toString('base64url')
    expect(leesState(`${payload}.${tekenInTest(payload)}`)).toBeNull()
  })

  it('weigert JSON die geen object is', () => {
    expect(leesState(ondertekendeState(42))).toBeNull()
    expect(leesState(ondertekendeState('een string'))).toBeNull()
    expect(leesState(ondertekendeState(null))).toBeNull()
  })

  it('weigert een onbekende dienst', () => {
    expect(leesState(ondertekendeState({ n: 'x', d: 'onbekend', exp: NU + 1000 }))).toBeNull()
  })

  it('weigert een niet-numerieke of niet-eindige exp', () => {
    expect(leesState(ondertekendeState({ n: 'x', d: 'whoop', exp: 'morgen' }))).toBeNull()
    expect(leesState(ondertekendeState({ n: 'x', d: 'whoop', exp: Infinity }))).toBeNull()
  })
})

describe('leesState — vervaltijd', () => {
  it('weigert een verlopen state', () => {
    const state = maakState('whoop')
    vi.setSystemTime(NU + 10 * 60 * 1000 + 1) // net voorbij de TTL van 10 min
    expect(leesState(state)).toBeNull()
  })

  it('accepteert een state die nog binnen de TTL valt', () => {
    const state = maakState('whoop')
    vi.setSystemTime(NU + 10 * 60 * 1000 - 1) // net binnen de TTL
    expect(leesState(state)).toEqual({ dienst: 'whoop' })
  })

  // Grens: op exp precies is Date.now() > exp nog false → geldig.
  it('accepteert een state precies op het vervalmoment', () => {
    const state = ondertekendeState({ n: 'x', d: 'whoop', exp: NU })
    expect(leesState(state)).toEqual({ dienst: 'whoop' })
  })

  it('weigert een state één milliseconde ná het vervalmoment', () => {
    const state = ondertekendeState({ n: 'x', d: 'whoop', exp: NU - 1 })
    expect(leesState(state)).toBeNull()
  })
})

describe('geheim() ontbreekt', () => {
  it('maakState gooit een leesbare fout zonder OAUTH_STATE_SECRET', () => {
    delete process.env.OAUTH_STATE_SECRET
    expect(() => maakState('whoop')).toThrow(/OAUTH_STATE_SECRET/)
  })
})

describe('isDienst', () => {
  it('herkent de geldige diensten', () => {
    expect(isDienst('whoop')).toBe(true)
    expect(isDienst('google_calendar')).toBe(true)
  })

  it('weigert onbekende en niet-string waarden', () => {
    expect(isDienst('facebook')).toBe(false)
    expect(isDienst(42)).toBe(false)
    expect(isDienst(null)).toBe(false)
    expect(isDienst(undefined)).toBe(false)
  })
})
