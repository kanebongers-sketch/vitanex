import { describe, expect, it } from 'vitest'
import { PLATFORM_FEE_PROCENT, betalenActief, clubStripeSleutel, clubWebhookGeheim, platformFeeCent } from './config'
import { btwDeel, euro, productInhoud, productUitRij, tegoedSoortVan, verkoopUitRij } from './model'
import { bruikbaarSaldo, isPtAfspraakType, magTerugbetalen, productVoorVestiging, stripBesluit, tegoedBruikbaar } from './regels'
import { leesProductInvoer, productRij } from './invoer'
import { maandCijfers } from './cijfers'
import { betaalOorsprong, kopenAdressen } from './adressen'
import type { Tegoed, Verkoop } from './model'

describe('config', () => {
  it('staat standaard uit en leest alleen geldige sleutels', () => {
    expect(betalenActief({})).toBe(false)
    expect(betalenActief({ CLUB_BETALEN_ACTIEF: '1' })).toBe(true)
    expect(clubStripeSleutel({ CLUB_STRIPE_SECRET_KEY: 'pk_test_x' })).toBeNull()
    expect(clubStripeSleutel({ CLUB_STRIPE_SECRET_KEY: 'sk_test_abc' })).toBe('sk_test_abc')
    expect(clubWebhookGeheim({ CLUB_STRIPE_WEBHOOK_SECRET: 'geheim' })).toBeNull()
    expect(clubWebhookGeheim({ CLUB_STRIPE_WEBHOOK_SECRET: 'whsec_abc' })).toBe('whsec_abc')
  })

  it('platformfee is een beslissing van Kane en staat op 0', () => {
    expect(PLATFORM_FEE_PROCENT).toBe(0)
    expect(platformFeeCent(9900)).toBe(0)
    expect(platformFeeCent(9900, 5)).toBe(495)
    expect(platformFeeCent(100, 500)).toBe(100)
  })
})

describe('model', () => {
  it('leest een productrij en weigert onzin', () => {
    const p = productUitRij({ id: 'p1', naam: 'Strip 10', type: 'strippenkaart', prijs_cent: 9900, btw_procent: 21, tegoeden: 10, geldig_dagen: 180, vestigingen: null, actief: true, volgorde: 0 })
    expect(p?.tegoeden).toBe(10)
    expect(p?.vestigingen).toBeNull()
    expect(productUitRij({ id: 'p1', naam: 'x', type: 'abonnement', prijs_cent: 100, btw_procent: 21 })).toBeNull()
    expect(productUitRij({ id: 'p1', naam: 'x', type: 'product', prijs_cent: 100, btw_procent: 6 })).toBeNull()
  })

  it('leest een verkoop', () => {
    const v = verkoopUitRij({ id: 'v1', lid_id: 'l1', product_naam: 'PT 5', type: 'pt_pakket', bedrag_cent: 30000, btw_procent: 21, status: 'betaald', terugbetaald_cent: 0, terugbetaling_aangevraagd_op: null, betaald_op: '2026-10-02T10:00:00Z', aangemaakt_op: '2026-10-02T09:59:00Z' })
    expect(v?.terugbetalingAangevraagd).toBe(false)
    expect(verkoopUitRij({ id: 'v1', type: 'pt_pakket', bedrag_cent: 1, btw_procent: 21, status: 'raar' })).toBeNull()
  })

  it('tegoedsoort, btw en teksten', () => {
    expect(tegoedSoortVan('pt_pakket')).toBe('pt')
    expect(tegoedSoortVan('losse_les')).toBe('les')
    expect(tegoedSoortVan('product')).toBeNull()
    expect(btwDeel(12100, 21)).toBe(2100)
    expect(btwDeel(10900, 9)).toBe(900)
    expect(euro(1250)).toMatch(/12,50/)
    expect(productInhoud({ type: 'strippenkaart', tegoeden: 10, geldigDagen: 90 })).toBe('10 groepslessen · 90 dagen geldig')
    expect(productInhoud({ type: 'product', tegoeden: null, geldigDagen: 30 })).toBe('Ophalen bij de balie')
  })
})

describe('regels', () => {
  const nu = new Date('2026-10-18T12:00:00Z')
  const tegoed = (t: Partial<Tegoed>): Tegoed => ({ id: 't', soort: 'les', productNaam: 'x', totaal: 10, saldo: 3, geldigTot: null, vestigingen: null, ...t })

  it('product per vestiging', () => {
    expect(productVoorVestiging({ actief: true, vestigingen: null }, 'budel')).toBe(true)
    expect(productVoorVestiging({ actief: true, vestigingen: ['eersel'] }, 'budel')).toBe(false)
    expect(productVoorVestiging({ actief: false, vestigingen: null }, 'budel')).toBe(false)
  })

  it('tegoed: saldo, geldigheid en vestiging', () => {
    expect(tegoedBruikbaar(tegoed({}), 'budel', nu)).toBe(true)
    expect(tegoedBruikbaar(tegoed({ saldo: 0 }), 'budel', nu)).toBe(false)
    expect(tegoedBruikbaar(tegoed({ geldigTot: '2026-10-18T11:59:00Z' }), 'budel', nu)).toBe(false)
    expect(tegoedBruikbaar(tegoed({ vestigingen: ['eersel'] }), 'budel', nu)).toBe(false)
    expect(bruikbaarSaldo([tegoed({}), tegoed({ id: 't2', saldo: 2 }), tegoed({ id: 't3', soort: 'pt', saldo: 5 })], 'les', 'budel', nu)).toBe(5)
  })

  it('strip alleen als de vorm geen groepslessen heeft', () => {
    expect(stripBesluit({ mag: true })).toEqual({ soort: 'niet_nodig' })
    expect(stripBesluit({ mag: false, waarom: 'groepslessen', reden: 'x' })).toEqual({ soort: 'strip' })
    expect(stripBesluit({ mag: false, waarom: 'daluren', reden: 'buiten' })).toEqual({ soort: 'nee', reden: 'buiten' })
  })

  it('herkent PT-afspraaktypen', () => {
    expect(isPtAfspraakType('Personal training 60 min')).toBe(true)
    expect(isPtAfspraakType('PT duo')).toBe(true)
    expect(isPtAfspraakType('Intake')).toBe(false)
    expect(isPtAfspraakType('Optimale meting')).toBe(false)
  })

  it('terugbetalen alleen een keer bij een betaalde verkoop', () => {
    expect(magTerugbetalen({ status: 'betaald', terugbetalingAangevraagd: false, terugbetaaldCent: 0 })).toBe(true)
    expect(magTerugbetalen({ status: 'betaald', terugbetalingAangevraagd: true, terugbetaaldCent: 0 })).toBe(false)
    expect(magTerugbetalen({ status: 'open', terugbetalingAangevraagd: false, terugbetaaldCent: 0 })).toBe(false)
  })
})

