import { describe, expect, it } from 'vitest'
import { bezoekIn, bezoekPerDag, drukteRaster, piekUur, telBezoek, zichtbareUren } from './bezoek'
import { conversiePerBron, leadsIn, type LeadCijferRij } from './leads'
import { naarCsv, csvBestandsnaam } from './csv'

describe('bezoek tellen', () => {
  const tellingen = telBezoek([
    { vestiging: 'budel', op: new Date('2026-10-12T17:10:00Z') }, // ma 19:10
    { vestiging: 'budel', op: new Date('2026-10-12T17:40:00Z') }, // ma 19:40
    { vestiging: 'budel', op: new Date('2026-10-05T05:00:00Z') }, // ma 07:00, week ervoor
    { vestiging: 'eersel', op: new Date('2026-10-13T08:00:00Z') }, // di 10:00
  ])

  it('telt per dag, per vestiging of alles samen', () => {
    const budel = bezoekPerDag(tellingen, new Set(['budel'] as const))
    expect(budel.get('2026-10-12')).toBe(2)
    expect(budel.get('2026-10-05')).toBe(1)
    const alle = bezoekPerDag(tellingen, null)
    expect(bezoekIn(alle, { van: '2026-10-06', tot: '2026-10-31' })).toBe(3)
    expect(bezoekIn(alle, { van: '2026-10-01', tot: '2026-10-05' })).toBe(1)
  })

  it('telt drukte alleen vanaf het begin van de gekozen maand', () => {
    const t = telBezoek([{ vestiging: 'budel', op: new Date('2026-09-30T21:30:00Z') }, { vestiging: 'budel', op: new Date('2026-09-30T22:30:00Z') }], new Date('2026-09-30T22:00:00Z'))
    expect(t.filter((x) => x.soort === 'uur')).toEqual([{ vestiging: 'budel', soort: 'uur', sleutel: '4-0', aantal: 1 }])
    expect(t.filter((x) => x.soort === 'dag').map((x) => x.sleutel)).toEqual(['2026-09-30', '2026-10-01'])
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
  const lead = (deel: Partial<LeadCijferRij>): LeadCijferRij => ({ vestiging: 'budel', bron: 'website', status: 'nieuw', proeflesOp: null, aangemaakt: '2026-10-02', ...deel })

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

  it('neemt alleen leads uit het venster', () => {
    const r = leadsIn([lead({}), lead({ aangemaakt: '2026-09-30' }), lead({ aangemaakt: null })], { van: '2026-10-01', tot: '2026-10-31' })
    expect(r).toHaveLength(1)
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
