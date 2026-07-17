import { describe, it, expect } from 'vitest'
import { PROVIDERS, leesProvider } from './providers'

// Deze allowlist is de spiegel van de check-constraint op wearable_tokens.provider
// (014_wearable_tokens_google_fit.sql:6-7). Loopt hij uit de pas, dan komt een
// geldige provider terug als 400 — of erger, een ongeldige bereikt Postgres en
// levert een 500 waar een 400 hoort.

describe('leesProvider — narrowing op de systeemgrens', () => {
  it('accepteert elke provider uit de constraint', () => {
    expect(leesProvider('fitbit')).toBe('fitbit')
    expect(leesProvider('google_health')).toBe('google_health')
    expect(leesProvider('google_calendar')).toBe('google_calendar')
    expect(leesProvider('google_fit')).toBe('google_fit')
  })

  it('dekt precies de vier providers uit 014 — niet meer, niet minder', () => {
    expect([...PROVIDERS]).toEqual(['fitbit', 'google_health', 'google_calendar', 'google_fit'])
  })

  it('wijst een onbekende provider af', () => {
    expect(leesProvider('strava')).toBeNull()
    expect(leesProvider('')).toBeNull()
  })

  it('is niet soepel: geen trim, geen hoofdletters', () => {
    // De waarden zijn machinaal, niet met de hand ingetypt. Soepel zijn levert
    // hier alleen aanvalsoppervlak op.
    expect(leesProvider(' fitbit')).toBeNull()
    expect(leesProvider('fitbit ')).toBeNull()
    expect(leesProvider('Fitbit')).toBeNull()
    expect(leesProvider('GOOGLE_FIT')).toBeNull()
  })

  it('wijst niet-strings af', () => {
    expect(leesProvider(null)).toBeNull()
    expect(leesProvider(undefined)).toBeNull()
    expect(leesProvider(42)).toBeNull()
    expect(leesProvider({ provider: 'fitbit' })).toBeNull()
    expect(leesProvider(['fitbit'])).toBeNull()
  })
})
