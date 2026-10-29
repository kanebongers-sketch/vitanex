import { describe, expect, it } from 'vitest'
import { handtekeningKlopt, tekenStripe, TOLERANTIE_S } from './stripe-handtekening'
import { leesEvent, leesSessie, sessieKlaar, SESSIE_ID } from './stripe-event'
import { afsluitbaar, allesAfsluitbaar, mailAfzender, pakketVanPrijs, prijsEnvNaam, stripePrijs, stripeSleutel, webhookGeheim } from './config'
import { checkoutFormulier } from './stripe-api'
import { PROEFDAGEN } from './pakketten'

const GEHEIM = 'whsec_test_geheim'
const NU = 1_760_000_000
const ID = '0b6f7c1e-2a3d-4e5f-8a9b-0c1d2e3f4a5b'

describe('handtekeningKlopt', () => {
  const body = '{"id":"evt_1","type":"x"}'
  const kop = (tijd: number, h = tekenStripe(body, GEHEIM, tijd)) => `t=${tijd},v1=${h}`
  it('een goede handtekening', () => {
    expect(handtekeningKlopt(body, kop(NU), GEHEIM, NU)).toBe(true)
    expect(handtekeningKlopt(body, `t=${NU},v1=${'0'.repeat(64)},v1=${tekenStripe(body, GEHEIM, NU)}`, GEHEIM, NU)).toBe(true)
  })
  it('een aangepaste body, ander geheim of oude tijd faalt', () => {
    expect(handtekeningKlopt(`${body} `, kop(NU), GEHEIM, NU)).toBe(false)
    expect(handtekeningKlopt(body, kop(NU), 'whsec_ander', NU)).toBe(false)
    expect(handtekeningKlopt(body, kop(NU - TOLERANTIE_S - 1), GEHEIM, NU)).toBe(false)
  })
  it('een kapotte of lege kop faalt', () => {
    expect(handtekeningKlopt(body, null, GEHEIM, NU)).toBe(false)
    expect(handtekeningKlopt(body, 'v1=abc', GEHEIM, NU)).toBe(false)
    expect(handtekeningKlopt(body, `t=${NU}`, GEHEIM, NU)).toBe(false)
    expect(handtekeningKlopt(body, kop(NU), '', NU)).toBe(false)
  })
})

describe('leesEvent', () => {
  const sessie = { id: 'cs_test_abc', status: 'complete', mode: 'subscription', customer: 'cus_1', subscription: { id: 'sub_1' }, payment_status: 'no_payment_required', metadata: { aanmelding_id: ID } }
  it('een afgeronde checkout', () => {
    expect(leesEvent({ id: 'evt_1', type: 'checkout.session.completed', data: { object: sessie } })).toEqual({
      soort: 'sessie_afgerond', id: 'evt_1', sessie: { sessieId: 'cs_test_abc', aanmeldingId: ID, status: 'complete', betaalStatus: 'no_payment_required', mode: 'subscription', klantId: 'cus_1', abonnementId: 'sub_1' },
    })
  })
  it('abonnementen en facturen (oude en nieuwe vorm)', () => {
    expect(leesEvent({ id: 'evt_2', type: 'customer.subscription.updated', data: { object: { id: 'sub_1', status: 'past_due' } } })).toEqual({ soort: 'abonnement', id: 'evt_2', abonnementId: 'sub_1', stripeStatus: 'past_due', prijzen: [] })
    // De regels van het abonnement: een per los pakket (prijs als id of als object).
    const items = { data: [{ price: { id: 'price_lessen1' } }, { price: 'price_groei12' }, { price: { id: 'prod_geenprijs' } }] }
    expect(leesEvent({ id: 'evt_6', type: 'customer.subscription.updated', data: { object: { id: 'sub_1', status: 'active', items } } })).toEqual({ soort: 'abonnement', id: 'evt_6', abonnementId: 'sub_1', stripeStatus: 'active', prijzen: ['price_lessen1', 'price_groei12'] })
    expect(leesEvent({ id: 'evt_3', type: 'customer.subscription.deleted', data: { object: { id: 'sub_1' } } })).toEqual({ soort: 'abonnement_weg', id: 'evt_3', abonnementId: 'sub_1' })
    expect(leesEvent({ id: 'evt_4', type: 'invoice.payment_failed', data: { object: { subscription: 'sub_1' } } })).toEqual({ soort: 'betaling_mislukt', id: 'evt_4', abonnementId: 'sub_1' })
    expect(leesEvent({ id: 'evt_5', type: 'invoice.payment_failed', data: { object: { parent: { subscription_details: { subscription: 'sub_2' } } } } })).toEqual({ soort: 'betaling_mislukt', id: 'evt_5', abonnementId: 'sub_2' })
  })
  it('onbekend of kapot', () => {
    expect(leesEvent({ id: 'evt_6', type: 'charge.refunded', data: { object: {} } })).toEqual({ soort: 'overig', id: 'evt_6', type: 'charge.refunded' })
    expect(leesEvent({ id: 'x', type: 'checkout.session.completed', data: { object: sessie } })).toBeNull()
    expect(leesEvent(null)).toBeNull()
  })
  it('een aanmelding-id moet een uuid zijn', () => {
    expect(leesSessie({ ...sessie, metadata: { aanmelding_id: "1' or 1=1" } })?.aanmeldingId).toBeNull()
    expect(leesSessie({ id: 'pi_1' })).toBeNull()
  })
  it('alleen een afgerond abonnement telt', () => {
    const s = leesSessie(sessie)!
    expect(sessieKlaar(s)).toBe(true)
    expect(sessieKlaar({ ...s, status: 'open' })).toBe(false)
    expect(sessieKlaar({ ...s, betaalStatus: 'unpaid' })).toBe(false)
    expect(sessieKlaar({ ...s, betaalStatus: null })).toBe(false)
    expect(sessieKlaar({ ...s, mode: 'payment' })).toBe(false)
  })
  it('vorm van een sessie-id', () => {
    expect(SESSIE_ID.test('cs_test_a1B2c3D4e5F6g7')).toBe(true)
    expect(SESSIE_ID.test('cs_test_../../x')).toBe(false)
  })
})

