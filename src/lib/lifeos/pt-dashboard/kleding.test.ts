import { describe, expect, test } from 'vitest'
import { bezitPerPersoon, kledingTotalen, leesKledingActie, leesMaten, voorraadPerArtikel, type KledingArtikel, type Uitgifte } from './kleding'

const SHIRT: KledingArtikel = { id: 'a1', naam: 'Shirt', maten: ['S', 'M', 'L'] }
const HOODIE: KledingArtikel = { id: 'a2', naam: 'Hoodie', maten: ['M'] }
const U = '11111111-1111-4111-8111-111111111111'
const uitgifte = (over: Partial<Uitgifte>): Uitgifte => ({
  id: 'u', persoonId: 'joey', artikelId: 'a1', maat: 'M', aantal: 1, uitgegevenOp: '2026-10-01', terugOp: null, notitie: null, ...over,
})

describe('maten', () => {
  test('standaardvolgorde, hoofdletters, geen dubbelen, eigen maten achteraan', () => {
    expect(leesMaten(['xl', 's', 'M', 'm', '128'])).toEqual(['S', 'M', 'XL', '128'])
    expect(leesMaten('L, s')).toEqual(['S', 'L'])
    expect(leesMaten(undefined)).toEqual([])
  })
})

describe('overzichten', () => {
  test('voorraad per artikel: elke maat, ontbrekend = 0', () => {
    const v = voorraadPerArtikel([SHIRT], [{ artikelId: 'a1', maat: 'M', aantal: 4 }])
    expect([...(v.get('a1') ?? [])]).toEqual([['S', 0], ['M', 4], ['L', 0]])
  })
  test('bezit: alleen wat nog niet terug is, per artikel + maat opgeteld', () => {
    const b = bezitPerPersoon(
      [
        uitgifte({ id: 'x1', aantal: 2 }),
        uitgifte({ id: 'x2', aantal: 1 }),
        uitgifte({ id: 'x3', artikelId: 'a2' }),
        uitgifte({ id: 'x4', terugOp: '2026-10-05' }),
        uitgifte({ id: 'x5', persoonId: 'amey', maat: 'L' }),
      ],
      [SHIRT, HOODIE],
    )
    expect(b.get('joey')?.map((r) => [r.artikelId, r.maat, r.aantal])).toEqual([['a1', 'M', 3], ['a2', 'M', 1]])
    expect(b.get('joey')?.[0].uitgiftes.map((u) => u.id)).toEqual(['x1', 'x2'])
    expect(b.get('amey')?.[0].aantal).toBe(1)
  })
  test('totalen: voorraad en wat nog uitstaat', () => {
    expect(kledingTotalen([{ artikelId: 'a1', maat: 'M', aantal: 5 }], [uitgifte({ aantal: 2 }), uitgifte({ terugOp: '2026-10-02' })])).toEqual({ opVoorraad: 5, uitgegeven: 2 })
  })
})

describe('invoer', () => {
  test('uitgeven: geldig, en grenzen op aantal en ids', () => {
    const goed = leesKledingActie({ actie: 'uitgeven', persoonId: U, artikelId: U, maat: 'm', aantal: '2' }, '2026-10-13')
    expect(goed).toEqual({ ok: true, waarde: { actie: 'uitgeven', persoonId: U, artikelId: U, maat: 'M', aantal: 2, datum: '2026-10-13', notitie: null } })
    expect(leesKledingActie({ actie: 'uitgeven', persoonId: U, artikelId: U, maat: 'M', aantal: 0 }, '2026-10-13').ok).toBe(false)
    expect(leesKledingActie({ actie: 'uitgeven', persoonId: 'x', artikelId: U, maat: 'M', aantal: 1 }, '2026-10-13').ok).toBe(false)
  })
  test('voorraad: 0 mag (op = op), negatief niet', () => {
    expect(leesKledingActie({ actie: 'voorraad', artikelId: U, maat: 'L', aantal: 0 }, '2026-10-13').ok).toBe(true)
    expect(leesKledingActie({ actie: 'voorraad', artikelId: U, maat: 'L', aantal: -1 }, '2026-10-13').ok).toBe(false)
  })
  test('artikel zonder maten of naam: fout; onbekende actie: fout', () => {
    expect(leesKledingActie({ actie: 'artikel', naam: 'Shirt', maten: [] }, '2026-10-13').ok).toBe(false)
    expect(leesKledingActie({ actie: 'artikel', naam: ' ', maten: ['M'] }, '2026-10-13').ok).toBe(false)
    expect(leesKledingActie({ actie: 'wissen' }, '2026-10-13').ok).toBe(false)
  })
  test('terug: standaard terug op voorraad, tenzij expliciet niet', () => {
    const r = leesKledingActie({ actie: 'terug', uitgifteId: U, opVoorraad: false }, '2026-10-13')
    expect(r.ok && r.waarde.actie === 'terug' && r.waarde.opVoorraad).toBe(false)
  })
})
