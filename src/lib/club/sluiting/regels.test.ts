import { describe, expect, it } from 'vitest'
import type { Openingstijden } from '@/lib/club/rooster/openingstijden'
import { nederlandseFeestdagen } from './feestdagen'
import type { Sluiting } from './model'
import {
  geraaktPerSluiting,
  geraakteLessen,
  komendeAfwijkingen,
  nieuweFeestdagen,
  openingstijdenOp,
  perMaand,
  sluitingOp,
  uitzonderingenVoor,
  type LesMoment,
} from './regels'

function sluiting(deel: Partial<Sluiting> & Pick<Sluiting, 'id' | 'datum'>): Sluiting {
  return { vestiging: null, soort: 'gesloten', van: null, tot: null, reden: 'Test', demo: false, ...deel }
}

const ALLE_KERST = sluiting({ id: 'a', datum: '2026-12-25', reden: 'Eerste Kerstdag' })
const BUDEL_KERST = sluiting({ id: 'b', datum: '2026-12-25', vestiging: 'budel', soort: 'afwijkend', van: '09:00', tot: '14:00' })
const TWEEDE = sluiting({ id: 'c', datum: '2026-12-26', soort: 'afwijkend', van: '10:00', tot: '16:00' })

// Ma tot za open, zondag dicht.
const STANDAARD: Openingstijden = [
  { van: '06:00', tot: '23:00' },
  { van: '06:00', tot: '23:00' },
  { van: '06:00', tot: '23:00' },
  { van: '06:00', tot: '23:00' },
  { van: '06:00', tot: '23:00' },
  { van: '08:00', tot: '16:00' },
  null,
]

describe('sluitingOp', () => {
  it('geeft de regel voor alle vestigingen als er niets eigens is', () => {
    expect(sluitingOp('2026-12-25', 'eersel', [ALLE_KERST, BUDEL_KERST])?.id).toBe('a')
  })

  it('laat de regel van de vestiging zelf voorgaan', () => {
    expect(sluitingOp('2026-12-25', 'budel', [ALLE_KERST, BUDEL_KERST])?.id).toBe('b')
  })

  it('geeft null op een gewone dag', () => {
    expect(sluitingOp('2026-12-24', 'budel', [ALLE_KERST, BUDEL_KERST])).toBeNull()
  })
})

describe('openingstijdenOp', () => {
  const alle = [ALLE_KERST, BUDEL_KERST, TWEEDE]

  it('is gesloten op een sluitingsdag', () => {
    const uit = openingstijdenOp('2026-12-25', 'eersel', STANDAARD, alle)
    expect(uit.status).toBe('gesloten')
    expect(uit.sluiting?.id).toBe('a')
  })

  it('geeft de afwijkende tijden', () => {
    expect(openingstijdenOp('2026-12-25', 'budel', STANDAARD, alle)).toMatchObject({ status: 'afwijkend', tijd: { van: '09:00', tot: '14:00' } })
  })

  it('valt terug op de gewone tijden van de weekdag', () => {
    // 2026-12-23 is een woensdag.
    expect(openingstijdenOp('2026-12-23', 'budel', STANDAARD, alle)).toEqual({ status: 'open', tijd: { van: '06:00', tot: '23:00' }, sluiting: null })
  })

  it('is gewoon dicht op een weekdag zonder openingstijden', () => {
    // 2026-12-27 is een zondag.
    expect(openingstijdenOp('2026-12-27', 'budel', STANDAARD, alle)).toEqual({ status: 'gesloten', tijd: null, sluiting: null })
  })
})

describe('uitzonderingenVoor', () => {
  it('geeft per datum null of de afwijkende tijd, met voorrang voor de vestiging', () => {
    const budel = uitzonderingenVoor('budel', [ALLE_KERST, BUDEL_KERST, TWEEDE])
    expect(budel.get('2026-12-25')).toEqual({ van: '09:00', tot: '14:00' })
    expect(budel.get('2026-12-26')).toEqual({ van: '10:00', tot: '16:00' })
    expect(uitzonderingenVoor('eersel', [ALLE_KERST]).get('2026-12-25')).toBeNull()
  })

  it('negeert regels van andere vestigingen', () => {
    expect(uitzonderingenVoor('eersel', [BUDEL_KERST]).size).toBe(0)
  })
})

