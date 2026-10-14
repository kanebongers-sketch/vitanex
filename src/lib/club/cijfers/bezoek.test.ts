import { describe, expect, it } from 'vitest'
import { bezoekPerWeek, drukteRaster, piekUur, telBezoek, zichtbareUren } from './bezoek'
import { conversiePerBron, type LeadCijferRij } from './leads'
import { naarCsv, csvBestandsnaam } from './csv'

describe('bezoek tellen', () => {
  const tellingen = telBezoek([
    { vestiging: 'budel', op: new Date('2026-10-12T17:10:00Z') }, // ma 19:10
    { vestiging: 'budel', op: new Date('2026-10-12T17:40:00Z') }, // ma 19:40
    { vestiging: 'budel', op: new Date('2026-10-05T05:00:00Z') }, // ma 07:00, week ervoor
    { vestiging: 'eersel', op: new Date('2026-10-13T08:00:00Z') }, // di 10:00
  ])

  it('telt per week, per vestiging of alles samen', () => {
    const maandagen = ['2026-10-05', '2026-10-12']
    expect(bezoekPerWeek(tellingen, maandagen, new Set(['budel'] as const))).toEqual([1, 2])
    expect(bezoekPerWeek(tellingen, maandagen, null)).toEqual([1, 3])
  })

  it('vult het drukteraster per weekdag en uur en vindt de piek', () => {
    const r = drukteRaster(tellingen, new Set(['budel'] as const))
    expect(r[0][19]).toBe(2)
    expect(r[0][7]).toBe(1)
    expect(piekUur(r)).toEqual({ weekdag: 1, uur: 19, aantal: 2 })
    expect(zichtbareUren(r)).toEqual(Array.from({ length: 17 }, (_, i) => 6 + i))
  })

  it('geeft geen piek zonder bezoek', () => {
    expect(piekUur(drukteRaster([], null))).toBeNull()
  })
})

describe('leadconversie', () => {
  const lead = (deel: Partial<LeadCijferRij>): LeadCijferRij => ({ vestiging: 'budel', bron: 'website', status: 'nieuw', proeflesOp: null, ...deel })

  it('rekent per bron proefles, lid, verloren en open', () => {
    const { perBron, totaal } = conversiePerBron([
      lead({ status: 'lid' }),
      lead({ status: 'proefles', proeflesOp: '2026-10-14T18:00:00Z' }),
      lead({ status: 'verloren' }),
      lead({}),
      lead({ bron: 'balie', status: 'lid' }),
    ])
    expect(perBron[0]).toMatchObject({ bron: 'website', leads: 4, proefles: 2, lid: 1, verloren: 1, open: 2, conversie: 0.25 })
    expect(perBron[1]).toMatchObject({ bron: 'balie', leads: 1, conversie: 1 })
    expect(totaal).toMatchObject({ leads: 5, lid: 2 })
  })
})

describe('csv', () => {
  it('maakt Excel-vriendelijke csv met puntkomma, komma-decimalen en escapes', () => {
    const csv = naarCsv(['Naam', 'Waarde'], [['Spinning; avond', 0.5], ['=SOM(A1)', 3], ['Gewoon', null]])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv).toContain('"Spinning; avond";0,50')
    expect(csv).toContain("'=SOM(A1);3")
    expect(csv).toContain('Gewoon;\r\n')
  })

  it('maakt een veilige bestandsnaam', () => {
    expect(csvBestandsnaam('Bezoek per week', 'Eindhoven Boschdijk', '12w')).toBe('bezoek-per-week-eindhoven-boschdijk-12w.csv')
  })
})
