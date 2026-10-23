import { describe, expect, it } from 'vitest'
import { aanmeldbaar, isTestSessie, testbetalen, testSessie } from './testbetaling'
import { sessieKlaar } from './stripe-event'

const STRIPE = { AIYOURGYM_STRIPE_SECRET_KEY: 'sk_test_abc', AIYOURGYM_STRIPE_PRIJS_CLUB: 'price_123456' }

describe('testbetaling', () => {
  it('zonder Stripe: testbetaling aan en aanmelden kan', () => {
    expect(testbetalen('club', {})).toBe(true)
    expect(aanmeldbaar('club', {})).toBe(true)
  })
  it('met Stripe voor het pakket: alleen Stripe, geen testbetaling', () => {
    expect(testbetalen('club', STRIPE)).toBe(false)
    expect(aanmeldbaar('club', STRIPE)).toBe(true)
    // Een pakket zonder eigen prijs valt terug op de testbetaling.
    expect(testbetalen('start', STRIPE)).toBe(true)
  })
  it('uit te zetten met AIYOURGYM_TESTBETALING=0', () => {
    expect(testbetalen('club', { AIYOURGYM_TESTBETALING: '0' })).toBe(false)
    expect(aanmeldbaar('club', { AIYOURGYM_TESTBETALING: '0' })).toBe(false)
  })
  it('sessie-id: alleen test_ met 32 tekens', () => {
    expect(isTestSessie(`test_${'a'.repeat(32)}`)).toBe(true)
    expect(isTestSessie(`test_${'a'.repeat(31)}`)).toBe(false)
    expect(isTestSessie('cs_test_abcdefghijkl')).toBe(false)
    expect(isTestSessie(null)).toBe(false)
  })
  it('een testsessie telt als afgerond, zonder klant en abonnement', () => {
    const s = testSessie(`test_${'b'.repeat(32)}`, '11111111-1111-4111-8111-111111111111')
    expect(sessieKlaar(s)).toBe(true)
    expect(s.klantId).toBeNull()
    expect(s.abonnementId).toBeNull()
  })
})
