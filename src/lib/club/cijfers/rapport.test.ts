import { describe, expect, it } from 'vitest'
import type { BezoekTelling } from './bezoek'
import type { LidCijferRij } from './leden'
import type { LesDag } from './lesdagen'
import { cijfersVoor, dataVanaf, dekkingVan, type Bronnen } from './maandcijfers'
import { maandVenster, vergelijkVenster } from './maand'
import { maakRapport } from './rapport'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'

const VANDAAG = '2026-10-14'

/** De acht vestigingen van Fit Factory zoals ze in club_vestigingen staan. */
const FIT_FACTORY: VestigingInfo[] = [
  ['budel', 'Budel'], ['bergeijk', 'Bergeijk'], ['someren', 'Someren'], ['eindhoven_boschdijk', 'Eindhoven Boschdijk'],
  ['eindhoven_tongelre', 'Eindhoven Tongelre'], ['eersel', 'Eersel'], ['oisterwijk', 'Oisterwijk'], ['bladel', 'Bladel'],
].map(([sleutel, naam]) => ({ sleutel, naam, standaard: sleutel === 'budel' }))

function lid(id: string, deel: Partial<LidCijferRij>): LidCijferRij {
  return { id, vestiging: 'budel', status: 'actief', lidSinds: '2025-01-01', einddatum: null, geboortedatum: null, geslacht: null, ...deel }
}

const dag = (vestiging: 'budel' | 'eersel', sleutel: string, aantal: number): BezoekTelling => ({ vestiging, soort: 'dag', sleutel, aantal })
const lesDag = (d: string, lessen: number, capaciteit: number, bezet: number): LesDag => ({ vestiging: 'budel', dag: d, lessen, capaciteit, bezet, aanwezig: bezet, noShow: 0 })

const bronnen: Bronnen = {
  leden: [
    lid('1', { lidSinds: '2025-01-01' }),
    lid('2', { lidSinds: '2025-01-01' }),
    lid('3', { lidSinds: '2026-10-05' }),
    lid('4', { lidSinds: '2025-03-01', status: 'gestopt', einddatum: '2026-09-10' }),
    lid('5', { vestiging: 'eersel', lidSinds: '2024-01-01' }),
  ],
  bezoek: [dag('budel', '2026-10-02', 14), dag('budel', '2026-09-03', 7), dag('budel', '2026-09-20', 100), dag('eersel', '2026-10-02', 9), { vestiging: 'budel', soort: 'uur', sleutel: '5-19', aantal: 14 }],
  lesDagen: [lesDag('2026-10-02', 2, 20, 10), lesDag('2026-09-02', 2, 20, 5)],
  leads: [
    { vestiging: 'budel', bron: 'website', status: 'lid', proeflesOp: null, aangemaakt: '2026-10-03' },
    { vestiging: 'budel', bron: 'website', status: 'nieuw', proeflesOp: null, aangemaakt: '2026-09-20' },
  ],
  begin: [
    { vestiging: 'budel', bron: 'bezoek', dag: '2026-08-15' },
    { vestiging: 'budel', bron: 'lessen', dag: '2026-08-15' },
    { vestiging: 'budel', bron: 'leads', dag: '2026-09-05' },
    { vestiging: 'eersel', bron: 'bezoek', dag: '2026-10-01' },
  ],
}

describe('cijfers van een venster', () => {
  const set = new Set(['budel'] as const)
  const huidig = maandVenster('2026-10', VANDAAG)

  it('telt bestand, stroom, bezoek, lessen en leads voor de lopende maand', () => {
    const c = cijfersVoor(bronnen, set, huidig, VANDAAG)
    expect(c).toMatchObject({ bestandBegin: 2, bestandEind: 3, instroom: 1, uitstroom: 0, groei: 1, bezoek: 14, lessen: 2, bezetting: 0.5, leads: 1, leadsLid: 1, conversie: 1 })
    // 14 bezoeken in 14 dagen = 7 per week, gedeeld door een gemiddeld bestand van 2,5.
    expect(c.bezoekPerLidPerWeek).toBeCloseTo(7 / 2.5)
  })

  it('vergelijkt met dezelfde eerste dagen van de vorige maand', () => {
    const vorige = vergelijkVenster('2026-09', huidig)
    const c = cijfersVoor(bronnen, set, vorige, VANDAAG)
    expect(c).toMatchObject({ bezoek: 7, bestandBegin: 3, bestandEind: 2, uitstroom: 1, groei: -1, leads: 0, conversie: null })
  })

  it('zegt eerlijk wanneer er geen data is om mee te vergelijken', () => {
    const vanaf = dataVanaf(bronnen, set)
    expect(dekkingVan(vanaf, vergelijkVenster('2026-09', huidig))).toEqual({ leden: true, bezoek: true, lessen: true, leads: false })
    expect(dekkingVan(vanaf, vergelijkVenster('2025-10', huidig))).toMatchObject({ leden: true, bezoek: false, lessen: false })
    expect(dekkingVan(dataVanaf(bronnen, new Set(['eersel'] as const)), huidig)).toMatchObject({ bezoek: true, lessen: false })
  })
})

