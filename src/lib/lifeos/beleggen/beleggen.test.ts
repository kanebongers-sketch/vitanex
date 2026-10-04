import { describe, expect, test } from 'vitest'
import { leesDegiroCsv, leesGetal, splitsRegel } from './csv'
import { leesKoers, leesZoek, type Koers } from './yahoo'
import { kiesBeste } from './koppel'
import { benodigdeSymbolen, naarEuroFactor, rekenRegel, rekenTotaal, type KoersStand, type Positie } from './portefeuille'

const CSV = `Product,Symbool/ISIN,Aantal,Slotkoers,Lokale waarde,,Waarde in EUR
CASH & CASH FUND & FTX CASH (EUR),,,,EUR,"164,14","164,14"
"COREWEAVE, INC. CLASS A",US21873S1087,25,"89,62",USD,"2240,50","1990,68"
ISHARES BITCOIN ETP,XS2940466316,1915,"7,50",EUR,"14355,80","14355,80"
VANGUARD S&P 500 UCITS ETF USD DIS,IE00B3XXRP09,205,"129,97",EUR,"26643,85","26643,85"
`

describe('DEGIRO-CSV', () => {
  test('leest posities en cash, met komma-decimalen en namen met een komma', () => {
    const uit = leesDegiroCsv(CSV)
    expect(uit?.cashEur).toBe(164.14)
    expect(uit?.posities).toEqual([
      { naam: 'COREWEAVE, INC. CLASS A', isin: 'US21873S1087', aantal: 25, slotkoers: 89.62, valuta: 'USD', waardeEur: 1990.68 },
      { naam: 'ISHARES BITCOIN ETP', isin: 'XS2940466316', aantal: 1915, slotkoers: 7.5, valuta: 'EUR', waardeEur: 14355.8 },
      { naam: 'VANGUARD S&P 500 UCITS ETF USD DIS', isin: 'IE00B3XXRP09', aantal: 205, slotkoers: 129.97, valuta: 'EUR', waardeEur: 26643.85 },
    ])
  })
  test('geen DEGIRO-export → null', () => {
    expect(leesDegiroCsv('a,b\n1,2')).toBeNull()
  })
  test('getallen en regels', () => {
    expect(leesGetal('2.240,50')).toBe(2240.5)
    expect(leesGetal('7.5')).toBe(7.5)
    expect(leesGetal('')).toBeNull()
    expect(splitsRegel('"a, b",c')).toEqual(['a, b', 'c'])
  })
})

describe('Yahoo-antwoorden', () => {
  test('koers uit het chart-antwoord', () => {
    const k = leesKoers({ chart: { result: [{ meta: { symbol: 'VUSA.AS', regularMarketPrice: 129.85, chartPreviousClose: 128.6, currency: 'EUR', longName: 'Vanguard S&P 500', regularMarketTime: 1790955000 } }] } })
    expect(k).toMatchObject({ symbool: 'VUSA.AS', koers: 129.85, vorigeSlot: 128.6, valuta: 'EUR' })
  })
  test('kapot of leeg antwoord → null / leeg', () => {
    expect(leesKoers({ chart: { result: null, error: { code: 'Not Found' } } })).toBeNull()
    expect(leesZoek({ quotes: [{ symbol: 'X', quoteType: 'OPTION' }] })).toEqual([])
  })
})

describe('notering kiezen', () => {
  const k = (symbool: string, koers: number, valuta: string): Koers => ({ symbool, koers, valuta, vorigeSlot: null, naam: null, marktTijd: null })
  test('zelfde valuta en dichtst bij DEGIRO\'s slotkoers', () => {
    const uit = kiesBeste([k('BTCN.AS', 8.52, 'USD'), k('IB1T.DE', 7.57, 'EUR'), k('X.SG', 7.45, 'EUR')], 'EUR', 7.5)
    expect(uit?.symbool).toBe('X.SG')
  })
  test('niets binnen de marge → null (geen gok)', () => {
    expect(kiesBeste([k('VUSD.L', 140, 'USD')], 'EUR', 129.97)).toBeNull()
  })
})

describe('portefeuille', () => {
  const nu = '2026-10-04T10:00:00Z'
  const koersen = new Map<string, KoersStand>([
    ['VUSA.AS', { koers: 130, vorigeSlot: 128, valuta: 'EUR', opgehaaldOp: nu }],
    ['CRWV', { koers: 90, vorigeSlot: 100, valuta: 'USD', opgehaaldOp: nu }],
    ['EURUSD=X', { koers: 1.125, vorigeSlot: null, valuta: 'USD', opgehaaldOp: nu }],
  ])
  const vusa: Positie = { id: 'a', symbool: 'VUSA.AS', isin: null, naam: 'Vanguard', valuta: 'EUR', aantal: 10, aankoopprijs: 100 }
  const crwv: Positie = { id: 'b', symbool: 'CRWV', isin: null, naam: 'CoreWeave', valuta: 'USD', aantal: 25, aankoopprijs: null }

  test('euro-positie: waarde, vandaag en winst', () => {
    expect(rekenRegel(vusa, koersen)).toMatchObject({ waardeEur: 1300, dagEur: 20, inlegEur: 1000, winstEur: 300, winstPct: 30 })
  })
  test('dollar-positie wordt omgerekend; zonder aankoopprijs geen winst', () => {
    const r = rekenRegel(crwv, koersen)
    expect(r.waardeEur).toBe(2000)
    expect(r.dagEur).toBeCloseTo(-222.22, 2)
    expect(r.winstEur).toBeNull()
  })
  test('totaal: cash telt mee in de waarde; winst pas als alles een aankoopprijs heeft', () => {
    const t = rekenTotaal([rekenRegel(vusa, koersen), rekenRegel(crwv, koersen)], 164.14)
    expect(t).toMatchObject({ waardeEur: 3464.14, compleet: false, winstEur: null, zonderAankoop: 1 })
  })
  test('vastgelegde inleg in euro wint van aankoopprijs × huidige wisselkoers (zoals DEGIRO)', () => {
    const r = rekenRegel({ ...crwv, aankoopprijs: 92.726, inlegEur: 2018.91 }, koersen)
    expect(r.inlegEur).toBe(2018.91)
    expect(r.winstEur).toBeCloseTo(2000 - 2018.91, 2)
  })

  test('pence en ontbrekende wisselkoers', () => {
    expect(naarEuroFactor('EUR', koersen)).toBe(1)
    expect(naarEuroFactor('GBp', new Map([['EURGBP=X', { koers: 0.85, vorigeSlot: null, valuta: 'GBP', opgehaaldOp: nu }]]))).toBeCloseTo(0.01 / 0.85)
    expect(naarEuroFactor('CHF', koersen)).toBeNull()
  })
  test('benodigde symbolen inclusief wisselkoersen', () => {
    expect(benodigdeSymbolen([vusa, crwv])).toEqual(['VUSA.AS', 'CRWV', 'EURUSD=X'])
  })
})
