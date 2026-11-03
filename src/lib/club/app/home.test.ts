import { describe, expect, it } from 'vitest'
import { homeVolgorde, TE_DOEN_VOLGORDE, type HomeStand } from './home'

const NIETS: HomeStand = { intakeOpen: false, sluitingBinnenkort: false, uitlegOpen: false, meldingenVragen: false }

describe('homeVolgorde', () => {
  it('niets open: geen kaart', () => {
    expect(homeVolgorde(NIETS)).toBeNull()
  })

  it('hoogstens een kaart, in de vaste volgorde', () => {
    const alles: HomeStand = { intakeOpen: true, sluitingBinnenkort: true, uitlegOpen: true, meldingenVragen: true }
    expect(homeVolgorde(alles)).toBe('intake')
    expect(homeVolgorde({ ...alles, intakeOpen: false })).toBe('sluiting')
    expect(homeVolgorde({ ...alles, intakeOpen: false, sluitingBinnenkort: false })).toBe('uitleg')
    expect(homeVolgorde({ ...NIETS, meldingenVragen: true })).toBe('meldingen')
  })

  it('elke kaart afzonderlijk', () => {
    expect(homeVolgorde({ ...NIETS, intakeOpen: true })).toBe('intake')
    expect(homeVolgorde({ ...NIETS, sluitingBinnenkort: true })).toBe('sluiting')
    expect(homeVolgorde({ ...NIETS, uitlegOpen: true })).toBe('uitleg')
  })

  it('intake gaat voor, meldingen komen als laatste', () => {
    expect(TE_DOEN_VOLGORDE[0]).toBe('intake')
    expect(TE_DOEN_VOLGORDE.at(-1)).toBe('meldingen')
  })
})