describe('maandrapport', () => {
  it('maakt kerncijfers, vergelijkingen, 12 maanden en alle vestigingen van de sportschool', () => {
    const r = maakRapport({ vandaag: VANDAAG, nu: new Date('2026-10-14T10:00:00Z'), maand: '2026-10', bereik: 'vestiging', vestiging: 'budel', vestigingen: FIT_FACTORY, bronnen, lessen: [], komend: [] })
    expect(r.huidig.venster).toMatchObject({ van: '2026-10-01', tot: '2026-10-14', lopend: true })
    expect(r.vorige.venster.tot).toBe('2026-09-14')
    expect(r.vorigJaar.venster.maand).toBe('2025-10')
    expect(r.trend.map((t) => t.venster.maand)).toEqual([
      '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10',
    ])
    expect(r.trend.at(-2)?.cijfers.bezoek).toBe(107)
    expect(r.trend.at(-1)?.venster.lopend).toBe(true)
    expect(r.perDag).toHaveLength(14)
    expect(r.perDag[1]).toEqual({ dag: '2026-10-02', aantal: 14 })
    expect(r.piek).toEqual({ weekdag: 5, uur: 19, aantal: 14 })
    expect(r.leads.totaal.leads).toBe(1)
    expect(r.status.actief).toBe(3)
    expect(r.vergelijking).toHaveLength(8)
    expect(r.vergelijking.map((v) => v.label)).toEqual(FIT_FACTORY.map((v) => v.naam))
    expect(r.vergelijking.find((v) => v.vestiging === 'eersel')?.cijfers).toMatchObject({ bestandEind: 1, bezoek: 9 })
  })

  it('telt alle vestigingen samen bij het bereik alle', () => {
    const r = maakRapport({ vandaag: VANDAAG, nu: new Date('2026-10-14T10:00:00Z'), maand: '2026-10', bereik: 'alle', vestiging: 'budel', vestigingen: FIT_FACTORY, bronnen, lessen: [], komend: [] })
    expect(r.huidig.cijfers).toMatchObject({ bezoek: 23, bestandEind: 4 })
  })

  it('vergelijkt alleen de vestigingen van een andere sportschool', () => {
    const demo = [{ sleutel: 'demo-centrum', naam: 'Demo Centrum', standaard: true }]
    const r = maakRapport({ vandaag: VANDAAG, nu: new Date('2026-10-14T10:00:00Z'), maand: '2026-10', bereik: 'vestiging', vestiging: 'demo-centrum', vestigingen: demo, bronnen, lessen: [], komend: [] })
    expect(r.vergelijking).toEqual([expect.objectContaining({ vestiging: 'demo-centrum', label: 'Demo Centrum' })])
    expect(r.huidig.cijfers.bezoek).toBe(0)
  })

  it('een afgesloten maand vergelijkt met de hele vorige maand', () => {
    const r = maakRapport({ vandaag: VANDAAG, nu: new Date('2026-10-14T10:00:00Z'), maand: '2026-09', bereik: 'vestiging', vestiging: 'budel', vestigingen: FIT_FACTORY, bronnen, lessen: [], komend: [] })
    expect(r.huidig.venster).toMatchObject({ heel: true, lopend: false, dagen: 30 })
    expect(r.vorige.venster).toMatchObject({ maand: '2026-08', heel: true, dagen: 31 })
    expect(r.huidig.cijfers.bezoek).toBe(107)
    expect(r.vorige.dekking.bezoek).toBe(false)
  })
})
