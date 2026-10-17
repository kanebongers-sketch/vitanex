import { describe, expect, it } from 'vitest'
import { AANMELD_STATUSSEN, magInrichten, statusUitAbonnement, volgendeStatus } from './status'

describe('statusUitAbonnement', () => {
  it('vertaalt de Stripe-statussen', () => {
    expect(statusUitAbonnement('trialing')).toBe('actief')
    expect(statusUitAbonnement('active')).toBe('actief')
    expect(statusUitAbonnement('past_due')).toBe('betaling_mislukt')
    expect(statusUitAbonnement('unpaid')).toBe('betaling_mislukt')
    expect(statusUitAbonnement('paused')).toBe('gepauzeerd')
    expect(statusUitAbonnement('canceled')).toBe('opgezegd')
    expect(statusUitAbonnement('incomplete')).toBeNull()
  })
})

describe('volgendeStatus', () => {
  it('een lopend abonnement volgt Stripe', () => {
    expect(volgendeStatus('actief', { soort: 'abonnement', stripeStatus: 'past_due' })).toBe('betaling_mislukt')
    expect(volgendeStatus('betaling_mislukt', { soort: 'abonnement', stripeStatus: 'active' })).toBe('actief')
    expect(volgendeStatus('actief', { soort: 'betaling_mislukt' })).toBe('betaling_mislukt')
    expect(volgendeStatus('gepauzeerd', { soort: 'abonnement_weg' })).toBe('opgezegd')
  })
  it('geen verandering is null', () => {
    expect(volgendeStatus('actief', { soort: 'abonnement', stripeStatus: 'trialing' })).toBeNull()
    expect(volgendeStatus('actief', { soort: 'abonnement', stripeStatus: 'iets_nieuws' })).toBeNull()
  })
  it('test, aanvraag, wachten, inrichten en opgezegd veranderen nooit door Stripe', () => {
    for (const huidig of ['test', 'aanvraag', 'wacht_op_betaling', 'inrichten', 'opgezegd'] as const) {
      expect(volgendeStatus(huidig, { soort: 'abonnement_weg' })).toBeNull()
      expect(volgendeStatus(huidig, { soort: 'betaling_mislukt' })).toBeNull()
      expect(volgendeStatus(huidig, { soort: 'abonnement', stripeStatus: 'active' })).toBeNull()
    }
  })
})

describe('magInrichten', () => {
  it('alleen vanuit wacht_op_betaling', () => {
    expect(AANMELD_STATUSSEN.filter(magInrichten)).toEqual(['wacht_op_betaling'])
  })
})
