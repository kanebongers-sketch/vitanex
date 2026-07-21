import { describe, it, expect } from 'vitest'
import { createHmac } from 'node:crypto'
import { handtekeningGeldig } from './handtekening'

// Vaste testwaarden — GEEN echte secrets. We rekenen de "geldige" handtekening in
// de test zelf uit met node:crypto, precies zoals Meta dat aan hun kant doet.
const TEST_SECRET = 'test-app-secret-1234'
const TEST_BODY = '{"object":"whatsapp_business_account","entry":[{"id":"123"}]}'

/** Bootst Meta na: HMAC-SHA256 over de body, met `sha256=`-prefix in de header. */
function tekenBody(body: string, secret: string): string {
  const hex = createHmac('sha256', secret).update(body, 'utf8').digest('hex')
  return `sha256=${hex}`
}

describe('handtekeningGeldig — geldige handtekening', () => {
  it('aanvaardt een correct ondertekende body', () => {
    // Arrange
    const header = tekenBody(TEST_BODY, TEST_SECRET)
    // Act
    const geldig = handtekeningGeldig(TEST_BODY, header, TEST_SECRET)
    // Assert
    expect(geldig).toBe(true)
  })
})

describe('handtekeningGeldig — fail-closed', () => {
  it('wijst een handtekening af die met de verkeerde secret is gemaakt', () => {
    // Arrange: ondertekend met een ánder secret dan wij verwachten.
    const header = tekenBody(TEST_BODY, 'een-heel-ander-secret')
    // Act
    const geldig = handtekeningGeldig(TEST_BODY, header, TEST_SECRET)
    // Assert
    expect(geldig).toBe(false)
  })

  it('wijst af als de body is gewijzigd na ondertekening', () => {
    // Arrange: geldige header voor de originele body, maar de body is gemanipuleerd.
    const header = tekenBody(TEST_BODY, TEST_SECRET)
    // Act
    const geldig = handtekeningGeldig(TEST_BODY + 'x', header, TEST_SECRET)
    // Assert
    expect(geldig).toBe(false)
  })

  it('wijst af bij een ontbrekende header (null)', () => {
    expect(handtekeningGeldig(TEST_BODY, null, TEST_SECRET)).toBe(false)
  })

  it('wijst af bij een ontbrekende secret (undefined)', () => {
    const header = tekenBody(TEST_BODY, TEST_SECRET)
    expect(handtekeningGeldig(TEST_BODY, header, undefined)).toBe(false)
  })

  it('wijst af bij een lege secret', () => {
    const header = tekenBody(TEST_BODY, TEST_SECRET)
    expect(handtekeningGeldig(TEST_BODY, header, '')).toBe(false)
  })

  it('wijst een header zonder sha256=-prefix af', () => {
    // Arrange: kale hex zonder het verplichte prefix.
    const hex = createHmac('sha256', TEST_SECRET).update(TEST_BODY, 'utf8').digest('hex')
    // Act / Assert
    expect(handtekeningGeldig(TEST_BODY, hex, TEST_SECRET)).toBe(false)
  })

  it('wijst een kale "sha256="-header zonder digest af', () => {
    expect(handtekeningGeldig(TEST_BODY, 'sha256=', TEST_SECRET)).toBe(false)
  })
})
