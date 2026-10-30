import { describe, expect, it } from 'vitest'
import { handtekeningKlopt, tekenStripe, TOLERANTIE_S } from './stripe-handtekening'
import { leesEvent, leesSessie, sessieKlaar, SESSIE_ID } from './stripe-event'
import { afsluitbaar, allesAfsluitbaar, bundelAfsluitbaar, eigenPrijzen, mailAfzender, pakketVanPrijs, prijsEnvNaam, stripePrijs, stripePrijsAlles, stripeRegels, stripeSleutel, webhookGeheim } from './config'
import { checkoutFormulier, wisselFormulier, wisselSleutel } from './stripe-api'
import { PAKKET_SLEUTELS } from './pakketten'

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
  it('de bundelprijs (alle zes): alleen een price-id, geen los pakket', () => {
    expect(stripePrijsAlles({ AIYOURGYM_STRIPE_PRIJS_ALLES: 'price_alles0001' })).toBe('price_alles0001')
    expect(stripePrijsAlles({ AIYOURGYM_STRIPE_PRIJS_ALLES: 'prod_alles0001' })).toBeNull()
    expect(stripePrijsAlles({})).toBeNull()
    expect(pakketVanPrijs('price_alles0001', { AIYOURGYM_STRIPE_PRIJS_ALLES: 'price_alles0001' })).toBeNull()
    expect(bundelAfsluitbaar({ ...env, AIYOURGYM_STRIPE_PRIJS_ALLES: 'price_alles0001' })).toBe(true)
    expect(bundelAfsluitbaar({ AIYOURGYM_STRIPE_PRIJS_ALLES: 'price_alles0001' })).toBe(false)
  })
  it('mailen alleen met afzender en Resend-sleutel', () => {
    expect(mailAfzender({ AIYOURGYM_RESEND_FROM: 'AI Your Gym <hallo@aiyourgym.com>' })).toBeNull()
    expect(mailAfzender({ AIYOURGYM_RESEND_FROM: 'a@b.nl', RESEND_API_KEY: 're_1' })).toBe('a@b.nl')
  })
})

