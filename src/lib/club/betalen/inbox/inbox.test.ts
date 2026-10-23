import { describe, expect, it } from 'vitest'
import { NepStripe } from '../outbox/nep-stripe'
import { kiesKanaal, leesInboxEvent } from './event'
import { NepInboxOpslag } from './nep-opslag'
import { padNaar, volgendeToestand } from './overgang'
import { werkInboxAf, type InboxDeps } from './verwerk'

// Testgegevens: alleen verzonnen ids en bedragen, geen persoonsgegevens.
const ORG = '11111111-1111-4111-8111-111111111111'
const FACTUUR = '22222222-2222-4222-8222-222222222222'
const BETALING = '33333333-3333-4333-8333-333333333333'
const ACCOUNT = 'acct_TESTGYM0001'
const PI = 'pi_testlidgeld0001'
const BEDRAG = 2500

const META = { organisatie_id: ORG, factuur_id: FACTUUR, betaling_id: BETALING }

interface Snap {
  status: string
  terug?: number
  geschil?: string
}

function intent(s: Snap) {
  const refunds = s.terug ? [{ id: 're_testlidgeld0001', amount: s.terug, status: 'succeeded' }] : []
  return { id: PI, object: 'payment_intent', status: s.status, amount: BEDRAG, currency: 'eur', livemode: false, metadata: META, latest_charge: { id: 'ch_testlidgeld0001', amount_refunded: s.terug ?? 0, payment_intent: PI, refunds: { object: 'list', data: refunds } } }
}

function event(id: string, type: string, object: unknown, account: string = ACCOUNT) {
  return { id, type, account, livemode: false, data: { object } }
}

function opzet(betaling: Partial<{ status: string; bedragCent: number }> = {}) {
  let nu = new Date('2026-10-23T08:00:00Z')
  const opslag = new NepInboxOpslag(() => nu)
  const stripe = new NepStripe()
  opslag.accounts.set(ORG, ACCOUNT)
  opslag.betalingen.set(BETALING, { id: BETALING, organisatieId: ORG, factuurId: FACTUUR, bedragCent: betaling.bedragCent ?? BEDRAG, status: 'aangeboden', terugIds: [], paymentIntent: null })
  const deps: InboxDeps = { opslag, stripe, liveVerwacht: false, nu: () => nu }
  const zetStripe = (s: Snap) => {
    stripe.zet(ACCOUNT, PI, intent(s))
    stripe.geschillen.set(`${ACCOUNT}:${PI}`, s.geschil ? [{ id: 'dp_testlidgeld0001', status: s.geschil, payment_intent: PI }] : [])
  }
  const ontvang = async (body: unknown) => {
    const e = leesInboxEvent(body)
    if (!e) throw new Error('ongeldig testevent')
    if ((await opslag.bewaar(e)) === 'nieuw') await werkInboxAf(deps, { max: 1, eventId: e.eventId })
    return e.eventId
  }
  return { opslag, stripe, deps, zetStripe, ontvang, verzet: (ms: number) => (nu = new Date(nu.getTime() + ms)) }
}

// De vier events van een betaling, elk met de stand bij Stripe op dat moment.
const VERLOOP: { body: unknown; snap: Snap }[] = [
  { body: event('evt_test_processing', 'payment_intent.processing', { id: PI }), snap: { status: 'processing' } },
  { body: event('evt_test_succeeded', 'payment_intent.succeeded', { id: PI }), snap: { status: 'succeeded' } },
  { body: event('evt_test_refunded', 'charge.refunded', { id: 'ch_testlidgeld0001', payment_intent: PI, metadata: {} }), snap: { status: 'succeeded', terug: 500 } },
  { body: event('evt_test_dispute', 'charge.dispute.created', { id: 'dp_testlidgeld0001', payment_intent: PI }), snap: { status: 'succeeded', terug: 500, geschil: 'needs_response' } },
]

function permutaties<T>(lijst: T[]): T[][] {
  if (lijst.length <= 1) return [lijst]
  return lijst.flatMap((x, i) => permutaties([...lijst.slice(0, i), ...lijst.slice(i + 1)]).map((rest) => [x, ...rest]))
}

