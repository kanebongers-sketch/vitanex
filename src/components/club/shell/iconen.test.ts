import { describe, expect, it } from 'vitest'
import { LayoutGrid } from 'lucide-react'
import type { InstelKijker } from '@/lib/club/kern/instel-paginas'
import { ONDERDELEN, inMenu } from './onderdelen'
import { HULPBALK } from './hulpbalk-items'
import { HULP_ICOON, ONDERDEEL_ICOON, heeftZoekIcoon, onderdeelIcoon, zoekIcoon } from './iconen'
import { ledenItems, zoekItems } from './zoeken'

const ALLES: InstelKijker = { uit: [], toegestaan: null, medewerker: false, betalenAan: false }

describe('iconen', () => {
  it('elk onderdeel en elk item van de hulpbalk heeft een eigen icoon', () => {
    for (const o of ONDERDELEN) expect(ONDERDEEL_ICOON[o.sleutel], o.sleutel).toBeDefined()
    for (const h of HULPBALK) expect(HULP_ICOON[h.sleutel], h.sleutel).toBeDefined()
  })

  it('rustig en consistent: in een groep van het menu geen twee onderdelen met hetzelfde icoon', () => {
    const groepen = new Map<string, unknown[]>()
    for (const o of ONDERDELEN.filter((x) => inMenu(x) || x.sectie || x.sleutel === 'vandaag')) {
      const lijst = groepen.get(o.groep) ?? []
      expect(lijst, `${o.groep}: ${o.sleutel}`).not.toContain(ONDERDEEL_ICOON[o.sleutel])
      groepen.set(o.groep, [...lijst, ONDERDEEL_ICOON[o.sleutel]])
    }
  })

  it('elk resultaat in Ctrl K heeft een bestaand icoon', () => {
    const items = [...zoekItems(ALLES, true), ...ledenItems([{ id: 'x', naam: 'Anna', lidnummer: '12', status: 'actief' }], 'an')]
    for (const i of items) expect(heeftZoekIcoon(i.icoon), `${i.id}: ${i.icoon}`).toBe(true)
  })

  it('onbekend valt terug op het rustige raster, nooit op niets', () => {
    expect(onderdeelIcoon('bestaat-niet')).toBe(LayoutGrid)
    expect(zoekIcoon('iets-anders')).toBe(LayoutGrid)
    expect(zoekIcoon('onderdeel:leden')).toBe(ONDERDEEL_ICOON.leden)
    expect(zoekIcoon('hulp:nieuw')).toBe(HULP_ICOON.nieuw)
  })

  it('de teller in Ctrl K staat alleen bij het menu en de secties van Vandaag', () => {
    const items = zoekItems(ALLES, true)
    const metTeller = items.filter((i) => i.teller).map((i) => i.id)
    expect(metTeller).toEqual(expect.arrayContaining(['menu-taken', 'menu-leads', 'menu-vandaag', 'vandaag-opvolgen']))
    for (const id of metTeller) expect(id.startsWith('menu-') || id.startsWith('vandaag-'), id).toBe(true)
  })
})
