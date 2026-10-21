import { describe, expect, it } from 'vitest'
import type { InstelKijker } from '@/lib/club/kern/instel-paginas'
import { filterZoek, normaliseerZoek, zoekHref, zoekItems } from './zoeken'

const ALLES: InstelKijker = { uit: [], toegestaan: null, medewerker: false, betalenAan: false }

describe('zoekItems', () => {
  it('vindt ook instel-pagina\'s die niet in het menu staan', () => {
    const items = zoekItems(ALLES, true)
    expect(filterZoek(items, 'huisstijl')[0].label).toBe('Huisstijl')
    expect(filterZoek(items, 'zalen')[0].pad).toBe('/instellingen/zalen')
    expect(filterZoek(items, 'feestdag').map((i) => i.id)).toContain('instel-sluiting')
    expect(filterZoek(items, 'automatiseringen').map((i) => i.id)).toEqual(['instel-opvolgregels'])
  })

  it('unieke ids en elk item een keer', () => {
    const ids = zoekItems(ALLES, true).map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('een clubmanager vindt niets wat hij niet mag', () => {
    const items = zoekItems({ ...ALLES, toegestaan: ['vandaag', 'leden'] }, false)
    const labels = items.map((i) => i.label)
    expect(labels).toEqual(expect.arrayContaining(['Vandaag', 'Leden', 'Hulp']))
    for (const verboden of ['Huisstijl', 'Rechten per rol', 'Instellingen', 'Zalen', 'Cijfers', 'Abonnement en facturen']) expect(labels).not.toContain(verboden)
  })

  it('onderdeel uit: niet te vinden', () => {
    const labels = zoekItems({ ...ALLES, uit: ['rooster'] }, true).map((i) => i.label)
    expect(labels).not.toContain('Groepslessen')
    expect(labels).not.toContain('Weekrooster')
  })
})

describe('filterZoek', () => {
  const items = zoekItems(ALLES, true)
  it('leeg geeft alles, onzin niets', () => {
    expect(filterZoek(items, '  ')).toHaveLength(items.length)
    expect(filterZoek(items, 'xyzonzin')).toEqual([])
  })
  it('alle woorden moeten passen en accenten maken niet uit', () => {
    expect(normaliseerZoek('  Ideeën  ')).toBe('ideeen')
    expect(filterZoek(items, 'ideeen').map((i) => i.label)).toContain('Notities')
    expect(filterZoek(items, 'ledenapp bekijken')[0].label).toBe('Ledenapp bekijken')
  })
})

describe('zoekHref', () => {
  it('vestiging mee waar dat hoort', () => {
    expect(zoekHref({ pad: '', perVestiging: true }, 'budel')).toBe('/club?v=budel')
    expect(zoekHref({ pad: '/beheer/rechten', perVestiging: false }, 'budel')).toBe('/club/beheer/rechten')
  })
})
