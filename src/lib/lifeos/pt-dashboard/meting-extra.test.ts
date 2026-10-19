import { describe, expect, test } from 'vitest'
import {
  EXTRA_VELDEN, extraBody, extraInvoerLabel, extraVeld, extraVoorselectie, leesExtraInvoer, leesExtraOpgeslagen, metEenheid,
} from './meting-extra'
import { extraRegels, grafiekReeksen, leesMeting, leesMetingInvoer, verschilSindsStart, waardeLijn, type Meting } from './metingen'

const meting = (over: Partial<Meting> = {}): Meting => ({
  id: 'm', datum: '2026-09-07', soort: 'start', gewichtKg: null, vetPct: null, tailleCm: null, heupCm: null, borstCm: null, armCm: null, beenCm: null,
  cardiotest: null, krachtOefening: null, krachtRm: null, krachtKg: null, fotosGemaakt: false, notitie: null, extra: {}, ...over,
})

describe('de 20 meetopties', () => {
  test('twintig unieke sleutels, elk met een geldig bereik', () => {
    expect(EXTRA_VELDEN).toHaveLength(20)
    expect(new Set(EXTRA_VELDEN.map((v) => v.sleutel)).size).toBe(20)
    for (const v of EXTRA_VELDEN) expect(v.min).toBeLessThan(v.max)
  })
  test('geen gedachtestreepjes of klemtoon-accenten in de teksten', () => {
    const teksten = EXTRA_VELDEN.flatMap((v) => [v.label, v.eenheid, v.uitleg ?? ''])
    for (const t of teksten) expect(t).not.toMatch(/[–—]| - |[éèëáóúí]/)
  })
  test('label met uitleg voor het invoerveld', () => {
    expect(extraInvoerLabel(extraVeld('rusthartslag'))).toBe('Rusthartslag (slagen per minuut)')
    expect(extraInvoerLabel(extraVeld('bmi'))).toBe('BMI')
    expect(metEenheid(34.25, 'kg')).toBe('34,3 kg')
    expect(metEenheid(9, '')).toBe('9')
  })
})

describe('leesExtraInvoer (streng)', () => {
  test('ontbreekt of leeg → {}', () => {
    expect(leesExtraInvoer(undefined)).toEqual({ ok: true, waarde: {} })
    expect(leesExtraInvoer({ spiermassaKg: '', energie: null })).toEqual({ ok: true, waarde: {} })
  })
  test('komma-getallen, afgerond op de decimalen van het veld', () => {
    expect(leesExtraInvoer({ spiermassaKg: '34,26', rusthartslag: '61,6', bmrKcal: 1712.4 })).toEqual({
      ok: true, waarde: { spiermassaKg: 34.3, rusthartslag: 62, bmrKcal: 1712 },
    })
  })
  test('onbekende sleutel of geen object → nette fout', () => {
    expect(leesExtraInvoer({ hackerVeld: 3 })).toEqual({ ok: false, fout: 'Onbekende meetoptie. Ververs de pagina en probeer het opnieuw.' })
    expect(leesExtraInvoer([1, 2])).toMatchObject({ ok: false })
    expect(leesExtraInvoer('x')).toMatchObject({ ok: false })
  })
  test('buiten bereik of geen getal → fout met label en bereik', () => {
    expect(leesExtraInvoer({ visceraalVet: 60 })).toEqual({ ok: false, fout: 'Visceraal vet: vul een getal tussen 1 en 59 in.' })
    expect(leesExtraInvoer({ botmassaKg: '0,2' })).toEqual({ ok: false, fout: 'Botmassa: vul een getal tussen 0,5 en 10 kg in.' })
    expect(leesExtraInvoer({ energie: 'veel' })).toEqual({ ok: false, fout: 'Energie: vul een getal tussen 1 en 10 in.' })
  })
})