function zetObjecten(o: ReturnType<typeof opzet>) {
  o.stripe.zet(ACCOUNT, 'ch_testlidgeld0001', { id: 'ch_testlidgeld0001', payment_intent: PI })
  o.stripe.zet(ACCOUNT, 'dp_testlidgeld0001', { id: 'dp_testlidgeld0001', payment_intent: PI })
}

describe('lidgeld-inbox: lezen en kanaal', () => {
  it('leest een nieuw event zonder payload, alleen ids', () => {
    const e = leesInboxEvent(event('evt_test_123456', 'payment_intent.succeeded', { id: PI, amount: 1 }))
    expect(e).toEqual({ eventId: 'evt_test_123456', type: 'payment_intent.succeeded', object: 'payment_intent', account: ACCOUNT, objectId: PI, livemode: false })
    expect(leesInboxEvent(event('evt_test_123456', 'customer.created', { id: 'cus_x' }))).toBeNull()
    expect(leesInboxEvent(event('evt_test_123456', 'payment_intent.succeeded', { id: 'ch_verkeerd' }))).toBeNull()
  })

  it('deauthorized gebruikt het account van het event', () => {
    const e = leesInboxEvent(event('evt_test_123456', 'account.application.deauthorized', { id: 'ca_app' }))
    expect(e?.objectId).toBe(ACCOUNT)
  })

  it('zonder lidgeld gaat alles naar de losse verkoop', () => {
    expect(kiesKanaal(event('evt_test_123456', 'payment_intent.succeeded', { id: PI }), false)).toBe('verkoop')
  })

  it('met lidgeld: verkoop blijft verkoop, lidgeld gaat naar de inbox', () => {
    const verkoopSessie = { id: 'cs_test_1', mode: 'payment', metadata: { verkoop_id: BETALING } }
    expect(kiesKanaal(event('evt_test_123456', 'checkout.session.completed', verkoopSessie), true)).toBe('verkoop')
    expect(kiesKanaal(event('evt_test_123456', 'checkout.session.completed', { id: 'cs_test_1', mode: 'payment', metadata: META }), true)).toBe('inbox')
    expect(kiesKanaal(event('evt_test_123456', 'checkout.session.completed', { id: 'cs_test_1', mode: 'setup', metadata: {} }), true)).toBe('inbox')
    expect(kiesKanaal(event('evt_test_123456', 'charge.refunded', { id: 'ch_1', metadata: { verkoop_id: BETALING } }), true)).toBe('verkoop')
    expect(kiesKanaal(event('evt_test_123456', 'charge.refunded', { id: 'ch_1', metadata: {} }), true)).toBe('inbox')
    expect(kiesKanaal(event('evt_test_123456', 'mandate.updated', { id: 'mandate_1' }), true)).toBe('inbox')
  })
})

describe('lidgeld-inbox: overgangen alleen vooruit', () => {
  it('pad door geslaagd als de storno eerst binnenkomt', () => {
    expect(padNaar('aangeboden', 'gestorneerd')).toEqual(['in_behandeling', 'geslaagd', 'gestorneerd'])
    expect(padNaar('geslaagd', 'in_behandeling')).toBeNull()
    expect(padNaar('mislukt', 'geslaagd')).toBeNull()
  })

  it('een oudere stand verandert niets', () => {
    const o = volgendeToestand({ status: 'geslaagd', terugIds: ['re_1'] }, { basis: 'in_behandeling', terugbetalingen: [], geschil: 'geen' })
    expect(o).toEqual({ wijzigt: false, naar: 'geslaagd', pad: [], nieuweTerug: [], verdwenenTerug: ['re_1'] })
  })

  it('terugbetalingen per id een keer, en alleen bij een betaalde betaling', () => {
    const t = [{ id: 're_1', cent: 100 }, { id: 're_2', cent: 200 }]
    expect(volgendeToestand({ status: 'geslaagd', terugIds: ['re_1'] }, { basis: 'geslaagd', terugbetalingen: t, geschil: 'geen' }).nieuweTerug).toEqual([t[1]])
    expect(volgendeToestand({ status: 'mislukt', terugIds: [] }, { basis: 'geslaagd', terugbetalingen: t, geschil: 'geen' })).toMatchObject({ wijzigt: false, nieuweTerug: [] })
  })
})

