import { describe, expect, it } from 'vitest'
import { demoAanvraagUitRij, leesStatusWijziging, sorteerDemoAanvragen, telOpen, type PlatformDemoAanvraag } from './demo-aanvragen'

const rij = {
  id: '6f1c2d3e-4a5b-4c6d-8e7f-001122334455',
  naam: 'Sanne de Vries',
  sportschool: 'Sterk Gym',
  email: 'sanne@voorbeeld.nl',
  telefoon: '+31 6 12345678',
  vestigingen: 2,
  soort: 'boutique',
  moment: 'avond',
  opmerking: null,
  status: 'open',
  afgehandeld_op: null,
  aangemaakt_op: '2026-10-18T09:00:00Z',
}

function aanvraag(id: string, status: 'open' | 'afgehandeld', op: string): PlatformDemoAanvraag {
  const a = demoAanvraagUitRij({ ...rij, id, status, aangemaakt_op: op })
  if (!a) throw new Error('rij ongeldig')
  return a
}

describe('demoAanvraagUitRij', () => {
  it('leest een rij uit de database', () => {
    expect(demoAanvraagUitRij(rij)).toMatchObject({ id: rij.id, sportschool: 'Sterk Gym', vestigingen: 2, status: 'open', opmerking: null, aangemaaktOp: rij.aangemaakt_op })
  })
  it('slaat kapotte rijen over', () => {
    expect(demoAanvraagUitRij(null)).toBeNull()
    expect(demoAanvraagUitRij({ ...rij, status: 'weg' })).toBeNull()
    expect(demoAanvraagUitRij({ ...rij, id: 5 })).toBeNull()
  })
})

describe('sorteerDemoAanvragen en telOpen', () => {
  const lijst = [
    aanvraag('a', 'afgehandeld', '2026-10-10T09:00:00Z'),
    aanvraag('b', 'open', '2026-10-17T09:00:00Z'),
    aanvraag('c', 'open', '2026-10-15T09:00:00Z'),
    aanvraag('d', 'afgehandeld', '2026-10-16T09:00:00Z'),
  ]
  it('open eerst, de langst wachtende bovenaan; daarna afgehandeld, nieuwste eerst', () => {
    expect(sorteerDemoAanvragen(lijst).map((a) => a.id)).toEqual(['c', 'b', 'd', 'a'])
  })
  it('telt de open aanvragen, null als de lijst niet te lezen was', () => {
    expect(telOpen(lijst)).toBe(2)
    expect(telOpen([])).toBe(0)
    expect(telOpen(null)).toBeNull()
  })
})

describe('leesStatusWijziging', () => {
  it('accepteert een id en een bekende status', () => {
    expect(leesStatusWijziging({ id: rij.id.toUpperCase(), status: 'afgehandeld' })).toEqual({ ok: true, id: rij.id, status: 'afgehandeld' })
    expect(leesStatusWijziging({ id: rij.id, status: 'open' })).toEqual({ ok: true, id: rij.id, status: 'open' })
  })
  it('weigert al het andere', () => {
    expect(leesStatusWijziging({ id: 'x', status: 'open' }).ok).toBe(false)
    expect(leesStatusWijziging({ id: rij.id, status: 'weg' }).ok).toBe(false)
    expect(leesStatusWijziging(null).ok).toBe(false)
  })
})
