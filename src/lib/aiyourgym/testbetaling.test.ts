import { describe, expect, it } from 'vitest'
import { aanmeldbaar, isTestSessie, testbetalen, testbetalenVoor, testbetalingAan, testSessie } from './testbetaling'
import { sessieKlaar } from './stripe-event'

const STRIPE = { AIYOURGYM_STRIPE_SECRET_KEY: 'sk_test_abc', AIYOURGYM_STRIPE_PRIJS_LESSEN: 'price_123456' }

describe('testbetaling', () => {
  it('zonder Stripe: testbetaling aan en aanmelden kan', () => {
    expect(testbetalen('lessen', {})).toBe(true)
    expect(aanmeldbaar('lessen', {})).toBe(true)
  })
  it('met Stripe voor het pakket: alleen Stripe, geen testbetaling', () => {
    expect(testbetalen('lessen', STRIPE)).toBe(false)
    expect(aanmeldbaar('lessen', STRIPE)).toBe(true)
    // Een pakket zonder eigen prijs valt terug op de testbetaling.
    expect(testbetalen('groei', STRIPE)).toBe(true)
  })
  it('uit te zetten met AIYOURGYM_TESTBETALING=0', () => {
    expect(testbetalen('lessen', { AIYOURGYM_TESTBETALING: '0' })).toBe(false)
    expect(aanmeldbaar('lessen', { AIYOURGYM_TESTBETALING: '0' })).toBe(false)
    expect(testbetalingAan({ AIYOURGYM_TESTBETALING: '0' })).toBe(false)
    expect(testbetalenVoor(['lessen'], { AIYOURGYM_TESTBETALING: '0' })).toBe(false)
  })
  it('een keuze van pakketten: Stripe alleen als elk pakket een prijs heeft, de basis telt altijd mee', () => {
    // Zonder prijs voor de basis: testbetaling, ook al heeft de add-on een prijs (besluit Kane 31-10-2026).
    expect(testbetalenVoor(['lessen'], STRIPE)).toBe(true)
    expect(testbetalenVoor(['lessen'], { ...STRIPE, AIYOURGYM_STRIPE_PRIJS_ADMINISTRATIE: 'price_basis1' })).toBe(false)
    // Een pakket zonder prijs erbij: de hele aanmelding gaat via de testbetaling.
    expect(testbetalenVoor(['lessen', 'groei'], STRIPE)).toBe(true)
    expect(testbetalenVoor(['lessen', 'groei'], { ...STRIPE, AIYOURGYM_STRIPE_PRIJS_GROEI: 'price_654321', AIYOURGYM_STRIPE_PRIJS_ADMINISTRATIE: 'price_basis1' })).toBe(false)
    expect(testbetalenVoor([], {})).toBe(false)
  })
  it('alle zes met een bundelprijs: Stripe, ook zonder losse prijzen (geen testbetaling)', () => {
    const zes = ['administratie', 'lessen', 'training', 'afspraken', 'team', 'groei'] as const
    const bundel = { AIYOURGYM_STRIPE_SECRET_KEY: 'sk_test_abc', AIYOURGYM_STRIPE_PRIJS_ALLES: 'price_alles1' }
    expect(testbetalenVoor([...zes], bundel)).toBe(false)
    // Minder dan zes zonder losse prijs: gewoon de testbetaling.
    expect(testbetalenVoor(['lessen'], bundel)).toBe(true)
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