describe('checkoutFormulier', () => {
  it('abonnement zonder proefperiode, per vestiging, met het aanmelding-id', () => {
    const f = checkoutFormulier({
      aanmeldingId: ID,
      regels: [{ regel: 'lessen', prijsId: 'price_1' }, { regel: 'groei', prijsId: 'price_2' }],
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
    // Geen proefperiode (besluit Kane 30-10-2026): de eerste maand wordt meteen betaald.
    expect([...f.keys()].some((k) => k.includes('trial'))).toBe(false)
    expect(f.get('metadata[aanmelding_id]')).toBe(ID)
    expect(f.get('subscription_data[metadata][aanmelding_id]')).toBe(ID)
    expect(f.get('success_url')).toContain('{CHECKOUT_SESSION_ID}')
  })
})

describe('bundel: alle zes pakketten met een eigen Stripe-prijs (besluit Kane 30-10-2026)', () => {
  const LOS = Object.fromEntries(PAKKET_SLEUTELS.map((p) => [`AIYOURGYM_STRIPE_PRIJS_${p.toUpperCase()}`, `price_${p}0001`]))
  const env = { AIYOURGYM_STRIPE_SECRET_KEY: 'sk_test_123', ...LOS, AIYOURGYM_STRIPE_PRIJS_ALLES: 'price_alles0001' }
  const aanmelding = { pakketten: [...PAKKET_SLEUTELS], sportschoolNaam: 'Sterk', aantalVestigingen: 2, slug: 'sterk', eigenaarNaam: 'S', eigenaarEmail: 's@b.nl', eigenaarTelefoon: '0612345678', wachtwoord: 'Geheim-Wachtwoord-77' }

  it('alle zes met bundelprijs: een regel met de bundel', () => {
    expect(stripeRegels([...PAKKET_SLEUTELS], env)).toEqual([{ regel: 'alles', prijsId: 'price_alles0001' }])
  })
  it('minder dan zes: een regel per pakket, ook met bundelprijs', () => {
    const vijf = PAKKET_SLEUTELS.filter((p) => p !== 'groei')
    expect(stripeRegels(vijf, env)).toEqual(vijf.map((p) => ({ regel: p, prijsId: `price_${p}0001` })))
  })
  it('alle zes zonder bundelprijs: zes losse regels (als die er zijn)', () => {
    expect(stripeRegels([...PAKKET_SLEUTELS], LOS)).toHaveLength(6)
    expect(stripeRegels([...PAKKET_SLEUTELS], { ...LOS, AIYOURGYM_STRIPE_PRIJS_GROEI: undefined })).toBeNull()
  })
  it('alleen de bundelprijs: alle zes zijn afsluitbaar, een losse keuze niet', () => {
    const alleenBundel = { AIYOURGYM_STRIPE_SECRET_KEY: 'sk_test_123', AIYOURGYM_STRIPE_PRIJS_ALLES: 'price_alles0001' }
    expect(allesAfsluitbaar([...PAKKET_SLEUTELS], alleenBundel)).toBe(true)
    expect(allesAfsluitbaar(['lessen'], alleenBundel)).toBe(false)
    expect(allesAfsluitbaar([...PAKKET_SLEUTELS], { AIYOURGYM_STRIPE_PRIJS_ALLES: 'price_alles0001' })).toBe(false)
  })
  it('eigen prijzen: de zes losse en de bundel', () => {
    expect(eigenPrijzen(env)).toHaveLength(7)
    expect(eigenPrijzen(env)).toContain('price_alles0001')
    expect(eigenPrijzen({})).toEqual([])
  })
  it('checkout met alle zes: een regel met de bundel en het aantal vestigingen', () => {
    const regels = stripeRegels([...PAKKET_SLEUTELS], env)!
    const f = checkoutFormulier({ aanmeldingId: ID, aanmelding, regels, succesUrl: 'https://aiyourgym.com/welkom', terugUrl: 'https://aiyourgym.com/aanmelden' })
    expect(f.get('line_items[0][price]')).toBe('price_alles0001')
    expect(f.get('line_items[0][quantity]')).toBe('2')
    expect(f.has('line_items[1][price]')).toBe(false)
    // De metadata noemt nog steeds de zes pakketten.
    expect(f.get('subscription_data[metadata][pakketten]')).toBe(PAKKET_SLEUTELS.join(','))
  })
  it('regels omzetten in een verzoek: weg, erbij met het aantal, en naar rato', () => {
    const f = wisselFormulier({ weg: ['si_a', 'si_b'], erbij: ['price_alles0001'] }, 3)
    expect(f.get('items[0][id]')).toBe('si_a')
    expect(f.get('items[0][deleted]')).toBe('true')
    expect(f.get('items[1][id]')).toBe('si_b')
    expect(f.get('items[1][deleted]')).toBe('true')
    expect(f.get('items[2][price]')).toBe('price_alles0001')
    expect(f.get('items[2][quantity]')).toBe('3')
    expect(f.has('items[3][price]')).toBe(false)
    expect(f.get('proration_behavior')).toBe('create_prorations')
  })
  it('de idempotentiesleutel: gelijk bij twee keer klikken, anders na een echte wijziging', () => {
    const w = { weg: ['si_a', 'si_b'], erbij: ['price_alles0001'] }
    const een = wisselSleutel('sub_1', ['si_a', 'si_b', 'si_c'], w)
    expect(wisselSleutel('sub_1', ['si_c', 'si_b', 'si_a'], { weg: ['si_b', 'si_a'], erbij: ['price_alles0001'] })).toBe(een)
    expect(wisselSleutel('sub_1', ['si_x', 'si_b', 'si_c'], w)).not.toBe(een)
    expect(wisselSleutel('sub_2', ['si_a', 'si_b', 'si_c'], w)).not.toBe(een)
    expect(een.length).toBeLessThanOrEqual(255)
    expect(een.startsWith('ayg_wissel_sub_1_')).toBe(true)
  })
  it('een abonnement met de bundel komt in het event als prijs mee', () => {
    const items = { data: [{ price: { id: 'price_alles0001' } }] }
    expect(leesEvent({ id: 'evt_b1', type: 'customer.subscription.updated', data: { object: { id: 'sub_1', status: 'active', items } } })).toMatchObject({ soort: 'abonnement', prijzen: ['price_alles0001'] })
  })
})
