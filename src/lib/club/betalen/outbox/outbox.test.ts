import { describe, expect, it } from 'vitest'
import { deelFoutIn, eersteBetalingFormulier, incassoFormulier, machtigingFormulier } from '../stripe-api'
import { NepOutboxOpslag } from './nep-opslag'
import { NepStripe } from './nep-stripe'
import { idempotentieSleutel, leesOpdracht } from './opdracht'
import { MAX_POGINGEN, naMislukking, vroegsteVolgende, wachttijd } from './wachten'
import { werkOutboxAf, type OutboxDeps } from './werker'

// Testgegevens: alleen verzonnen ids en bedragen, geen persoonsgegevens.
const ORG = '11111111-1111-4111-8111-111111111111'
const FACTUUR = '22222222-2222-4222-8222-222222222222'
const BETALING = '33333333-3333-4333-8333-333333333333'
const OPDRACHT = '55555555-5555-4555-8555-555555555555'
const ACCOUNT = 'acct_TESTGYM0001'
const MINUUT = 60_000

const INCASSO = { betaling_id: BETALING, factuur_id: FACTUUR, klant: 'cus_test0001', betaalmethode: 'pm_test0001', mandaat: 'mandate_test0001', bedrag_cent: 2500, omschrijving: 'Lidmaatschap november' }

function opzet() {
  let nu = new Date('2026-11-01T06:00:00Z')
  const opslag = new NepOutboxOpslag(() => nu)
  const stripe = new NepStripe()
  opslag.accounts.set(ORG, ACCOUNT)
  opslag.voegToe({ id: OPDRACHT, organisatieId: ORG, soort: 'incasso', gegevens: INCASSO })
  const deps: OutboxDeps = { opslag, stripe, nu: () => nu }
  return { opslag, stripe, deps, verzet: (ms: number) => (nu = new Date(nu.getTime() + ms)) }
}

describe('lidgeld-outbox: wachten', () => {
  it('1 minuut, 5 minuten, 30 minuten, 2 uur, 12 uur, daarna 12 uur', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(wachttijd)).toEqual([1, 5, 30, 120, 720, 720, 720].map((m) => m * MINUUT))
  })

  it('na 8 pogingen vast', () => {
    const nu = new Date('2026-11-01T00:00:00Z')
    for (let p = 1; p < MAX_POGINGEN; p++) expect(naMislukking(p, nu).status).toBe('opnieuw')
    expect(naMislukking(MAX_POGINGEN, nu)).toEqual({ status: 'vast' })
    const eerste = naMislukking(1, nu)
    expect(eerste.status === 'opnieuw' && eerste.volgendeOp.getTime() - nu.getTime()).toBe(MINUUT)
  })

  it('vroegste volgende poging vanaf ontvangst: som van de wachttijden', () => {
    const t = new Date('2026-11-01T00:00:00Z')
    expect(vroegsteVolgende(t, 0).getTime()).toBe(t.getTime())
    expect(vroegsteVolgende(t, 3).getTime() - t.getTime()).toBe(36 * MINUUT)
  })

  it('geld: vast zodra de volgende poging buiten het venster van de sleutel valt', () => {
    const eersteOp = new Date('2026-11-01T00:00:00Z')
    const laat = new Date(eersteOp.getTime() + 15 * 60 * MINUUT)
    expect(naMislukking(6, laat, eersteOp)).toEqual({ status: 'vast' })
    expect(naMislukking(6, laat).status).toBe('opnieuw')
  })
})

