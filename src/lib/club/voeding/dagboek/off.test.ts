import { describe, expect, it } from 'vitest'
import { OFF_USER_AGENT, barcodeUrl, isBarcode, per100UitOff, productUitBarcode, productUitOff, productenUitZoek, schoneZoekterm, zoekUrl } from './off'

// Open Food Facts is een systeemgrens: vreemde of halve producten mogen het
// dagboek niet laten liegen of crashen.

const kwark = {
  code: '8718452000000',
  product_name: 'Magere kwark',
  product_name_en: 'Low fat quark',
  brands: 'Merk A, Merk B',
  quantity: '500 g',
  serving_quantity: 150,
  nutriments: { 'energy-kcal_100g': 57, proteins_100g: 9.5, carbohydrates_100g: 4, fat_100g: 0.2, fiber_100g: 0 },
}

describe('Open Food Facts', () => {
  it('leest een product met naam in de juiste taal, eerste merk en portie', () => {
    expect(productUitOff(kwark, 'nl')).toEqual({
      sleutel: 'off:8718452000000',
      naam: 'Magere kwark',
      merk: 'Merk A',
      per100: { kcal: 57, eiwitG: 9.5, koolhydratenG: 4, vetG: 0.2, vezelsG: 0 },
      portieGram: 150,
      hoeveelheid: '500 g',
    })
    expect(productUitOff(kwark, 'en')?.naam).toBe('Low fat quark')
  })

  it('rekent kJ om naar kcal als kcal ontbreekt', () => {
    expect(per100UitOff({ 'energy-kj_100g': 418.4 })?.kcal).toBe(100)
  })

  it('weigert producten zonder naam, barcode of energie, en onzin', () => {
    expect(productUitOff({ ...kwark, product_name: '', product_name_en: '' })).toBeNull()
    expect(productUitOff({ ...kwark, code: 'abc' })).toBeNull()
    expect(productUitOff({ ...kwark, nutriments: { proteins_100g: 3 } })).toBeNull()
    expect(productUitOff({ ...kwark, nutriments: { 'energy-kcal_100g': 5000 } })).toBeNull()
    expect(productUitOff(null)).toBeNull()
  })

  it('begrenst macro\'s per 100 gram op 100', () => {
    expect(per100UitOff({ 'energy-kcal_100g': 900, fat_100g: 250 })?.vetG).toBe(100)
  })

  it('haalt dubbele en kapotte producten uit een zoekantwoord', () => {
    const lijst = productenUitZoek({ products: [kwark, kwark, { code: '1' }, 'x'] })
    expect(lijst).toHaveLength(1)
    expect(productenUitZoek(null)).toEqual([])
  })

  it('leest het barcodeantwoord alleen bij status 1', () => {
    expect(productUitBarcode({ status: 1, product: kwark })?.naam).toBe('Magere kwark')
    expect(productUitBarcode({ status: 0 })).toBeNull()
  })

  it('controleert barcode en zoekterm', () => {
    expect(isBarcode('8718452000000')).toBe(true)
    expect(isBarcode('12345')).toBe(false)
    expect(isBarcode('12a45678')).toBe(false)
    expect(schoneZoekterm('  kwark\u0000  ')).toBe('kwark')
    expect(schoneZoekterm('k')).toBeNull()
    expect(schoneZoekterm(42)).toBeNull()
  })

  it('bouwt nette adressen bij Open Food Facts met een eigen User-Agent', () => {
    expect(zoekUrl('magere kwark', 'nl')).toContain('search_terms=magere+kwark')
    expect(barcodeUrl('8718452000000')).toContain('/api/v2/product/8718452000000.json')
    expect(OFF_USER_AGENT).toMatch(/AIYourGym/)
  })
})
