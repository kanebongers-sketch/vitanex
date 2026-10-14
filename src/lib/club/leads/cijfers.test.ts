import { describe, expect, it } from 'vitest'
import { berekenCijfers, binnenDagen, conversie } from './cijfers'
import { maakLead } from './testdata'

const NU = new Date('2026-10-14T08:00:00Z')

describe('conversie', () => {
  it('telt status lid en een gekoppeld lid als geconverteerd', () => {
    const c = conversie([
      { status: 'lid', lidId: null },
      { status: 'proefles_geweest', lidId: 'x' },
      { status: 'nieuw', lidId: null },
      { status: 'verloren', lidId: null },
    ])
    expect(c).toEqual({ leads: 4, leden: 2, procent: 50 })
  })

  it('geeft geen procent zonder leads', () => {
    expect(conversie([])).toEqual({ leads: 0, leden: 0, procent: null })
  })

  it('rondt af op hele procenten', () => {
    expect(conversie([{ status: 'lid', lidId: null }, { status: 'nieuw', lidId: null }, { status: 'nieuw', lidId: null }]).procent).toBe(33)
  })
})

describe('binnenDagen', () => {
  it('telt vandaag mee en laat de dag ervoor vallen', () => {
    const leads = [
      maakLead({ aangemaaktOp: '2026-07-17T10:00:00Z' }), // dag 90 terug
      maakLead({ aangemaaktOp: '2026-07-15T10:00:00Z' }), // 91 dagen terug
    ]
    expect(binnenDagen(leads, NU, 90)).toHaveLength(1)
  })
})

describe('berekenCijfers', () => {
  it('rekent maand, geplande proeflessen, conversie en bronnen', () => {
    const leads = [
      maakLead({ bron: 'website', aangemaaktOp: '2026-10-02T10:00:00Z', status: 'lid' }),
      maakLead({ bron: 'website', aangemaaktOp: '2026-10-05T10:00:00Z', status: 'proefles', proeflesOp: '2026-10-15T17:00:00Z' }),
      maakLead({ bron: 'balie', aangemaaktOp: '2026-09-20T10:00:00Z', status: 'proefles', proeflesOp: '2026-10-13T17:00:00Z' }),
      maakLead({ bron: 'balie', aangemaaktOp: '2026-09-30T22:30:00Z', status: 'verloren' }), // 1 okt in NL
      maakLead({ bron: 'social', aangemaaktOp: '2026-01-10T10:00:00Z', status: 'lid' }), // buiten 90 dagen
    ]
    const c = berekenCijfers(leads, NU)
    expect(c.nieuwDezeMaand).toBe(3)
    expect(c.proeflessenGepland).toBe(1)
    expect(c.conversie).toEqual({ leads: 4, leden: 1, procent: 25 })
    expect(c.perBron).toEqual([
      { bron: 'website', leads: 2, leden: 1, procent: 50 },
      { bron: 'balie', leads: 2, leden: 0, procent: 0 },
    ])
  })
})
