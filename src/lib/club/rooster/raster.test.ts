import { describe, expect, it } from 'vitest'
import {
  bezettingDeel,
  bezettingNiveau,
  filterLessen,
  groepeerPerDag,
  rasterPlek,
  telPerLes,
  uurBereik,
  verdeelBanen,
  weekCijfers,
  type LesOverzicht,
} from './raster'

function les(over: Partial<LesOverzicht> = {}): LesOverzicht {
  return {
    id: 'l1',
    vestiging: 'budel',
    serieId: null,
    startOp: '2026-10-20T17:00:00Z',
    eindOp: '2026-10-20T17:45:00Z',
    capaciteit: 10,
    geannuleerd: false,
    annuleerReden: null,
    lestype: { id: 't1', naam: 'Spinning', soort: 'spinning' },
    zaal: { id: 'z1', naam: 'Spinningzaal' },
    instructeur: { id: 'm1', naam: 'Kim' },
    geboekt: 5,
    wachtlijst: 0,
    aanwezig: 0,
    noShow: 0,
    ...over,
  }
}

describe('telPerLes', () => {
  it('telt bezette plekken, wachtlijst en afgevinkte deelnemers', () => {
    const t = telPerLes([
      { lesId: 'a', status: 'geboekt' },
      { lesId: 'a', status: 'aanwezig' },
      { lesId: 'a', status: 'no_show' },
      { lesId: 'a', status: 'wachtlijst' },
      { lesId: 'a', status: 'geannuleerd' },
    ])
    expect(t.get('a')).toEqual({ geboekt: 3, wachtlijst: 1, aanwezig: 1, noShow: 1 })
  })
})

describe('bezetting', () => {
  it('kent de niveaus', () => {
    expect(bezettingNiveau(2, 10)).toBe('rustig')
    expect(bezettingNiveau(6, 10)).toBe('goed')
    expect(bezettingNiveau(9, 10)).toBe('bijna')
    expect(bezettingNiveau(10, 10)).toBe('vol')
    expect(bezettingDeel(12, 10)).toBe(1)
  })

  it('rekent weekcijfers zonder geannuleerde lessen', () => {
    const c = weekCijfers([les({ geboekt: 5, wachtlijst: 2, noShow: 1 }), les({ id: 'l2', geboekt: 10 }), les({ id: 'l3', geannuleerd: true, wachtlijst: 4 })])
    expect(c).toEqual({ lessen: 2, gemiddeldeBezetting: 0.75, wachtlijst: 2, noShows: 1, geannuleerd: 1 })
    expect(weekCijfers([]).gemiddeldeBezetting).toBeNull()
  })
})

describe('filters en groeperen', () => {
  it('filtert op zaal, lestype en instructeur', () => {
    const lessen = [les(), les({ id: 'l2', zaal: { id: 'z2', naam: 'Zaal 2' } })]
    expect(filterLessen(lessen, { zaal: 'z2', lestype: null, instructeur: null }).map((l) => l.id)).toEqual(['l2'])
    expect(filterLessen(lessen, { zaal: null, lestype: 't1', instructeur: 'm1' })).toHaveLength(2)
  })

  it('zet lessen op de Nederlandse kalenderdag', () => {
    const laat = les({ id: 'laat', startOp: '2026-10-20T22:30:00Z', eindOp: '2026-10-20T23:15:00Z' })
    const groepen = groepeerPerDag([laat, les()], ['2026-10-20', '2026-10-21'])
    expect(groepen['2026-10-20'].map((l) => l.id)).toEqual(['l1'])
    expect(groepen['2026-10-21'].map((l) => l.id)).toEqual(['laat'])
  })

  it('kent de plek op het raster', () => {
    expect(rasterPlek(les())).toEqual({ datum: '2026-10-20', van: 19 * 60, tot: 19 * 60 + 45 })
  })
})

describe('uurBereik', () => {
  it('neemt standaard 07:00 tot 21:00 en rekt op voor vroege en late lessen', () => {
    expect(uurBereik([])).toEqual({ van: 420, tot: 1260 })
    const vroeg = les({ startOp: '2026-10-20T04:30:00Z', eindOp: '2026-10-20T05:15:00Z' })
    expect(uurBereik([vroeg]).van).toBe(6 * 60)
  })

  it('gebruikt de openingstijden als die er zijn', () => {
    expect(uurBereik([], { van: '08:00', tot: '17:00' })).toEqual({ van: 480, tot: 1020 })
  })
})

describe('verdeelBanen', () => {
  it('zet overlappende lessen naast elkaar en losse lessen op volle breedte', () => {
    const b = verdeelBanen([
      { id: 'a', van: 540, tot: 600 },
      { id: 'b', van: 570, tot: 630 },
      { id: 'c', van: 700, tot: 760 },
    ])
    expect(b.get('a')).toEqual({ baan: 0, banen: 2 })
    expect(b.get('b')).toEqual({ baan: 1, banen: 2 })
    expect(b.get('c')).toEqual({ baan: 0, banen: 1 })
  })

  it('hergebruikt een vrije baan binnen dezelfde groep', () => {
    const b = verdeelBanen([
      { id: 'a', van: 540, tot: 660 },
      { id: 'b', van: 540, tot: 580 },
      { id: 'c', van: 600, tot: 640 },
    ])
    expect(b.get('c')).toEqual({ baan: 1, banen: 2 })
  })
})
