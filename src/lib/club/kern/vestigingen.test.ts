import { describe, expect, it } from 'vitest'
import { binnenVestigingen, hoortBij, isVestigingSlug, kiesUit, naamVan, vestigingenUitRijen, type VestigingInfo } from './vestigingen'

const FIT_FACTORY: VestigingInfo[] = [
  { sleutel: 'budel', naam: 'Budel', standaard: true },
  { sleutel: 'bergeijk', naam: 'Bergeijk', standaard: false },
  { sleutel: 'eindhoven_boschdijk', naam: 'Eindhoven Boschdijk', standaard: false },
]

describe('isVestigingSlug', () => {
  it('accepteert kleine letters, cijfers, - en _', () => {
    expect(isVestigingSlug('budel')).toBe(true)
    expect(isVestigingSlug('eindhoven_boschdijk')).toBe(true)
    expect(isVestigingSlug('demo-centrum')).toBe(true)
    expect(isVestigingSlug('a1')).toBe(true)
  })

  it('weigert hoofdletters, spaties, te kort, te lang en geen tekst', () => {
    expect(isVestigingSlug('Budel')).toBe(false)
    expect(isVestigingSlug('de pit')).toBe(false)
    expect(isVestigingSlug('-budel')).toBe(false)
    expect(isVestigingSlug('b')).toBe(false)
    expect(isVestigingSlug('a'.repeat(61))).toBe(false)
    expect(isVestigingSlug('')).toBe(false)
    expect(isVestigingSlug(null)).toBe(false)
    expect(isVestigingSlug(42)).toBe(false)
  })
})

describe('vestigingenUitRijen', () => {
  it('maakt VestigingInfo van rijen en slaat ongeldige over', () => {
    const rijen = [
      { vestiging: 'budel', naam: 'Budel', standaard: true },
      { vestiging: 'demo-centrum', naam: '  ', standaard: null },
      { vestiging: 'Fout!', naam: 'Fout' },
      null,
      'tekst',
    ]
    expect(vestigingenUitRijen(rijen)).toEqual([
      { sleutel: 'budel', naam: 'Budel', standaard: true },
      { sleutel: 'demo-centrum', naam: 'demo-centrum', standaard: false },
    ])
  })
})

describe('kiesUit', () => {
  it('neemt de gekozen vestiging als die bij de sportschool hoort', () => {
    expect(kiesUit(FIT_FACTORY, 'bergeijk')).toBe('bergeijk')
    expect(kiesUit(FIT_FACTORY, ['eindhoven_boschdijk', 'budel'])).toBe('eindhoven_boschdijk')
  })

  it('valt terug op de standaard bij een onbekende of lege keuze', () => {
    expect(kiesUit(FIT_FACTORY, 'demo-centrum')).toBe('budel')
    expect(kiesUit(FIT_FACTORY, undefined)).toBe('budel')
    expect(kiesUit(FIT_FACTORY, null)).toBe('budel')
    expect(kiesUit(FIT_FACTORY, [])).toBe('budel')
  })

  it('zonder standaard de eerste, en zonder vestigingen null', () => {
    const geenStandaard = FIT_FACTORY.map((v) => ({ ...v, standaard: false }))
    expect(kiesUit(geenStandaard, 'onbekend')).toBe('budel')
    expect(kiesUit([], 'budel')).toBeNull()
  })
})

describe('naamVan', () => {
  it('geeft de naam, of de sleutel als de vestiging onbekend is', () => {
    expect(naamVan(FIT_FACTORY, 'eindhoven_boschdijk')).toBe('Eindhoven Boschdijk')
    expect(naamVan(FIT_FACTORY, 'demo-centrum')).toBe('demo-centrum')
    expect(naamVan([], 'budel')).toBe('budel')
  })
})

describe('hoortBij', () => {
  it('alleen een vestiging van deze sportschool', () => {
    expect(hoortBij(FIT_FACTORY, 'budel')).toBe(true)
    expect(hoortBij(FIT_FACTORY, 'demo-centrum')).toBe(false)
    expect(hoortBij([{ sleutel: 'demo-centrum', naam: 'Demo', standaard: true }], 'budel')).toBe(false)
    expect(hoortBij(FIT_FACTORY, null)).toBe(false)
    expect(hoortBij(FIT_FACTORY, 7)).toBe(false)
    expect(hoortBij([], 'budel')).toBe(false)
  })
})

describe('binnenVestigingen', () => {
  it('geeft het record alleen terug bij een eigen vestiging', () => {
    const lid = { id: 'l1', vestiging: 'bergeijk' }
    expect(binnenVestigingen(FIT_FACTORY, lid)).toBe(lid)
    expect(binnenVestigingen([FIT_FACTORY[0]], lid)).toBeNull()
    expect(binnenVestigingen(FIT_FACTORY, null)).toBeNull()
  })
})
