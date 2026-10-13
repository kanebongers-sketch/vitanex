import { afterEach, describe, expect, test, vi } from 'vitest'
import { mentaforceAppUrl } from './app-url'

afterEach(() => vi.unstubAllEnvs())

describe('mentaforceAppUrl', () => {
  test('MENTAFORCE_APP_URL gaat voor, zonder slash aan het eind', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://fitfactorypt.nl')
    vi.stubEnv('MENTAFORCE_APP_URL', 'https://releasev.nl/mentaforce/')
    expect(mentaforceAppUrl()).toBe('https://releasev.nl/mentaforce')
  })

  test('zonder MENTAFORCE_APP_URL zoals voorheen', () => {
    vi.stubEnv('MENTAFORCE_APP_URL', '')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://voorbeeld.nl')
    expect(mentaforceAppUrl()).toBe('https://voorbeeld.nl')
  })

  test('niets ingesteld', () => {
    vi.stubEnv('MENTAFORCE_APP_URL', '')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    expect(mentaforceAppUrl()).toBeUndefined()
  })
})