describe('lidgeld-outbox: opdrachten en formulieren', () => {
  it('vaste idempotentiesleutel ayg_<soort>_<id>', () => {
    expect(idempotentieSleutel('incasso', OPDRACHT)).toBe(`ayg_incasso_${OPDRACHT}`)
  })

  it('ongeldige gegevens worden nooit uitgevoerd', () => {
    const basis = { id: OPDRACHT, organisatieId: ORG, soort: 'incasso', sleutel: null, lidId: null, factuurId: null, betalingId: null, pogingen: 0, eersteOp: null }
    expect(leesOpdracht({ ...basis, gegevens: INCASSO })?.soort).toBe('incasso')
    expect(leesOpdracht({ ...basis, gegevens: { ...INCASSO, bedrag_cent: 0 } })).toBeNull()
    expect(leesOpdracht({ ...basis, gegevens: { ...INCASSO, bedrag_cent: 12.5 } })).toBeNull()
    expect(leesOpdracht({ ...basis, gegevens: { ...INCASSO, mandaat: 'pm_verkeerd' } })).toBeNull()
    expect(leesOpdracht({ ...basis, soort: 'iets', gegevens: INCASSO })).toBeNull()
    expect(leesOpdracht({ ...basis, soort: 'constructor', gegevens: INCASSO })).toBeNull()
    expect(leesOpdracht({ ...basis, sleutel: 'geen geldige sleutel', gegevens: INCASSO })).toBeNull()
  })

  it('soorten uit de database: checkout_sessie wordt betalen of machtigen, kolommen winnen', () => {
    const basis = { id: OPDRACHT, organisatieId: ORG, sleutel: `ayg_checkout_sessie_${BETALING}`, lidId: null, factuurId: FACTUUR, betalingId: BETALING, pogingen: 0, eersteOp: null }
    const betalen = leesOpdracht({ ...basis, soort: 'checkout_sessie', gegevens: { klant: 'cus_test0001', bedrag_cent: 3000, omschrijving: 'Eerste maand', succes_url: 'https://a/s', terug_url: 'https://a/t' } })
    expect(betalen?.soort).toBe('eerste_betaling')
    expect(betalen?.sleutel).toBe(`ayg_checkout_sessie_${BETALING}`)
    const machtigen = leesOpdracht({ ...basis, soort: 'checkout_sessie', gegevens: { modus: 'setup', klant: 'cus_test0001', succes_url: 'https://a/s', terug_url: 'https://a/t' } })
    expect(machtigen?.soort).toBe('machtiging')
    const weg = leesOpdracht({ ...basis, soort: 'klant_verwijderen', gegevens: { stripe_klant_id: 'cus_test0001', stripe_account_id: ACCOUNT } })
    expect(weg).toMatchObject({ soort: 'klant_verwijderen', invoer: { klant: 'cus_test0001', account: ACCOUNT } })
  })

  it('incasso: sepa_debit, off_session, met machtiging en koppeling', () => {
    const f = incassoFormulier({ organisatieId: ORG, factuurId: FACTUUR, betalingId: BETALING, klant: 'cus_1', betaalmethode: 'pm_1', mandaat: 'mandate_1', bedragCent: 2500, platformFeeCent: 0, omschrijving: 'x' })
    expect(f.get('payment_method_types[0]')).toBe('sepa_debit')
    expect(f.get('off_session')).toBe('true')
    expect(f.get('confirm')).toBe('true')
    expect(f.get('mandate')).toBe('mandate_1')
    expect(f.get('metadata[betaling_id]')).toBe(BETALING)
    expect(f.has('application_fee_amount')).toBe(false)
  })

  it('eerste betaling: iDEAL met setup_future_usage off_session', () => {
    const f = eersteBetalingFormulier({ organisatieId: ORG, factuurId: FACTUUR, betalingId: BETALING, klant: 'cus_1', omschrijving: 'Eerste maand', bedragCent: 3000, platformFeeCent: 0, succesUrl: 'https://a/s', terugUrl: 'https://a/t' })
    expect(f.get('payment_method_types[0]')).toBe('ideal')
    expect(f.get('payment_intent_data[setup_future_usage]')).toBe('off_session')
    expect(f.get('payment_intent_data[metadata][factuur_id]')).toBe(FACTUUR)
    expect(f.get('customer')).toBe('cus_1')
  })

  it('machtiging zonder betaling: setup met sepa_debit', () => {
    const f = machtigingFormulier({ organisatieId: ORG, contractId: null, klant: 'cus_1', succesUrl: 'https://a/s', terugUrl: 'https://a/t' })
    expect(f.get('mode')).toBe('setup')
    expect(f.get('payment_method_types[0]')).toBe('sepa_debit')
    expect(f.has('metadata[contract_id]')).toBe(false)
  })

  it('foutindeling: time-out en 5xx tijdelijk, 402 afgewezen, 400 ongeldig', () => {
    expect(deelFoutIn(0, 'timeout', null)).toBe('tijdelijk')
    expect(deelFoutIn(503, null, 'api_error')).toBe('tijdelijk')
    expect(deelFoutIn(429, null, null)).toBe('tijdelijk')
    expect(deelFoutIn(400, 'idempotency_key_in_use', 'idempotency_error')).toBe('tijdelijk')
    expect(deelFoutIn(402, 'card_declined', 'card_error')).toBe('afgewezen')
    expect(deelFoutIn(400, 'parameter_invalid', 'invalid_request_error')).toBe('ongeldig')
  })
})

