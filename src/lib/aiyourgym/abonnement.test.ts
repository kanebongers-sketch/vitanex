import { describe, expect, it } from 'vitest'
import { ABONNEMENT_PAD, abonnementUitRij, abonnementWeergave, bedragVanRegels, isKlantId, leesStripeAbonnement, portaalFormulier, portaalTerugUrl, type AbonnementRij, type StripeAbonnement } from './abonnement'

const NU = new Date('2026-10-17T10:00:00Z')
const unix = (iso: string) => Math.floor(Date.parse(iso) / 1000)

const rij = (extra: Partial<AbonnementRij> = {}): AbonnementRij => ({
  pakket: 'club', pakketten: null, aantalVestigingen: 2, status: 'actief', stripeKlantId: 'cus_abcdef12', stripeAbonnementId: 'sub_abcdef12', aangemaaktOp: '2026-10-01T10:00:00Z', ...extra,
})
const stripe = (extra: Partial<StripeAbonnement> = {}): StripeAbonnement => ({ status: 'active', proefTot: null, periodeTot: null, stoptOp: null, stoptAanEindPeriode: false, aantal: null, prijzen: [], bedrag: null, ...extra })

describe('abonnementUitRij', () => {
  it('leest een rij uit de database', () => {
    expect(abonnementUitRij({ pakket: 'start', aantal_vestigingen: 1, status: 'test', stripe_customer_id: null, stripe_subscription_id: '', aangemaakt_op: 'x' })).toEqual({
      pakket: 'start', pakketten: null, aantalVestigingen: 1, status: 'test', stripeKlantId: null, stripeAbonnementId: null, aangemaaktOp: 'x',
    })
    // Een modulaire aanmelding: de losse pakketten in vaste volgorde.
    expect(abonnementUitRij({ pakket: 'los', pakketten: ['groei', 'lessen'], aantal_vestigingen: 2, status: 'actief', aangemaakt_op: 'x' })?.pakketten).toEqual(['lessen', 'groei'])
  })
  it('toont de losse pakketten, of de naam van een oud pakket', () => {
    expect(abonnementWeergave(rij({ pakket: 'los', pakketten: ['lessen', 'groei'] }), null, NU).pakket).toBe('Groepslessen en Groei')
    expect(abonnementWeergave(rij({ pakket: 'los', pakketten: ['lessen'] }), null, NU, 'en').pakket).toBe('Group classes')
    expect(abonnementWeergave(rij(), null, NU).pakket).toBe('Club')
  })
  it('weigert onzin', () => {
    expect(abonnementUitRij(null)).toBeNull()
    expect(abonnementUitRij({ status: 'raar' })).toBeNull()
  })
})

describe('leesStripeAbonnement', () => {
  it('oude vorm: periode op het abonnement', () => {
    const s = leesStripeAbonnement({ id: 'sub_1', status: 'trialing', trial_end: unix('2026-10-31T00:00:00Z'), current_period_end: unix('2026-11-01T00:00:00Z'), items: { data: [{ quantity: 3 }] } })
    expect(s?.status).toBe('trialing')
    expect(s?.proefTot?.toISOString()).toBe('2026-10-31T00:00:00.000Z')
    expect(s?.periodeTot?.toISOString()).toBe('2026-11-01T00:00:00.000Z')
    expect(s?.aantal).toBe(3)
  })
  it('nieuwe vorm: periode op het item, en opzeggen', () => {
    const s = leesStripeAbonnement({ id: 'sub_1', status: 'active', cancel_at_period_end: true, items: { data: [{ quantity: 1, current_period_end: unix('2026-12-01T00:00:00Z') }] } })
    expect(s?.periodeTot?.toISOString()).toBe('2026-12-01T00:00:00.000Z')
    expect(s?.stoptAanEindPeriode).toBe(true)
  })
  it('zonder id of geen object: null', () => {
    expect(leesStripeAbonnement(null)).toBeNull()
    expect(leesStripeAbonnement({ status: 'active' })).toBeNull()
  })
})