describe('leesExtraOpgeslagen (mild) en oude rijen', () => {
  test('null of geen object → {}; onbekend of onleesbaar wordt overgeslagen', () => {
    expect(leesExtraOpgeslagen(null)).toEqual({})
    expect(leesExtraOpgeslagen(undefined)).toEqual({})
    expect(leesExtraOpgeslagen({ spiermassaKg: 34.2, weg: 1, energie: 99 })).toEqual({ spiermassaKg: 34.2 })
  })
  test('een oude rij zonder extra blijft gewoon leesbaar', () => {
    const oud = leesMeting({ id: 'a', datum: '2026-09-07', soort: 'weging', gewichtKg: '82.0' })
    expect(oud?.extra).toEqual({})
    expect(oud?.gewichtKg).toBe(82)
  })
  test('een rij met alleen extra waarden telt als meting', () => {
    expect(leesMeting({ id: 'b', datum: '2026-09-07', soort: 'weging', extra: { energie: 7 } })?.extra).toEqual({ energie: 7 })
  })
})

describe('leesMetingInvoer met extra', () => {
  const basis = { datum: '2026-09-07', soort: 'weging' }
  test('alleen een extra waarde is genoeg', () => {
    expect(leesMetingInvoer({ ...basis, extra: { rusthartslag: 58 } })).toMatchObject({ ok: true, waarde: { extra: { rusthartslag: 58 } } })
  })
  test('fout in extra wordt doorgegeven', () => {
    expect(leesMetingInvoer({ ...basis, gewichtKg: 80, extra: { bloeddrukBoven: 300 } })).toEqual({
      ok: false, fout: 'Bloeddruk boven: vul een getal tussen 60 en 260 mmHg in.',
    })
  })
})

describe('voorselectie', () => {
  test('wat eerder bij deze klant gemeten is, in de vaste volgorde', () => {
    const metingen = [meting({ extra: { energie: 7, spiermassaKg: 33 } }), meting({ extra: { kuitCm: 38 } }), meting()]
    expect(extraVoorselectie(metingen)).toEqual(['spiermassaKg', 'energie', 'kuitCm'])
    expect(extraVoorselectie([])).toEqual([])
  })
  test('extraBody stuurt alleen gekozen, ingevulde velden', () => {
    expect(extraBody(['spiermassaKg', 'energie'], { spiermassaKg: '34,1', energie: ' ', kuitCm: '38' })).toEqual({ spiermassaKg: '34,1' })
  })
})

describe('verschil en grafiek met extra waarden', () => {
  const reeks = [
    meting({ id: 'a', datum: '2026-09-01', soort: 'start', gewichtKg: 84, extra: { spiermassaKg: 32.4 } }),
    meting({ id: 'b', datum: '2026-09-15', soort: 'weging', gewichtKg: 83, extra: { spiermassaKg: 32.9, energie: 6 } }),
    meting({ id: 'c', datum: '2026-10-01', soort: 'tussen', gewichtKg: 82, extra: { spiermassaKg: 33.6 } }),
  ]
  test('per meting: verschil sinds de vorige en sinds de start', () => {
    const r = extraRegels(reeks)
    expect(r.get('a')).toEqual([{ sleutel: 'spiermassaKg', label: 'Spiermassa', eenheid: 'kg', waarde: 32.4, sindsVorige: null, sindsStart: null }])
    expect(r.get('c')?.[0]).toMatchObject({ waarde: 33.6, sindsVorige: 0.7, sindsStart: 1.2 })
    expect(r.get('b')?.find((x) => x.sleutel === 'energie')).toMatchObject({ waarde: 6, sindsVorige: null, sindsStart: null })
  })
  test('verschil sinds start bevat de extra waarde na de vaste maten', () => {
    const v = verschilSindsStart(reeks)
    expect(v.map((x) => x.label)).toEqual(['Gewicht', 'Spiermassa'])
    expect(v[1].verschil).toBe(1.2)
  })
  test('grafiek: alleen reeksen met twee of meer metingen, gewicht eerst', () => {
    expect(grafiekReeksen(reeks).map((r) => r.sleutel)).toEqual(['gewichtKg', 'spiermassaKg'])
    expect(waardeLijn(reeks, 'spiermassaKg', 100, 50).map((p) => p.waarde)).toEqual([32.4, 32.9, 33.6])
    expect(waardeLijn(reeks, 'energie', 100, 50)).toEqual([])
  })
})