describe('lidgeld-outbox: de werker', () => {
  it('time-out en daarna opnieuw: een PaymentIntent', async () => {
    const o = opzet()
    o.stripe.verliesAntwoorden = 1
    const eerste = await werkOutboxAf(o.deps, { max: 10 })
    expect(eerste.opnieuw).toBe(1)
    expect(o.stripe.aantal('payment_intent')).toBe(1)
    // Te vroeg: nog niets.
    expect((await werkOutboxAf(o.deps, { max: 10 })).geclaimd).toBe(0)
    o.verzet(MINUUT)
    const tweede = await werkOutboxAf(o.deps, { max: 10 })
    expect(tweede.klaar).toBe(1)
    expect(o.stripe.aantal('payment_intent')).toBe(1)
    const regel = o.opslag.opdrachten.get(OPDRACHT)
    expect(regel?.status).toBe('klaar')
    expect(regel?.laatste?.status === 'klaar' && regel.laatste.stripeId).toBe(o.stripe.aangemaakt[0].id)
  })

  it('netwerk weg: niets aangemaakt, later wel precies een', async () => {
    const o = opzet()
    o.stripe.onbereikbaar = 2
    await werkOutboxAf(o.deps, { max: 10 })
    o.verzet(MINUUT)
    await werkOutboxAf(o.deps, { max: 10 })
    o.verzet(5 * MINUUT)
    await werkOutboxAf(o.deps, { max: 10 })
    expect(o.stripe.aantal('payment_intent')).toBe(1)
    expect(o.opslag.opdrachten.get(OPDRACHT)?.status).toBe('klaar')
  })

  it('vijf werkers tegelijk: een PaymentIntent', async () => {
    const o = opzet()
    await Promise.all(Array.from({ length: 5 }, () => werkOutboxAf(o.deps, { max: 10 })))
    expect(o.stripe.aantal('payment_intent')).toBe(1)
  })

  it('zelfde sleutel met andere vraag: geweigerd door Stripe, opdracht vast', async () => {
    const o = opzet()
    await o.stripe.maakIncasso(ACCOUNT, idempotentieSleutel('incasso', OPDRACHT), { organisatieId: ORG, factuurId: FACTUUR, betalingId: BETALING, klant: 'cus_test0001', betaalmethode: 'pm_test0001', mandaat: 'mandate_test0001', bedragCent: 9999, platformFeeCent: 0, omschrijving: 'anders' })
    await werkOutboxAf(o.deps, { max: 10 })
    expect(o.stripe.aantal('payment_intent')).toBe(1)
    expect(o.opslag.opdrachten.get(OPDRACHT)?.status).toBe('vast')
    expect(o.opslag.meldingen).toHaveLength(1)
  })

  it('nieuwe klant: naam en e-mail pas op het laatste moment, daarna een klant', async () => {
    const o = opzet()
    o.opslag.opdrachten.clear()
    const LID = '66666666-6666-4666-8666-666666666666'
    o.opslag.leden.set(LID, { naam: 'Test Lid', email: null })
    o.opslag.voegToe({ id: OPDRACHT, organisatieId: ORG, soort: 'klant_aanmaken', lidId: LID, gegevens: {} })
    await Promise.all([werkOutboxAf(o.deps, { max: 5 }), werkOutboxAf(o.deps, { max: 5 })])
    expect(o.stripe.aantal('klant')).toBe(1)
    expect(o.opslag.opdrachten.get(OPDRACHT)?.status).toBe('klaar')
  })

  it('toestand gewijzigd vlak voor de aanroep: geannuleerd, niets bij Stripe', async () => {
    const o = opzet()
    o.opslag.controle = () => 'stop'
    const v = await werkOutboxAf(o.deps, { max: 10 })
    expect(v.geannuleerd).toBe(1)
    expect(o.stripe.aangemaakt).toHaveLength(0)
  })

  it('steeds een time-out: na 8 pogingen vast met melding, nooit meer dan een PaymentIntent', async () => {
    const o = opzet()
    o.stripe.verliesAntwoorden = 100
    for (let i = 0; i < 12; i++) {
      await werkOutboxAf(o.deps, { max: 10 })
      o.verzet(13 * 60 * MINUUT)
    }
    expect(o.opslag.opdrachten.get(OPDRACHT)?.status).toBe('vast')
    expect(o.stripe.aantal('payment_intent')).toBe(1)
    expect(o.opslag.meldingen).toHaveLength(1)
  })
})
