import { describe, expect, it } from 'vitest'
import { MAX_TE_DOEN, teDoenOverzicht } from './instel-te-doen'

describe('teDoenOverzicht', () => {
  it('geen blok als alles klaar is of er niets telt', () => {
    expect(teDoenOverzicht([])).toBeNull()
    expect(teDoenOverzicht([{ id: 'huisstijl', klaar: true }, { id: 'bedrijf', klaar: true }])).toBeNull()
  })

  it('hoogstens drie acties, in volgorde van belang, met de voortgang over alle punten', () => {
    const o = teDoenOverzicht([
      { id: 'bedrijf', klaar: false },
      { id: 'adres', klaar: false },
      { id: 'huisstijl', klaar: false },
      { id: 'vestigingen', klaar: false },
    ])
    expect(o?.open).toEqual(['vestigingen', 'huisstijl', 'adres'])
    expect(o?.open).toHaveLength(MAX_TE_DOEN)
    expect(o).toMatchObject({ klaar: 0, totaal: 4 })
  })

  it('telt wat klaar is en elk punt een keer', () => {
    const o = teDoenOverzicht([
      { id: 'vestigingen', klaar: true },
      { id: 'huisstijl', klaar: false },
      { id: 'huisstijl', klaar: true },
    ])
    expect(o).toEqual({ open: ['huisstijl'], klaar: 1, totaal: 2 })
  })
})