describe('abonnementWeergave', () => {
  it('oud abonnement dat Stripe nog als trialing stuurt: actief, met de eerste betaling, nooit "proef"', () => {
    const w = abonnementWeergave(rij(), stripe({ status: 'trialing', proefTot: new Date('2026-10-31T12:00:00Z') }), NU)
    expect(w.status).toBe('Actief')
    expect(w.toelichting).toBe('Eerste betaling rond 31 oktober 2026.')
    expect(`${w.status} ${w.toelichting}`.toLowerCase()).not.toContain('proef')
    expect(w.toon).toBe('goed')
    expect(w.pakket).toBe('Club')
    expect(w.portaal).toBe(true)
  })
  it('actief met de volgende factuur, aantal uit Stripe', () => {
    const w = abonnementWeergave(rij(), stripe({ periodeTot: new Date('2026-11-01T12:00:00Z'), aantal: 4 }), NU)
    expect(w.status).toBe('Actief')
    expect(w.toelichting).toContain('1 november 2026')
    expect(w.vestigingen).toBe(4)
  })
  it('actief zonder Stripe-gegevens: vestigingen uit de aanmelding', () => {
    const w = abonnementWeergave(rij(), null, NU)
    expect(w.status).toBe('Actief')
    expect(w.vestigingen).toBe(2)
    expect(w.toelichting).toBeNull()
  })
  it('opgezegd aan het einde van de periode', () => {
    const w = abonnementWeergave(rij(), stripe({ stoptAanEindPeriode: true, periodeTot: new Date('2026-11-15T12:00:00Z') }), NU)
    expect(w.status).toBe('Opgezegd')
    expect(w.toelichting).toBe('Loopt nog tot 15 november 2026.')
  })
  it('betaling mislukt, gepauzeerd en opgezegd', () => {
    expect(abonnementWeergave(rij({ status: 'betaling_mislukt' }), null, NU)).toMatchObject({ status: 'Betaling mislukt', toon: 'fout', portaal: true })
    expect(abonnementWeergave(rij({ status: 'gepauzeerd' }), null, NU).toon).toBe('let')
    expect(abonnementWeergave(rij({ status: 'opgezegd' }), null, NU)).toMatchObject({ status: 'Opgezegd', portaal: true })
  })
  it('na een testbetaling (zonder Stripe): actief, eerlijk dat er niets wordt afgeschreven, geen proefperiode', () => {
    const test = rij({ stripeKlantId: null, stripeAbonnementId: null, aangemaaktOp: '2026-10-10T10:00:00Z' })
    const w = abonnementWeergave(test, null, NU)
    expect(w).toMatchObject({ status: 'Actief', toon: 'goed', portaal: false })
    expect(w.toelichting).toContain('niets afgeschreven')
    expect(w.toelichting?.toLowerCase()).not.toContain('proef')
  })
  it('testaccount en zonder klant-id: geen portaal', () => {
    expect(abonnementWeergave(rij({ status: 'test' }), null, NU)).toMatchObject({ status: 'Testaccount', portaal: false })
    expect(abonnementWeergave(rij({ stripeKlantId: null }), null, NU).portaal).toBe(false)
  })
})

describe('portaalTerugUrl', () => {
  it('eigen hosts en het subdomein van een sportschool', () => {
    expect(portaalTerugUrl('fitfactorypt.nl')).toBe(`https://fitfactorypt.nl${ABONNEMENT_PAD}`)
    expect(portaalTerugUrl('localhost:3000')).toBe(`http://localhost:3000${ABONNEMENT_PAD}`)
    expect(portaalTerugUrl('testgym.aiyourgym.com')).toBe(`https://testgym.aiyourgym.com${ABONNEMENT_PAD}`)
  })
  it('vreemde of kapotte hosts nooit', () => {
    expect(portaalTerugUrl('evil.example.com')).toBeNull()
    expect(portaalTerugUrl('a.b.aiyourgym.com')).toBeNull()
    expect(portaalTerugUrl('www.aiyourgym.com.evil.nl')).toBeNull()
    expect(portaalTerugUrl('fitfactorypt.nl/x')).toBeNull()
    expect(portaalTerugUrl(null)).toBeNull()
  })
})

