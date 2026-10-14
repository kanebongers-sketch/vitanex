import { describe, expect, it } from 'vitest'
import { bezettingPerLestype, bezettingPerTijdslot, geweestVoor, lesTotalen, telPerLes, wachtlijstdruk, type LesBasis } from './lessen'
import { maakRapport, gemiddeldPerWeek } from './rapport'

const les = (id: string, lestype: string, start: string, capaciteit = 10, geannuleerd = false): LesBasis => ({
  id,
  vestiging: 'budel',
  lestype,
  start: new Date(start),
  capaciteit,
  geannuleerd,
})

describe('lescijfers', () => {
  const lessen = telPerLes(
    [les('a', 'Spinning', '2026-10-12T05:00:00Z', 4), les('b', 'Yoga', '2026-10-12T17:00:00Z', 10), les('c', 'Spinning', '2026-10-20T05:00:00Z', 2), les('d', 'Yoga', '2026-10-11T17:00:00Z', 10, true)],
    [
      { lesId: 'a', status: 'aanwezig' },
      { lesId: 'a', status: 'aanwezig' },
      { lesId: 'a', status: 'no_show' },
      { lesId: 'a', status: 'geannuleerd' },
      { lesId: 'b', status: 'aanwezig' },
      { lesId: 'c', status: 'geboekt' },
      { lesId: 'c', status: 'geboekt' },
      { lesId: 'c', status: 'wachtlijst' },
      { lesId: 'x', status: 'geboekt' },
    ],
  )
  const nu = new Date('2026-10-14T10:00:00Z')

  it('telt reserveringen per les op status', () => {
    expect(lessen.find((l) => l.id === 'a')).toMatchObject({ bezet: 3, aanwezig: 2, noShow: 1, wachtlijst: 0 })
  })

  it('rekent bezetting en no-show over lessen die geweest zijn', () => {
    const geweest = geweestVoor(lessen, nu)
    expect(geweest.map((l) => l.id)).toEqual(['a', 'b'])
    const t = lesTotalen(geweest)
    expect(t.bezetting).toBeCloseTo(4 / 14)
    expect(t.noShowAandeel).toBeCloseTo(1 / 4)
    expect(bezettingPerLestype(geweest)[0]).toMatchObject({ label: 'Spinning', bezetting: 0.75 })
    expect(bezettingPerTijdslot(geweest).map((g) => g.label)).toEqual(['07:00', '19:00'])
  })

  it('meet wachtlijstdruk op komende lessen', () => {
    const komend = lessen.filter((l) => l.start > nu)
    expect(wachtlijstdruk(komend)).toMatchObject({ lessen: 1, vol: 1, metWachtlijst: 1, wachtenden: 1 })
  })

  it('geeft geen no-show percentage zonder afgeronde reserveringen', () => {
    expect(lesTotalen([]).noShowAandeel).toBeNull()
  })
})

describe('rapport', () => {
  it('rekent het gemiddelde zonder de lopende week', () => {
    expect(gemiddeldPerWeek([10, 20, 3])).toBe(15)
    expect(gemiddeldPerWeek([7])).toBe(7)
  })

  it('stelt een rapport samen per vestiging en vergelijkt alle acht', () => {
    const r = maakRapport({
      vandaag: '2026-10-14',
      nu: new Date('2026-10-14T10:00:00Z'),
      maandagen: ['2026-09-28', '2026-10-05', '2026-10-12'],
      bereik: 'vestiging',
      vestiging: 'budel',
      leden: [
        { id: '1', vestiging: 'budel', status: 'actief', lidSinds: '2026-01-01', einddatum: null, geboortedatum: '1990-01-01', geslacht: 'vrouw' },
        { id: '2', vestiging: 'budel', status: 'actief', lidSinds: '2026-10-06', einddatum: null, geboortedatum: null, geslacht: 'man' },
        { id: '3', vestiging: 'eersel', status: 'actief', lidSinds: '2026-01-01', einddatum: null, geboortedatum: null, geslacht: null },
      ],
      bezoek: [
        { vestiging: 'budel', soort: 'week', sleutel: '2026-09-28', aantal: 4 },
        { vestiging: 'budel', soort: 'week', sleutel: '2026-10-05', aantal: 6 },
        { vestiging: 'eersel', soort: 'week', sleutel: '2026-10-05', aantal: 9 },
      ],
      lessen: [],
      komend: [],
      leads: [{ vestiging: 'budel', bron: 'website', status: 'lid', proeflesOp: null }],
    })
    expect(r.status.actief).toBe(2)
    expect(r.groei).toBe(1)
    expect(r.bezoek).toEqual([4, 6, 0])
    expect(r.bezoekGemiddeld).toBe(5)
    expect(r.bezoekPerLid).toBe(2.5)
    expect(r.vergelijking).toHaveLength(8)
    expect(r.vergelijking.find((v) => v.vestiging === 'eersel')).toMatchObject({ actief: 1, bezoekPerWeek: 4.5, leads: 0, conversie: null })
    expect(r.leads.totaal.conversie).toBe(1)
  })
})