describe('lidgeld-inbox: eerst ophalen, dan verwerken', () => {
  it('zes keer dezelfde events opnieuw: dezelfde eindstand', async () => {
    const o = opzet()
    zetObjecten(o)
    o.zetStripe({ status: 'succeeded' })
    const bodies = VERLOOP.slice(0, 2).map((v) => v.body)
    for (let ronde = 0; ronde < 6; ronde++) {
      for (const b of bodies) await o.ontvang(b)
      // Ook na opruimen van de eventtabel (bewaartermijn) mag niets dubbel.
      if (ronde === 3) o.opslag.events.clear()
    }
    expect(o.opslag.betalingen.get(BETALING)?.status).toBe('geslaagd')
    expect([...o.opslag.boekingen.keys()]).toEqual([`betaling:${BETALING}`])
  })

  it('tien gelijktijdige dubbele events: een boeking', async () => {
    const o = opzet()
    o.zetStripe({ status: 'succeeded' })
    const zelfde = VERLOOP[1].body
    const anders = Array.from({ length: 10 }, (_, i) => event(`evt_test_dubbel${i}`, 'payment_intent.succeeded', { id: PI }))
    await Promise.all([...Array.from({ length: 10 }, () => o.ontvang(zelfde)), ...anders.map((b) => o.ontvang(b))])
    expect(o.opslag.boekingen.size).toBe(1)
    expect(o.opslag.betalingen.get(BETALING)?.status).toBe('geslaagd')
    expect(o.opslag.events.size).toBe(11)
  })

  it('alle volgordes van processing, succeeded, refunded en dispute: dezelfde eindstand', async () => {
    const eindstanden = new Set<string>()
    for (const volgorde of permutaties(VERLOOP)) {
      const o = opzet()
      zetObjecten(o)
      for (const v of volgorde) {
        o.zetStripe(v.snap)
        await o.ontvang(v.body)
      }
      const b = o.opslag.betalingen.get(BETALING)
      eindstanden.add(JSON.stringify({ status: b?.status, terug: b?.terugIds, boekingen: [...o.opslag.boekingen.entries()].sort() }))
    }
    expect(eindstanden.size).toBe(1)
    const [eind] = [...eindstanden]
    expect(JSON.parse(eind)).toEqual({
      status: 'gestorneerd',
      terug: ['re_testlidgeld0001'],
      boekingen: [[`betaling:${BETALING}`, BEDRAG], [`storno:${BETALING}`, BEDRAG], ['terug:re_testlidgeld0001', 500]].sort(),
    })
  })

  it('een ander account: afwijkend, melding, geen boeking', async () => {
    const o = opzet()
    o.stripe.zet('acct_ANDEREGYM01', PI, intent({ status: 'succeeded' }))
    const id = await o.ontvang(event('evt_test_ander_account', 'payment_intent.succeeded', { id: PI }, 'acct_ANDEREGYM01'))
    expect(o.opslag.statusVan(id)).toBe('afwijkend')
    expect(o.opslag.boekingen.size).toBe(0)
    expect(o.opslag.betalingen.get(BETALING)?.status).toBe('aangeboden')
    expect(o.opslag.meldingen).toHaveLength(1)
    expect(o.opslag.meldingen[0]).toContain('account')
  })

  it('een ander bedrag: afwijkend, geen boeking', async () => {
    const o = opzet({ bedragCent: 2400 })
    o.zetStripe({ status: 'succeeded' })
    const id = await o.ontvang(VERLOOP[1].body)
    expect(o.opslag.statusVan(id)).toBe('afwijkend')
    expect(o.opslag.boekingen.size).toBe(0)
    expect(o.opslag.meldingen[0]).toContain('bedrag')
  })

  it('andere sportschool in de metadata: afwijkend', async () => {
    const o = opzet()
    o.stripe.zet(ACCOUNT, PI, { ...intent({ status: 'succeeded' }), metadata: { ...META, organisatie_id: '44444444-4444-4444-8444-444444444444' } })
    const id = await o.ontvang(VERLOOP[1].body)
    expect(o.opslag.statusVan(id)).toBe('afwijkend')
    expect(o.opslag.boekingen.size).toBe(0)
  })

  it('test-event op live of andersom: genegeerd', async () => {
    const o = opzet()
    o.zetStripe({ status: 'succeeded' })
    const id = await o.ontvang({ ...event('evt_test_live_mode', 'payment_intent.succeeded', { id: PI }), livemode: true })
    expect(o.opslag.statusVan(id)).toBe('genegeerd')
    expect(o.opslag.boekingen.size).toBe(0)
  })

  it('Stripe even weg: opnieuw met wachten, na 8 pogingen vast', async () => {
    const o = opzet()
    o.stripe.haal = async () => ({ ok: false, soort: 'tijdelijk', status: 0, code: 'timeout' })
    const id = await o.ontvang(VERLOOP[1].body)
    expect(o.opslag.statusVan(id)).toBe('ontvangen')
    for (let i = 0; i < 10; i++) {
      o.verzet(13 * 60 * 60 * 1000)
      await werkInboxAf(o.deps, { max: 10 })
    }
    expect(o.opslag.statusVan(id)).toBe('vast')
    expect(o.opslag.meldingen.some((m) => m.includes('vast'))).toBe(true)
  })

  it('een terugbetaalde losse verkoop gaat naar de bestaande verwerking', async () => {
    const o = opzet()
    o.stripe.zet(ACCOUNT, 'ch_testverkoop0001', { id: 'ch_testverkoop0001', payment_intent: 'pi_testverkoop0001' })
    o.stripe.zet(ACCOUNT, 'pi_testverkoop0001', { id: 'pi_testverkoop0001', status: 'succeeded', amount: 990, currency: 'eur', livemode: false, metadata: { verkoop_id: BETALING }, latest_charge: { id: 'ch_testverkoop0001', amount_refunded: 990, refunds: { object: 'list', data: [{ id: 're_testverkoop0001', amount: 990, status: 'succeeded' }] } } })
    await o.ontvang(event('evt_test_verkoop_terug', 'charge.refunded', { id: 'ch_testverkoop0001', payment_intent: 'pi_testverkoop0001', metadata: {} }))
    expect(o.opslag.verkoopTerug).toEqual([{ paymentIntent: 'pi_testverkoop0001', terugCent: 990 }])
    expect(o.opslag.boekingen.size).toBe(0)
  })

  it('een geslaagde SEPA-machtiging wordt vastgelegd met alleen de laatste 4', async () => {
    const o = opzet()
    o.stripe.zet(ACCOUNT, 'seti_test0001', { id: 'seti_test0001', status: 'succeeded', customer: 'cus_test0001', payment_method: 'pm_test0001', mandate: 'mandate_test0001', livemode: false, metadata: { organisatie_id: ORG } })
    o.stripe.zet(ACCOUNT, 'pm_test0001', { id: 'pm_test0001', type: 'sepa_debit', customer: 'cus_test0001', sepa_debit: { last4: '3000' } })
    await o.ontvang(event('evt_test_setup_ok', 'setup_intent.succeeded', { id: 'seti_test0001' }))
    expect(o.opslag.machtigingen).toEqual([{ organisatieId: ORG, contractId: null, klant: 'cus_test0001', betaalmethode: 'pm_test0001', mandaat: 'mandate_test0001', soort: 'sepa_debit', laatste4: '3000', setupIntent: 'seti_test0001' }])
  })

  it('een verlopen eerste betaalsessie annuleert de betaling', async () => {
    const o = opzet()
    o.stripe.zet(ACCOUNT, 'cs_test_eerste01', { id: 'cs_test_eerste01', mode: 'payment', status: 'expired', payment_status: 'unpaid', amount_total: BEDRAG, currency: 'eur', livemode: false, metadata: META, payment_intent: null })
    await o.ontvang(event('evt_test_sessie_verlopen', 'checkout.session.expired', { id: 'cs_test_eerste01', mode: 'payment', metadata: META }))
    expect(o.opslag.betalingen.get(BETALING)?.status).toBe('geannuleerd')
    expect(o.opslag.boekingen.size).toBe(0)
  })

  it('ontkoppeld account: alleen als Stripe het account echt niet meer geeft', async () => {
    const o = opzet()
    o.stripe.accounts.set(ACCOUNT, { id: ACCOUNT })
    await o.ontvang(event('evt_test_deauth_nog', 'account.application.deauthorized', { id: 'ca_x' }))
    expect(o.opslag.ontkoppeld).toEqual([])
    o.stripe.accounts.clear()
    await o.ontvang(event('evt_test_deauth_echt', 'account.application.deauthorized', { id: 'ca_x' }))
    expect(o.opslag.ontkoppeld).toEqual([ACCOUNT])
  })
})
