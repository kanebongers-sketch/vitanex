import { describe, expect, it } from 'vitest'
import { ABONNEMENT_PAD, abonnementUitRij, abonnementWeergave, isKlantId, leesStripeAbonnement, portaalFormulier, portaalTerugUrl, type AbonnementRij, type StripeAbonnement } from './abonnement'

const NU = new Date('2026-10-17T10:00:00Z')
const unix = (iso: string) => Math.floor(Date.parse(iso) / 1000)

const rij = (extra: Partial<AbonnementRij> = {}): AbonnementRij => ({
  pakket: 'club', pakketten: null, aantalVestigingen: 2, status: 'actief', stripeKlantId: 'cus_abcdef12', stripeAbonnementId: 'sub_abcdef12', aangemaaktOp: '2026-10-01T10:00:00Z', ...extra,
})
const stripe = (extra: Partial<StripeAbonnement> = {}): StripeAbonnement => ({ status: 'active', proefTot: null, periodeTot: null, stoptOp: null, stoptAanEindPeriode: false, aantal: null, ...extra })

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
  it('proefperiode met einddatum', () => {
    const w = abonnementWeergave(rij(), stripe({ status: 'trialing', proefTot: new Date('2026-10-31T12:00:00Z') }), NU)
    expect(w.status).toBe('Proefperiode tot 31 oktober 2026')
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
  it('na een testbetaling (zonder Stripe): eerlijk de proefperiode en dat er niets wordt afgeschreven', () => {
    const test = rij({ stripeKlantId: null, stripeAbonnementId: null, aangemaaktOp: '2026-10-10T10:00:00Z' })
    const w = abonnementWeergave(test, null, NU)
    expect(w).toMatchObject({ status: 'Proefperiode tot 24 oktober 2026', toon: 'goed', portaal: false })
    expect(w.toelichting).toContain('niets afgeschreven')
    const later = abonnementWeergave(test, null, new Date('2026-11-01T10:00:00Z'))
    expect(later.status).toBe('Actief')
    expect(later.toelichting).toContain('niets afgeschreven')
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
