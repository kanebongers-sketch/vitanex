import { describe, expect, it } from 'vitest'
import { voedingVoorApp, type VoedingPlan } from './model'

const plan: VoedingPlan = {
  id: 'p1',
  lidId: 'l1',
  kcal: 2200,
  eiwitG: 150,
  koolhydratenG: 230,
  vetG: 75,
  doel: null,
  adviezen: ['Elke dag groente'],
  maaltijden: [],
  notitie: 'Alleen voor trainers',
  berekening: null,
  sjabloonId: null,
  bijgewerktDoor: 'Kane',
  bijgewerktOp: '2026-10-01T10:00:00Z',
  demo: false,
}

describe('voedingVoorApp', () => {
  it('geeft bij een leesfout (null) een fout, niet de lege staat', () => {
    expect(voedingVoorApp(null)).toEqual({ staat: 'fout' })
  })

  it('geeft zonder plan (undefined) de lege staat', () => {
    expect(voedingVoorApp(undefined)).toEqual({ staat: 'geen' })
  })

  it('geeft het plan zonder interne notitie', () => {
    const uit = voedingVoorApp(plan)
    expect(uit.staat).toBe('plan')
    if (uit.staat === 'plan') {
      expect(uit.plan.kcal).toBe(2200)
      expect('notitie' in uit.plan).toBe(false)
    }
  })
})
