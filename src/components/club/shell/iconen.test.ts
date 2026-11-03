import { describe, expect, it } from 'vitest'
import { LayoutGrid } from 'lucide-react'
import type { InstelKijker } from '@/lib/club/kern/instel-paginas'
import { ONDERDELEN, PLEKKEN, schermenVan } from './onderdelen'
import { KOP_HULP } from './kop-hulp'
import { HULP_ICOON, ONDERDEEL_ICOON, PLEK_ICOON, heeftZoekIcoon, onderdeelIcoon, plekIcoon, zoekIcoon } from './iconen'
import { ledenItems, zoekItems } from './zoeken'

const ALLES: InstelKijker = { uit: [], toegestaan: null, medewerker: false, betalenAan: false }

describe('iconen', () => {
  it('elke plek, elk onderdeel en het vraagteken hebben een eigen icoon', () => {
    for (const p of PLEKKEN) expect(PLEK_ICOON[p.sleutel], p.sleutel).toBeDefined()
    expect(new Set(PLEKKEN.map((p) => plekIcoon(p.sleutel))).size).toBe(PLEKKEN.length)
    for (const o of ONDERDELEN) expect(ONDERDEEL_ICOON[o.sleutel], o.sleutel).toBeDefined()
    for (const h of KOP_HULP) expect(HULP_ICOON[h.sleutel], h.sleutel).toBeDefined()
  })

  it('rustig en consistent: binnen een plek geen twee schermen met hetzelfde icoon', () => {
    for (const p of PLEKKEN) {
      const iconen = [...schermenVan(p.sleutel), ...ONDERDELEN.filter((o) => o.plek === p.sleutel && (o.sectie || o.onder))].map((o) => ONDERDEEL_ICOON[o.sleutel])
      expect(new Set(iconen).size, p.sleutel).toBe(iconen.length)
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