describe('config', () => {
  const env = { AIYOURGYM_STRIPE_SECRET_KEY: 'sk_test_123', AIYOURGYM_STRIPE_PRIJS_LESSEN: 'price_ABC123xyz', AIYOURGYM_STRIPE_WEBHOOK_SECRET: 'whsec_1' }
  it('een pakket is afsluitbaar met sleutel en prijs, los van de prijs op de website', () => {
    expect(prijsEnvNaam('lessen')).toBe('AIYOURGYM_STRIPE_PRIJS_LESSEN')
    expect(prijsEnvNaam('administratie')).toBe('AIYOURGYM_STRIPE_PRIJS_ADMINISTRATIE')
    expect(afsluitbaar('lessen', env)).toBe(true)
    expect(afsluitbaar('groei', env)).toBe(false)
    expect(afsluitbaar('lessen', { ...env, AIYOURGYM_STRIPE_SECRET_KEY: undefined })).toBe(false)
  })
  it('een keuze is alleen afsluitbaar als elk pakket een prijs heeft', () => {
    expect(allesAfsluitbaar(['lessen'], env)).toBe(true)
    expect(allesAfsluitbaar(['lessen', 'groei'], env)).toBe(false)
    expect(allesAfsluitbaar([], env)).toBe(false)
  })
  it('van een Stripe-prijs terug naar het pakket', () => {
    expect(pakketVanPrijs('price_ABC123xyz', env)).toBe('lessen')
    expect(pakketVanPrijs('price_onbekend1', env)).toBeNull()
  })
  it('alleen waarden die op Stripe lijken', () => {
    expect(stripePrijs('lessen', { AIYOURGYM_STRIPE_PRIJS_LESSEN: 'prod_123456' })).toBeNull()
    expect(stripeSleutel({ AIYOURGYM_STRIPE_SECRET_KEY: 'pk_test_1' })).toBeNull()
    expect(webhookGeheim({ AIYOURGYM_STRIPE_WEBHOOK_SECRET: 'geheim' })).toBeNull()
    expect(webhookGeheim(env)).toBe('whsec_1')
  })
  it('mailen alleen met afzender en Resend-sleutel', () => {
    expect(mailAfzender({ AIYOURGYM_RESEND_FROM: 'AI Your Gym <hallo@aiyourgym.com>' })).toBeNull()
    expect(mailAfzender({ AIYOURGYM_RESEND_FROM: 'a@b.nl', RESEND_API_KEY: 're_1' })).toBe('a@b.nl')
  })
})

describe('checkoutFormulier', () => {
  it('abonnement met proefperiode, per vestiging, met het aanmelding-id', () => {
    const f = checkoutFormulier({
      aanmeldingId: ID,
      prijzen: [{ pakket: 'lessen', prijsId: 'price_1' }, { pakket: 'groei', prijsId: 'price_2' }],
      succesUrl: 'https://aiyourgym.com/welkom?sessie={CHECKOUT_SESSION_ID}',
      terugUrl: 'https://aiyourgym.com/aanmelden',
      aanmelding: { pakketten: ['lessen', 'groei'], sportschoolNaam: 'Sterk', aantalVestigingen: 3, slug: 'sterk', eigenaarNaam: 'S', eigenaarEmail: 's@b.nl', eigenaarTelefoon: '0612345678', wachtwoord: 'Geheim-Wachtwoord-77' },
    })
    // Het wachtwoord gaat nooit naar Stripe.
    expect([...f.values()].some((v) => v.includes('Geheim-Wachtwoord-77'))).toBe(false)
    expect(f.get('mode')).toBe('subscription')
    // Een regel per los pakket, elk met het aantal vestigingen.
    expect(f.get('line_items[0][price]')).toBe('price_1')
    expect(f.get('line_items[0][quantity]')).toBe('3')
    expect(f.get('line_items[1][price]')).toBe('price_2')
    expect(f.get('line_items[1][quantity]')).toBe('3')
    expect(f.has('line_items[2][price]')).toBe(false)
    expect(f.get('metadata[pakketten]')).toBe('lessen,groei')
    expect(f.get('subscription_data[metadata][pakketten]')).toBe('lessen,groei')
    expect(f.get('subscription_data[trial_period_days]')).toBe(String(PROEFDAGEN))
    expect(f.get('metadata[aanmelding_id]')).toBe(ID)
    expect(f.get('subscription_data[metadata][aanmelding_id]')).toBe(ID)
    expect(f.get('success_url')).toContain('{CHECKOUT_SESSION_ID}')
  })
})