describe('portaalFormulier en id-controle', () => {
  it('de velden voor Stripe', () => {
    const f = portaalFormulier('cus_abcdef12', 'https://fitfactorypt.nl/x')
    expect(f.get('customer')).toBe('cus_abcdef12')
    expect(f.get('return_url')).toBe('https://fitfactorypt.nl/x')
    expect(f.get('locale')).toBe('nl')
  })
  it('alleen echte klant-id', () => {
    expect(isKlantId('cus_abcdef12')).toBe(true)
    expect(isKlantId('cus_1/../x')).toBe(false)
    expect(isKlantId(null)).toBe(false)
  })
})

describe('prijs uit Stripe en de bundel (besluit Kane 30-10-2026)', () => {
  const regel = (bedrag: number, aantal: number, extra: Record<string, unknown> = {}) => ({ quantity: aantal, price: { id: 'price_x00001', unit_amount: bedrag, currency: 'eur', recurring: { interval: 'month', interval_count: 1 }, tax_behavior: 'exclusive', ...extra } })
  it('het bedrag per maand: prijs per stuk maal aantal, alle regels samen', () => {
    expect(bedragVanRegels([regel(2900, 2), regel(1200, 2)])).toEqual({ centen: 8200, valuta: 'eur', inclBtw: false })
    expect(bedragVanRegels([regel(11900, 1, { tax_behavior: 'inclusive' })])?.inclBtw).toBe(true)
  })
  it('liever geen bedrag dan een fout bedrag: andere munt, jaarprijs, ontbrekend tarief', () => {
    expect(bedragVanRegels([])).toBeNull()
    expect(bedragVanRegels([regel(2900, 1, { currency: 'usd' })])).toBeNull()
    expect(bedragVanRegels([regel(2900, 1, { recurring: { interval: 'year' } })])).toBeNull()
    expect(bedragVanRegels([regel(2900, 1), { quantity: 1, price: { id: 'price_x00002' } }])).toBeNull()
    expect(bedragVanRegels([regel(2900, 0)])).toBeNull()
  })
  it('leesStripeAbonnement neemt de prijzen en het bedrag mee', () => {
    const s = leesStripeAbonnement({ id: 'sub_1', status: 'active', items: { data: [{ ...regel(11900, 2), price: { ...regel(11900, 2).price, id: 'price_alles0001' } }] } })
    expect(s?.prijzen).toEqual(['price_alles0001'])
    expect(s?.bedrag).toEqual({ centen: 23800, valuta: 'eur', inclBtw: false })
  })
  it('de pagina toont de prijs uit Stripe en zegt het als de bundel geldt', () => {
    const s = stripe({ prijzen: ['price_alles0001'], bedrag: { centen: 23800, valuta: 'eur', inclBtw: false } })
    const zes = rij({ pakket: 'los', pakketten: ['administratie', 'lessen', 'training', 'afspraken', 'team', 'groei'] })
    const w = abonnementWeergave(zes, s, NU, 'nl', 'price_alles0001')
    expect(w.bundel).toBe(true)
    expect(w.pakket).toBe('Alle zes pakketten (bundelprijs)')
    expect(w.prijs).toMatch(/238,00 per maand, excl\. btw/)
    expect(abonnementWeergave(zes, s, NU, 'en', 'price_alles0001').prijs).toMatch(/238\.00 per month, excl\. VAT/)
    // Zonder bundelprijs in env, of met losse regels: geen bundel.
    expect(abonnementWeergave(zes, s, NU, 'nl', null).bundel).toBe(false)
    expect(abonnementWeergave(zes, stripe({ prijzen: ['price_lessen01'] }), NU, 'nl', 'price_alles0001').bundel).toBe(false)
  })
  it('geen prijs zonder Stripe of bij een testaccount', () => {
    expect(abonnementWeergave(rij(), null, NU).prijs).toBeNull()
    expect(abonnementWeergave(rij({ status: 'test' }), stripe({ bedrag: { centen: 100, valuta: 'eur', inclBtw: false } }), NU).prijs).toBeNull()
  })
})
