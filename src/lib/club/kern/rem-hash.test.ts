import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { remGeheim, remSleutel } from './rem-hash'

describe('remSleutel', () => {
  it('geeft 64 hextekens, vast per waarde en anders per doel', () => {
    // Arrange
    const geheim = 'een-geheim-van-de-server-123'
    // Act
    const h = remSleutel('club-widget|ip', '203.0.113.7', geheim)
    // Assert
    expect(h).toMatch(/^[0-9a-f]{64}$/)
    expect(remSleutel('club-widget|ip', '203.0.113.7', geheim)).toBe(h)
    expect(remSleutel('club-widget|email', '203.0.113.7', geheim)).not.toBe(h)
  })

  it('is zonder het geheim niet na te rekenen als gewone sha256', () => {
    const h = remSleutel('club-widget|ip', '203.0.113.7', 'geheim-a-1234567890')
    expect(h).not.toBe(createHash('sha256').update('club-widget|ip|203.0.113.7').digest('hex'))
    expect(remSleutel('club-widget|ip', '203.0.113.7', 'geheim-b-1234567890')).not.toBe(h)
  })

  it('kiest eerst CLUB_REM_GEHEIM, dan de service-sleutel', () => {
    expect(remGeheim({ CLUB_REM_GEHEIM: 'lang-genoeg-geheim-1', LIFEOS_SERVICE_ROLE_KEY: 'sleutel' })).toBe('lang-genoeg-geheim-1')
    expect(remGeheim({ CLUB_REM_GEHEIM: 'kort', LIFEOS_SERVICE_ROLE_KEY: 'sleutel' })).toBe('sleutel')
    expect(remGeheim({})).toBeTruthy()
  })
})
