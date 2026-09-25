// Tests voor het sportmerk-plan: de PURE marge-rekensom en het contract tussen
// route en client. Bewaakt: marges worden uitgerekend (niet getypt) en kloppen
// met de aannames; wat de route bouwt, komt ongeschonden door de client-grens;
// een kapot of onveilig antwoord wordt `null`, nooit een half plan.

import { describe, expect, it } from 'vitest'
import { berekenMarge, MARGE_AANNAMES } from '@/lib/lifeos/sportmerk/marge'
import { bouwStrategie } from '@/lib/lifeos/sportmerk/strategie'
import type { ProductAanname } from '@/lib/lifeos/sportmerk/types'
import { leesStrategie } from '@/components/lifeos/sportmerk/lees'

function product(over: Partial<ProductAanname>): ProductAanname {
  return {
    id: 'x',
    naam: 'X',
    rol: 'add-on',
    prijsInclBtw: 121,
    kostprijs: { min: 20, max: 30 },
    verzendkosten: 6,
    retourRisico: 'laag',
    toelichting: 'x',
    ...over,
  }
}

describe('berekenMarge', () => {
  it('haalt btw, kostprijs (midden), verzending, betaalkosten en retourreserve eraf', () => {
    // 121 incl. 21% btw = 100 ex. Kostprijs 25, verzending 6, betaal 3,025, retour 3.
    const m = berekenMarge(product({}))
    expect(m.exBtw).toBe(100)
    expect(m.overVoorAds).toBeCloseTo(62.98, 1)
    expect(m.naAds).toBeCloseTo(62.98 - MARGE_AANNAMES.cacPerKlant, 1)
  })

  it('een goedkoop product met hoog margepercentage verliest geld na één betaalde klant', () => {
    const m = berekenMarge(product({ prijsInclBtw: 25, kostprijs: { min: 2, max: 4 } }))
    expect(m.overVoorAds).toBeGreaterThan(0)
    expect(m.naAds).toBeLessThan(0)
  })

  it('een hoger retourrisico kost meer', () => {
    const laag = berekenMarge(product({ retourRisico: 'laag' }))
    const hoog = berekenMarge(product({ retourRisico: 'hoog' }))
    expect(hoog.overVoorAds).toBeLessThan(laag.overVoorAds)
  })
})

describe('bouwStrategie', () => {
  it('rekent elke productmarge uit de eigen aannames', () => {
    for (const p of bouwStrategie().producten) {
      expect(p.marge).toEqual(berekenMarge(p))
      expect(p.kostprijs.min).toBeLessThanOrEqual(p.kostprijs.max)
    }
  })

  it('het hoofdaanbod blijft winstgevend na acquisitie', () => {
    const kern = bouwStrategie().producten.filter((p) => p.rol === 'hoofdproduct' || p.rol === 'hoofdaanbod')
    expect(kern.length).toBeGreaterThan(0)
    for (const p of kern) expect(p.marge.naAds).toBeGreaterThan(0)
  })
})

describe('leesStrategie', () => {
  const antwoord = () => JSON.parse(JSON.stringify({ strategie: bouwStrategie() }))

  it('laat wat de route bouwt ongeschonden door', () => {
    expect(leesStrategie(antwoord())).toEqual(bouwStrategie())
  })

  it('een product zonder marge laat het hele plan vallen', () => {
    const ruw = antwoord()
    delete ruw.strategie.producten[0].marge
    expect(leesStrategie(ruw)).toBeNull()
  })

  it('weigert een bronlink die geen https is', () => {
    const ruw = antwoord()
    ruw.strategie.waarom[0].bron.url = 'javascript:alert(1)'
    expect(leesStrategie(ruw)).toBeNull()
  })

  it('weigert iets dat geen object is', () => {
    expect(leesStrategie(null)).toBeNull()
    expect(leesStrategie([])).toBeNull()
    expect(leesStrategie({ strategie: 'x' })).toBeNull()
  })
})