describe('invoer', () => {
  const v = ['budel', 'eersel']
  const basis = { naam: 'Strip 10', type: 'strippenkaart', prijsCent: 9900, btwProcent: 21, tegoeden: 10, geldigDagen: 180, vestigingen: ['budel'] }

  it('accepteert een goed product', () => {
    const uit = leesProductInvoer(basis, v)
    expect(uit.ok && uit.waarde.vestigingen).toEqual(['budel'])
    expect(uit.ok && productRij(uit.waarde).prijs_cent).toBe(9900)
  })

  it('alle vestigingen gekozen wordt null', () => {
    const uit = leesProductInvoer({ ...basis, vestigingen: ['eersel', 'budel'] }, v)
    expect(uit.ok && uit.waarde.vestigingen).toBeNull()
  })

  it('weigert onzin', () => {
    expect(leesProductInvoer({ ...basis, prijsCent: 10 }, v).ok).toBe(false)
    expect(leesProductInvoer({ ...basis, prijsCent: 12.5 }, v).ok).toBe(false)
    expect(leesProductInvoer({ ...basis, btwProcent: 6 }, v).ok).toBe(false)
    expect(leesProductInvoer({ ...basis, tegoeden: 1 }, v).ok).toBe(false)
    expect(leesProductInvoer({ ...basis, vestigingen: ['valkenswaard'] }, v).ok).toBe(false)
    expect(leesProductInvoer({ ...basis, type: 'abonnement' }, v).ok).toBe(false)
    expect(leesProductInvoer({ ...basis, naam: 'x' }, v).ok).toBe(false)
  })

  it('losse les heeft altijd 1 tegoed, een product geen', () => {
    const les = leesProductInvoer({ ...basis, type: 'losse_les', tegoeden: 7 }, v)
    expect(les.ok && les.waarde.tegoeden).toBe(1)
    const product = leesProductInvoer({ ...basis, type: 'product', tegoeden: 7, geldigDagen: 30 }, v)
    expect(product.ok && [product.waarde.tegoeden, product.waarde.geldigDagen]).toEqual([null, null])
  })
})

describe('cijfers per kalendermaand', () => {
  const v = (x: Partial<Verkoop>): Verkoop => ({ id: 'v', lidId: null, productNaam: 'x', type: 'product', vestiging: null, bedragCent: 12100, btwProcent: 21, status: 'betaald', terugbetaaldCent: 0, terugbetalingAangevraagd: false, betaaldOp: '2026-10-05T10:00:00Z', aangemaaktOp: '2026-10-05T10:00:00Z', ...x })

  it('telt alleen betaald in deze maand, netto na terugbetaling', () => {
    const uit = maandCijfers([v({}), v({ status: 'terugbetaald', terugbetaaldCent: 12100 }), v({ betaaldOp: '2026-09-30T21:59:00Z' }), v({ status: 'open', betaaldOp: null })], new Date('2026-10-18T12:00:00Z'))
    expect(uit).toEqual({ verkopen: 2, omzetCent: 12100, btwCent: 2100, terugCent: 12100 })
  })

  it('de 1e om half een in de nacht telt bij de nieuwe maand (Nederlandse tijd)', () => {
    const uit = maandCijfers([v({ betaaldOp: '2026-09-30T22:30:00Z' })], new Date('2026-10-18T12:00:00Z'))
    expect(uit.verkopen).toBe(1)
  })
})

describe('adressen', () => {
  it('alleen eigen hosts', () => {
    expect(betaalOorsprong('fitfactorypt.nl')).toBe('https://fitfactorypt.nl')
    expect(betaalOorsprong('budel.aiyourgym.com')).toBe('https://budel.aiyourgym.com')
    expect(betaalOorsprong('kwaad.example.com')).toBeNull()
    expect(betaalOorsprong('aiyourgym.com.kwaad.nl')).toBeNull()
  })

  it('terug naar Kopen in de ledenapp', () => {
    expect(kopenAdressen('https://fitfactorypt.nl', null)).toEqual({ succes: 'https://fitfactorypt.nl/mijn?tab=kopen&betaald=1', terug: 'https://fitfactorypt.nl/mijn?tab=kopen&geannuleerd=1' })
  })
})
