import { describe, expect, it } from 'vitest'
import { lesSleutel, lessenUitSeries } from './genereren'
import type { LesSerie } from './typen'

const serie: LesSerie = {
  id: 's1',
  vestiging: 'budel',
  lestypeId: 't1',
  zaalId: 'z1',
  instructeurId: 'm1',
  weekdag: 2,
  starttijd: '19:00',
  duurMin: 45,
  capaciteit: 18,
  vanaf: '2026-01-01',
  tot: null,
  actief: true,
}

// Woensdag 14 oktober 2026, 12:00 Nederlandse tijd.
const NU = new Date('2026-10-14T10:00:00Z')

describe('lessenUitSeries', () => {
  it('maakt een les per week op de juiste weekdag', () => {
    const lessen = lessenUitSeries([serie], '2026-10-14', 3, NU)
    expect(lessen.map((l) => l.startOp)).toEqual([
      '2026-10-20T17:00:00.000Z',
      '2026-10-27T18:00:00.000Z',
      '2026-11-03T18:00:00.000Z',
    ])
  })

  it('houdt 19:00 Nederlandse tijd aan over de wintertijd heen, met de juiste eindtijd', () => {
    const [, na] = lessenUitSeries([serie], '2026-10-14', 2, NU)
    expect(na.startOp).toBe('2026-10-27T18:00:00.000Z')
    expect(na.eindOp).toBe('2026-10-27T18:45:00.000Z')
  })

  it('is idempotent: bestaande lessen worden overgeslagen', () => {
    const eerste = lessenUitSeries([serie], '2026-10-14', 2, NU)
    const bestaand = new Set(eerste.map((l) => lesSleutel(l.serieId, l.startOp)))
    expect(lessenUitSeries([serie], '2026-10-14', 2, NU, bestaand)).toEqual([])
  })

  it('slaat lessen over die vandaag al begonnen zijn', () => {
    const woensdag = { ...serie, weekdag: 3, starttijd: '09:00' }
    const lessen = lessenUitSeries([woensdag], '2026-10-14', 1, NU)
    expect(lessen).toEqual([])
  })

  it('respecteert de looptijd en inactieve series', () => {
    expect(lessenUitSeries([{ ...serie, tot: '2026-10-25' }], '2026-10-14', 4, NU)).toHaveLength(1)
    expect(lessenUitSeries([{ ...serie, vanaf: '2026-11-01' }], '2026-10-14', 4, NU)).toHaveLength(2)
    expect(lessenUitSeries([{ ...serie, actief: false }], '2026-10-14', 4, NU)).toHaveLength(0)
  })

  it('begrenst het aantal weken', () => {
    expect(lessenUitSeries([serie], '2026-10-14', 100, NU)).toHaveLength(12)
    expect(lessenUitSeries([serie], '2026-10-14', 0, NU)).toHaveLength(0)
  })

  it('kent dezelfde sleutel voor een Date en een ISO-tekst', () => {
    expect(lesSleutel('s', '2026-10-20T17:00:00+00:00')).toBe(lesSleutel('s', new Date('2026-10-20T17:00:00Z')))
  })
})
