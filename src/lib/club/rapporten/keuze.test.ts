import { describe, expect, it } from 'vitest'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { heeftVreemdeVestiging, isAlles, keuzeZoek, kiesVestigingen, maandKeuzes, rapportKeuze, rapportPeriode } from './keuze'
import { isRapport, kiesRapport, RAPPORT_SLEUTELS, RAPPORTEN } from './definities'

const LIJST: VestigingInfo[] = [
  { sleutel: 'budel', naam: 'Budel', standaard: true },
  { sleutel: 'eersel', naam: 'Eersel', standaard: false },
  { sleutel: 'valkenswaard', naam: 'Valkenswaard', standaard: false },
]

describe('kiesVestigingen', () => {
  it('neemt alleen eigen vestigingen, in de volgorde van de sportschool', () => {
    expect(kiesVestigingen(LIJST, ['valkenswaard', 'budel'], null)).toEqual(['budel', 'valkenswaard'])
  })

  it('laat vreemde vestigingen vallen', () => {
    expect(kiesVestigingen(LIJST, ['andere-gym', 'eersel'], null)).toEqual(['eersel'])
  })

  it('"alle" geeft alle vestigingen', () => {
    expect(kiesVestigingen(LIJST, 'alle', null)).toEqual(['budel', 'eersel', 'valkenswaard'])
  })

  it('leest ook een kommalijst', () => {
    expect(kiesVestigingen(LIJST, 'eersel,budel', null)).toEqual(['budel', 'eersel'])
  })

  it('valt terug op de balk, dan de standaard', () => {
    expect(kiesVestigingen(LIJST, undefined, 'eersel')).toEqual(['eersel'])
    expect(kiesVestigingen(LIJST, ['onzin'], null)).toEqual(['budel'])
  })

  it('geeft niets zonder vestigingen', () => {
    expect(kiesVestigingen([], 'alle', null)).toEqual([])
    expect(kiesVestigingen([], undefined, null)).toEqual([])
  })
})

describe('heeftVreemdeVestiging', () => {
  it('weigert een vestiging van een andere sportschool', () => {
    expect(heeftVreemdeVestiging(LIJST, ['budel', 'andere-gym'])).toBe(true)
    expect(heeftVreemdeVestiging(LIJST, ['budel', 'eersel'])).toBe(false)
    expect(heeftVreemdeVestiging(LIJST, ['alle'])).toBe(false)
  })
})

describe('rapportKeuze', () => {
  it('maakt van onbekende waarden een veilige keuze', () => {
    const k = rapportKeuze({ rapport: 'drop table', maand: '2099-01', vs: undefined }, LIJST, 'budel', '2026-10-17')
    expect(k).toEqual({ rapport: 'ledenlijst', maand: '2026-10', vestigingen: ['budel'] })
  })

  it('neemt een geldige keuze over', () => {
    const k = rapportKeuze({ rapport: 'uren', maand: '2026-09', vs: ['eersel'] }, LIJST, 'budel', '2026-10-17')
    expect(k).toEqual({ rapport: 'uren', maand: '2026-09', vestigingen: ['eersel'] })
  })
})

describe('rapportPeriode', () => {
  it('beslaat de hele kalendermaand, ook in een schrikkeljaar', () => {
    const p = rapportPeriode('2028-02')
    expect(p.eerste).toBe('2028-02-01')
    expect(p.laatste).toBe('2028-02-29')
  })

  it('begint en eindigt om middernacht Nederlandse tijd, ook rond de wintertijd', () => {
    const p = rapportPeriode('2026-10')
    expect(p.van.toISOString()).toBe('2026-09-30T22:00:00.000Z')
    expect(p.tot.toISOString()).toBe('2026-10-31T23:00:00.000Z')
    expect(rapportPeriode('2026-12').tot.toISOString()).toBe('2026-12-31T23:00:00.000Z')
  })
})

describe('keuzeZoek en isAlles', () => {
  it('schrijft "alle" kort en anders elke vestiging', () => {
    const k = { rapport: 'bezoek' as const, maand: '2026-09', vestigingen: ['budel', 'eersel'] }
    expect(keuzeZoek(k, false).toString()).toBe('rapport=bezoek&maand=2026-09&vs=budel&vs=eersel')
    expect(keuzeZoek(k, true).toString()).toBe('rapport=bezoek&maand=2026-09&vs=alle')
    expect(isAlles(k, LIJST)).toBe(false)
    expect(isAlles({ ...k, vestigingen: ['budel', 'eersel', 'valkenswaard'] }, LIJST)).toBe(true)
  })
})

describe('maandKeuzes', () => {
  it('geeft 36 maanden, nieuwste eerst, met hoofdletter', () => {
    const m = maandKeuzes('2026-10-17')
    expect(m).toHaveLength(36)
    expect(m[0]).toEqual({ maand: '2026-10', label: 'Oktober 2026' })
    expect(m[35].maand).toBe('2023-11')
  })
})

describe('definities', () => {
  it('kent alleen de vaste rapporten', () => {
    expect(isRapport('bezoek')).toBe(true)
    expect(isRapport('metingen')).toBe(false)
    expect(kiesRapport(['noshows'])).toBe('noshows')
    expect(kiesRapport(undefined)).toBe('ledenlijst')
  })

  it('heeft geen kolommen met gezondheids- of geboortegegevens', () => {
    const verboden = /geboorte|gewicht|vet|bloed|blessure|gezond|meting|intake|notitie|geslacht/i
    for (const s of RAPPORT_SLEUTELS) {
      for (const k of RAPPORTEN[s].kolommen) expect(k).not.toMatch(verboden)
    }
  })

  it('heeft unieke kolomnamen per rapport', () => {
    for (const s of RAPPORT_SLEUTELS) expect(new Set(RAPPORTEN[s].kolommen).size).toBe(RAPPORTEN[s].kolommen.length)
  })
})
