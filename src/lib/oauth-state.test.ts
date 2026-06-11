import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createOAuthState, verifyOAuthState } from './oauth-state'

const TEST_USER = '4f1c9c2e-0000-4000-8000-000000000001'

beforeEach(() => {
  process.env.OAUTH_STATE_SECRET = 'test-secret-voor-vitest-1234567890'
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createOAuthState + verifyOAuthState', () => {
  test('geldige state geeft het user-id terug', () => {
    // Arrange & Act
    const state = createOAuthState(TEST_USER)
    const resultaat = verifyOAuthState(state)
    // Assert
    expect(resultaat).toBe(TEST_USER)
  })

  test('null of lege state wordt afgewezen', () => {
    expect(verifyOAuthState(null)).toBeNull()
    expect(verifyOAuthState('')).toBeNull()
  })

  test('state zonder punt wordt afgewezen', () => {
    expect(verifyOAuthState('geen-punt-aanwezig')).toBeNull()
  })

  test('state met extra segmenten wordt afgewezen', () => {
    const state = createOAuthState(TEST_USER)
    expect(verifyOAuthState(`${state}.extra`)).toBeNull()
  })

  test('vervalste handtekening wordt afgewezen', () => {
    const state = createOAuthState(TEST_USER)
    const [payload] = state.split('.')
    expect(verifyOAuthState(`${payload}.vervalste-handtekening`)).toBeNull()
  })

  test('aangepaste payload wordt afgewezen', () => {
    const state = createOAuthState(TEST_USER)
    const [, handtekening] = state.split('.')
    const anderePayload = Buffer.from(
      JSON.stringify({ uid: 'aanvaller', exp: Date.now() + 60000 })
    ).toString('base64url')
    expect(verifyOAuthState(`${anderePayload}.${handtekening}`)).toBeNull()
  })

  test('verlopen state wordt afgewezen', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-11T10:00:00Z'))
    const state = createOAuthState(TEST_USER)

    // 11 minuten later — TTL is 10 minuten
    vi.setSystemTime(new Date('2026-06-11T10:11:00Z'))
    expect(verifyOAuthState(state)).toBeNull()
  })

  test('state blijft geldig binnen de TTL', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-11T10:00:00Z'))
    const state = createOAuthState(TEST_USER)

    vi.setSystemTime(new Date('2026-06-11T10:09:00Z'))
    expect(verifyOAuthState(state)).toBe(TEST_USER)
  })

  test('state van een ander secret wordt afgewezen', () => {
    const state = createOAuthState(TEST_USER)
    process.env.OAUTH_STATE_SECRET = 'een-heel-ander-secret'
    expect(verifyOAuthState(state)).toBeNull()
  })
})
