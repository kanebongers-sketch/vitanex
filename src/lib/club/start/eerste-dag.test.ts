import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { liveActies } from './eerste-dag'

describe('je bent live: de drie dingen voor dag 1', () => {
  it('geeft poster, uitnodigen en check-in met de vestiging erbij', () => {
    const acties = liveActies([], 'centrum')
    expect(acties.map((a) => a.id)).toEqual(['poster', 'uitnodigen', 'checkin'])
    expect(acties.map((a) => a.pad)).toEqual(['/club/leden/app-poster?v=centrum', '/club/leden?v=centrum', '/club/checkin?v=centrum'])
  })

  it('werkt ook zonder vestiging', () => {
    expect(liveActies([], null).map((a) => a.pad)).toEqual(['/club/leden/app-poster', '/club/leden', '/club/checkin'])
  })

  it('laat weg wat niet kan omdat een onderdeel uit staat', () => {
    expect(liveActies(['app'], null).map((a) => a.id)).toEqual(['checkin'])
    expect(liveActies(['leden'], null).map((a) => a.id)).toEqual(['checkin'])
    expect(liveActies(['checkin'], null).map((a) => a.id)).toEqual(['poster', 'uitnodigen'])
    expect(liveActies(['leden', 'checkin'], null)).toEqual([])
  })

  it("wijst alleen naar pagina's die echt bestaan", () => {
    const basis = 'src/app/(aiyourgym)/(club)'
    for (const a of liveActies([], null)) expect(existsSync(`${basis}${a.pad}/page.tsx`)).toBe(true)
  })
})
