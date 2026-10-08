import { describe, expect, test } from 'vitest'
import { gewichtLijn, leesMeting, leesMetingInvoer, sorteer, verschilSindsStart, verschilTekst, type Meting } from './metingen'

const meting = (over: Partial<Meting> = {}): Meting => ({
  id: 'm', datum: '2026-09-07', soort: 'start', gewichtKg: null, tailleCm: null, heupCm: null, borstCm: null, armCm: null, beenCm: null,
  cardiotest: null, krachtOefening: null, krachtRm: null, krachtKg: null, fotosGemaakt: false, notitie: null, ...over,
})

describe('leesMetingInvoer', () => {
  const basis = { datum: '2026-09-07', soort: 'start' }
  test('datum, soort en minstens één waarde zijn nodig', () => {
    expect(leesMetingInvoer(null)).toMatchObject({ ok: false })
    expect(leesMetingInvoer({ ...basis, datum: 'gister', gewichtKg: 80 })).toEqual({ ok: false, fout: 'Kies de datum van de meting.' })
    expect(leesMetingInvoer({ ...basis, soort: 'x', gewichtKg: 80 })).toEqual({ ok: false, fout: 'Kies het soort meting.' })
    expect(leesMetingInvoer(basis)).toEqual({ ok: false, fout: 'Vul minstens één meetwaarde in.' })
  })
  test('geen datum in de toekomst', () => {
    expect(leesMetingInvoer({ ...basis, gewichtKg: 80 }, '2026-09-06')).toMatchObject({ ok: false })
    expect(leesMetingInvoer({ ...basis, gewichtKg: 80 }, '2026-09-07')).toMatchObject({ ok: true })
  })
  test('komma-getallen, afronden op 0,1; buiten bereik = fout met label', () => {
    const r = leesMetingInvoer({ ...basis, gewichtKg: '82,46', tailleCm: '' })
    expect(r).toMatchObject({ ok: true, waarde: { gewichtKg: 82.5, tailleCm: null } })
    expect(leesMetingInvoer({ ...basis, armCm: 400 })).toEqual({ ok: false, fout: 'Arm: vul een getal tussen 10 en 100 cm in.' })
  })
  test('kracht: oefening en RM alleen met een gewicht; RM alleen 1 of 5', () => {
    expect(leesMetingInvoer({ ...basis, fotosGemaakt: true, krachtOefening: 'Squat', krachtRm: 5 })).toMatchObject({
      ok: true, waarde: { krachtOefening: null, krachtRm: null, krachtKg: null },
    })
    expect(leesMetingInvoer({ ...basis, krachtKg: 60, krachtOefening: ' Squat ', krachtRm: 3 })).toMatchObject({
      ok: true, waarde: { krachtOefening: 'Squat', krachtRm: null, krachtKg: 60 },
    })
  })
  test('leesMeting vereist een id', () => {
    expect(leesMeting({ ...basis, gewichtKg: 80 })).toBeNull()
    expect(leesMeting({ id: 'a', ...basis, gewichtKg: 80 })?.id).toBe('a')
  })
})

describe('verschilSindsStart', () => {
  test('startmeting tegenover de laatste meting met die maat', () => {
    const ms = [
      meting({ id: 'c', datum: '2026-11-02', soort: 'tussen', gewichtKg: 80, tailleCm: 90 }),
      meting({ id: 'a', datum: '2026-09-07', soort: 'start', gewichtKg: 84.2, tailleCm: 95 }),
      meting({ id: 'b', datum: '2026-10-05', soort: 'tussen', gewichtKg: 82 }),
    ]
    const v = verschilSindsStart(ms)
    expect(v.map((x) => [x.label, x.verschil])).toEqual([['Gewicht', -4.2], ['Taille', -5]])
    expect(v[0]).toMatchObject({ van: { datum: '2026-09-07', waarde: 84.2 }, naar: { datum: '2026-11-02', waarde: 80 } })
  })
  test('één meting = geen verschil', () => {
    expect(verschilSindsStart([meting({ gewichtKg: 80 })])).toEqual([])
  })
  test('zonder startmeting: de oudste meting is het vertrekpunt', () => {
    const v = verschilSindsStart([meting({ id: 'a', soort: 'tussen', armCm: 30 }), meting({ id: 'b', datum: '2026-10-01', soort: 'tussen', armCm: 31.5 })])
    expect(v).toEqual([expect.objectContaining({ label: 'Arm', verschil: 1.5 })])
  })
  test('kracht alleen bij dezelfde oefening en RM', () => {
    const ms = [
      meting({ id: 'a', krachtOefening: 'Squat', krachtRm: 5, krachtKg: 50 }),
      meting({ id: 'b', datum: '2026-10-05', soort: 'tussen', krachtOefening: 'squat', krachtRm: 5, krachtKg: 60 }),
      meting({ id: 'c', datum: '2026-11-02', soort: 'tussen', krachtOefening: 'Bench', krachtRm: 5, krachtKg: 40 }),
    ]
    expect(verschilSindsStart(ms)).toEqual([expect.objectContaining({ label: 'Kracht (Squat 5RM)', verschil: 10 })])
  })
})

describe('weergave', () => {
  test('verschilTekst', () => {
    expect(verschilTekst({ verschil: -4.2, eenheid: 'kg' })).toBe('−4,2 kg')
    expect(verschilTekst({ verschil: 1, eenheid: 'cm' })).toBe('+1 cm')
    expect(verschilTekst({ verschil: 0, eenheid: 'kg' })).toBe('0 kg')
  })
  test('sorteer: op datum, bij gelijke datum start eerst', () => {
    const s = sorteer([meting({ id: 'b', soort: 'tussen' }), meting({ id: 'a' }), meting({ id: 'c', datum: '2026-01-01', soort: 'eind' })])
    expect(s.map((m) => m.id)).toEqual(['c', 'a', 'b'])
  })
})

describe('gewichtLijn', () => {
  test('minder dan twee gewichten → leeg', () => {
    expect(gewichtLijn([meting({ gewichtKg: 80 }), meting({ id: 'x', tailleCm: 90 })], 300, 100)).toEqual([])
  })
  test('x naar datum, y omgekeerd naar waarde, binnen het vlak', () => {
    const p = gewichtLijn([
      meting({ id: 'a', gewichtKg: 84 }),
      meting({ id: 'b', datum: '2026-09-21', soort: 'tussen', gewichtKg: 82 }),
      meting({ id: 'c', datum: '2026-10-05', soort: 'tussen', gewichtKg: 80 }),
    ], 300, 100)
    expect(p.map((x) => Math.round(x.x))).toEqual([0, 150, 300])
    expect(p[0].y).toBeLessThan(p[2].y)
    for (const x of p) expect(x.y).toBeGreaterThanOrEqual(0)
    for (const x of p) expect(x.y).toBeLessThanOrEqual(100)
  })
})
