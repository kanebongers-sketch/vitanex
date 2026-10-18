import { describe, expect, it, vi } from 'vitest'
import { accountFormulier, checkoutFormulier } from './stripe-api'
import { leesAccount, leesClubEvent, sessieBetaald } from './stripe-event'
import { verwerkClubEvent, type VerwerkOpslag } from './verwerk'

const VERKOOP = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b'

function sessie(extra: Record<string, unknown> = {}) {
  return { id: 'cs_test_abcdefghijkl', object: 'checkout.session', status: 'complete', payment_status: 'paid', mode: 'payment', amount_total: 9900, currency: 'eur', payment_intent: 'pi_123456789', client_reference_id: VERKOOP, metadata: { verkoop_id: VERKOOP }, ...extra }
}

function event(type: string, object: unknown, account: string | null = 'acct_TEST123456') {
  return { id: 'evt_test_123456', type, account, data: { object } }
}

describe('checkout en account', () => {
  it('checkout: payment, iDEAL en kaart, bedrag uit onze verkoop, geen fee bij 0', () => {
    const f = checkoutFormulier({ verkoopId: VERKOOP, organisatieId: 'org', productNaam: 'Strip 10', bedragCent: 9900, platformFeeCent: 0, email: null, succesUrl: 'https://a/s', terugUrl: 'https://a/t' })
    expect(f.get('mode')).toBe('payment')
    expect(f.get('payment_method_types[0]')).toBe('ideal')
    expect(f.get('payment_method_types[1]')).toBe('card')
    expect(f.get('line_items[0][price_data][unit_amount]')).toBe('9900')
    expect(f.get('metadata[verkoop_id]')).toBe(VERKOOP)
    expect(f.has('payment_intent_data[application_fee_amount]')).toBe(false)
    expect(f.has('customer_email')).toBe(false)
  })

  it('checkout met fee en e-mail', () => {
    const f = checkoutFormulier({ verkoopId: VERKOOP, organisatieId: 'org', productNaam: 'x', bedragCent: 1000, platformFeeCent: 50, email: 'a@b.nl', succesUrl: 'https://a', terugUrl: 'https://b' })
    expect(f.get('payment_intent_data[application_fee_amount]')).toBe('50')
    expect(f.get('customer_email')).toBe('a@b.nl')
  })

  it('express-account in Nederland met iDEAL', () => {
    const f = accountFormulier('org', 'Fit Factory')
    expect(f.get('type')).toBe('express')
    expect(f.get('country')).toBe('NL')
    expect(f.get('capabilities[ideal_payments][requested]')).toBe('true')
  })

  it('leest de accountstand', () => {
    expect(leesAccount({ id: 'acct_TEST123456', charges_enabled: true, payouts_enabled: false, details_submitted: true })).toEqual({ accountId: 'acct_TEST123456', chargesAan: true, uitbetalenAan: false, gegevensCompleet: true })
    expect(leesAccount({ id: 'cus_1' })).toBeNull()
  })
})

describe('events lezen', () => {
  it('betaalde sessie op een Connect-account', () => {
    const e = leesClubEvent(event('checkout.session.completed', sessie()))
    expect(e?.soort).toBe('sessie_betaald')
    if (e?.soort === 'sessie_betaald') {
      expect(e.account).toBe('acct_TEST123456')
      expect(e.sessie.verkoopId).toBe(VERKOOP)
      expect(sessieBetaald(e.sessie)).toBe(true)
    }
  })

  it('zonder account (platform-event) doen we niets', () => {
    expect(leesClubEvent(event('checkout.session.completed', sessie(), null))?.soort).toBe('overig')
  })

  it('nog niet betaald of andere valuta telt niet', () => {
    const e = leesClubEvent(event('checkout.session.completed', sessie({ payment_status: 'unpaid' })))
    expect(e?.soort === 'sessie_betaald' && sessieBetaald(e.sessie)).toBe(false)
    const usd = leesClubEvent(event('checkout.session.completed', sessie({ currency: 'usd' })))
    expect(usd?.soort === 'sessie_betaald' && sessieBetaald(usd.sessie)).toBe(false)
  })

  it('verlopen, terugbetaald en account', () => {
    expect(leesClubEvent(event('checkout.session.expired', sessie({ status: 'expired' })))).toMatchObject({ soort: 'sessie_mislukt', status: 'verlopen' })
    expect(leesClubEvent(event('charge.refunded', { id: 'ch_1', payment_intent: 'pi_123456789', amount_refunded: 9900 }))).toMatchObject({ soort: 'terugbetaald', terugCent: 9900 })
    expect(leesClubEvent(event('account.updated', { id: 'acct_TEST123456', charges_enabled: true }))?.soort).toBe('account')
    expect(leesClubEvent({ id: 'x', type: 'y' })).toBeNull()
  })
})

function nepOpslag(claim: 'nieuw' | 'dubbel' | 'fout' = 'nieuw', afronden: string | null = 'ok') {
  return {
    claimEvent: vi.fn(async () => claim),
    geefEventVrij: vi.fn(async () => undefined),
    rondVerkoopAf: vi.fn(async () => afronden),
    sluitOpenVerkoop: vi.fn(async () => 'ok' as const),
    verwerkTerugbetaling: vi.fn(async () => 'ok'),
    werkAccountStandBij: vi.fn(async () => 'ok' as const),
    meld: vi.fn(async () => undefined),
  } satisfies VerwerkOpslag
}

function betaald(extra: Record<string, unknown> = {}) {
  const e = leesClubEvent(event('checkout.session.completed', sessie(extra)))
  if (!e) throw new Error('event niet gelezen')
  return e
}

describe('verwerken', () => {
  it('rondt een betaalde verkoop af met bedrag en account van Stripe ter controle', async () => {
    const o = nepOpslag()
    expect(await verwerkClubEvent(betaald(), o)).toBe('ok')
    expect(o.rondVerkoopAf).toHaveBeenCalledWith({ verkoopId: VERKOOP, sessieId: 'cs_test_abcdefghijkl', paymentIntent: 'pi_123456789', bedragCent: 9900, account: 'acct_TEST123456' })
  })

  it('een dubbel event doet niets', async () => {
    const o = nepOpslag('dubbel')
    expect(await verwerkClubEvent(betaald(), o)).toBe('dubbel')
    expect(o.rondVerkoopAf).not.toHaveBeenCalled()
  })

  it('afwijkend bedrag: melden, niet opnieuw proberen', async () => {
    const o = nepOpslag('nieuw', 'afwijkend')
    expect(await verwerkClubEvent(betaald(), o)).toBe('ok')
    expect(o.meld).toHaveBeenCalled()
  })

  it('bij een storing de claim vrijgeven zodat Stripe het opnieuw probeert', async () => {
    const o = nepOpslag('nieuw', null)
    expect(await verwerkClubEvent(betaald(), o)).toBe('fout')
    expect(o.geefEventVrij).toHaveBeenCalledWith('evt_test_123456')
  })

  it('onbetaalde sessie: niets afronden', async () => {
    const o = nepOpslag()
    await verwerkClubEvent(betaald({ payment_status: 'unpaid' }), o)
    expect(o.rondVerkoopAf).not.toHaveBeenCalled()
  })
})
