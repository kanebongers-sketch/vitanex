import { describe, expect, it } from 'vitest'
import type { Vandaag } from '@/lib/club/cijfers/haal-vandaag'
import { beperkVandaag } from './vandaag-filter'

const lead = { id: 'l1', naam: 'Lead Een', status: 'nieuw', opvolgenOp: null, proeflesOp: null, interesse: null }
const DATA = {
  vandaag: '2026-10-17', nu: new Date(), nuBinnen: 3, checkinsVandaag: 12, checkinsVorigeWeek: 10, verschil: null,
  lessen: [{ id: 'les' }], proeflessen: [lead], opvolgen: [lead], opvolgenTotaal: 1,
  risico: [{ id: 'r1' }], laatsteOoit: new Map([['r1', null]]),
  werkvloer: { diensten: [{ id: 'd1' }], taken: { klaar: 1 }, heeftTaken: true },
  nieuw: [{ id: 'n1' }], jarig: [{ id: 'j1' }], meldingen: [],
} as unknown as Vandaag

describe('beperkVandaag', () => {
  it('alles toegestaan: niets verandert', () => {
    expect(beperkVandaag(DATA, () => true)).toEqual(DATA)
  })
  it('een clubmanager zonder leads, leden, rooster, personeel en taken ziet daar niets van', () => {
    const uit = beperkVandaag(DATA, () => false)
    expect(uit.proeflessen).toEqual([])
    expect(uit.opvolgen).toEqual([])
    expect(uit.opvolgenTotaal).toBe(0)
    expect(uit.risico).toEqual([])
    expect(uit.laatsteOoit.size).toBe(0)
    expect(uit.nieuw).toEqual([])
    expect(uit.jarig).toEqual([])
    expect(uit.lessen).toEqual([])
    expect(uit.werkvloer.diensten).toEqual([])
    expect(uit.werkvloer.taken).toBeNull()
    expect(JSON.stringify({ ...uit, laatsteOoit: [...uit.laatsteOoit] })).not.toContain('Lead Een')
  })
  it('alleen leden: leden wel, leads niet', () => {
    const uit = beperkVandaag(DATA, (o) => o === 'leden')
    expect(uit.risico).toHaveLength(1)
    expect(uit.opvolgen).toEqual([])
  })
})