describe('geraakteLessen', () => {
  // Kerst 2026 is wintertijd: 08:00 NL = 07:00 UTC.
  const lessen: LesMoment[] = [
    { id: 'l1', vestiging: 'eersel', startOp: '2026-12-25T08:00:00Z', eindOp: '2026-12-25T09:00:00Z' },
    { id: 'l2', vestiging: 'budel', startOp: '2026-12-25T09:00:00Z', eindOp: '2026-12-25T10:00:00Z' },
    { id: 'l3', vestiging: 'budel', startOp: '2026-12-25T07:00:00Z', eindOp: '2026-12-25T08:00:00Z' },
    { id: 'l4', vestiging: 'budel', startOp: '2026-12-26T14:30:00Z', eindOp: '2026-12-26T15:30:00Z' },
  ]
  const alle = [ALLE_KERST, BUDEL_KERST, TWEEDE]

  it('telt bij een algemene sluiting alleen vestigingen zonder eigen regel', () => {
    expect(geraakteLessen(ALLE_KERST, lessen, alle).map((l) => l.id)).toEqual(['l1'])
  })

  it('telt bij afwijkende tijden alleen lessen buiten de tijden', () => {
    // l2 = 10:00 tot 11:00 (binnen 09:00 tot 14:00), l3 = 08:00 tot 09:00 (te vroeg).
    expect(geraakteLessen(BUDEL_KERST, lessen, alle).map((l) => l.id)).toEqual(['l3'])
    // l4 = 15:30 tot 16:30, sluiting om 16:00.
    expect(geraakteLessen(TWEEDE, lessen, alle).map((l) => l.id)).toEqual(['l4'])
  })

  it('telt per sluiting', () => {
    expect(geraaktPerSluiting(alle, lessen)).toEqual({ a: 1, b: 1, c: 1 })
  })
})

describe('komendeAfwijkingen', () => {
  it('geeft vandaag en de komende dagen met een regel', () => {
    const uit = komendeAfwijkingen('budel', '2026-12-20', 7, [ALLE_KERST, BUDEL_KERST, TWEEDE, sluiting({ id: 'z', datum: '2026-12-31' })])
    expect(uit.map((u) => [u.datum, u.sluiting.id])).toEqual([
      ['2026-12-25', 'b'],
      ['2026-12-26', 'c'],
    ])
  })
})

describe('perMaand', () => {
  it('groepeert op maand en zet per dag de algemene regel eerst', () => {
    const groepen = perMaand([TWEEDE, BUDEL_KERST, sluiting({ id: 'n', datum: '2026-01-01' }), ALLE_KERST])
    expect(groepen.map((g) => [g.maand, g.sluitingen.map((s) => s.id)])).toEqual([
      [1, ['n']],
      [12, ['a', 'b', 'c']],
    ])
  })
})

describe('nieuweFeestdagen', () => {
  const dagen = nederlandseFeestdagen(2026)

  it('maakt van de keuzes nieuwe regels met de naam als reden', () => {
    const uit = nieuweFeestdagen(dagen, [{ sleutel: 'koningsdag', soort: 'afwijkend', van: '09:00', tot: '16:00' }], null, [])
    expect(uit).toEqual([{ vestiging: null, datum: '2026-04-27', soort: 'afwijkend', van: '09:00', tot: '16:00', reden: 'Koningsdag' }])
  })

  it('voegt niet dubbel toe wat er al staat of twee keer gekozen is', () => {
    const keuzes = [
      { sleutel: 'eerste-kerstdag', soort: 'gesloten', van: null, tot: null },
      { sleutel: 'tweede-kerstdag', soort: 'gesloten', van: null, tot: null },
      { sleutel: 'tweede-kerstdag', soort: 'gesloten', van: null, tot: null },
    ] as const
    const uit = nieuweFeestdagen(dagen, keuzes, null, [ALLE_KERST])
    expect(uit.map((u) => u.datum)).toEqual(['2026-12-26'])
  })

  it('ziet een regel voor een andere vestiging niet als dubbel', () => {
    const uit = nieuweFeestdagen(dagen, [{ sleutel: 'eerste-kerstdag', soort: 'gesloten', van: null, tot: null }], 'eersel', [BUDEL_KERST])
    expect(uit).toHaveLength(1)
  })

  it('bewaart geen tijden bij gesloten', () => {
    const [uit] = nieuweFeestdagen(dagen, [{ sleutel: 'nieuwjaarsdag', soort: 'gesloten', van: '09:00', tot: '12:00' }], null, [])
    expect(uit.van).toBeNull()
  })
})
