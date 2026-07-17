// Tests voor de sleepvolgorde. De kern die bewaakt wordt: een tegel TUSSEN twee
// andere laten vallen levert een sortering strikt tússen de buren op (zodat de
// volgorde klopt), en de gesleepte tegel telt nooit als zijn eigen buur.

import { describe, expect, it } from 'vitest'
import type { Persoon } from '@/lib/lifeos/crm/crm'
import { kolomVan, sorteringAanEinde, sorteringVoor } from '@/components/lifeos/crm/sortering'

function persoon(over: Partial<Persoon> & { id: string }): Persoon {
  return {
    naam: over.id,
    groep: 'pt_klant',
    status: 'moet_benaderen',
    sortering: 0,
    followUpDatum: null,
    telefoon: null,
    email: null,
    bijzonderheden: null,
    laatsteContactOp: null,
    aangemaaktOp: '2026-07-17T09:00:00.000Z',
    ...over,
  }
}

describe('kolomVan', () => {
  it('filtert op status en sorteert oplopend (laag = boven)', () => {
    const personen = [
      persoon({ id: 'b', status: 'benaderd', sortering: 5 }),
      persoon({ id: 'a', status: 'moet_benaderen', sortering: 3 }),
      persoon({ id: 'c', status: 'moet_benaderen', sortering: 1 }),
    ]
    expect(kolomVan(personen, 'moet_benaderen').map((p) => p.id)).toEqual(['c', 'a'])
  })

  it('geeft een lege lijst als niemand die status heeft', () => {
    expect(kolomVan([persoon({ id: 'a' })], 'inactief')).toEqual([])
  })
})

describe('sorteringAanEinde', () => {
  it('geeft 0 voor een lege kolom', () => {
    expect(sorteringAanEinde([])).toBe(0)
  })

  it('geeft één meer dan de laatste', () => {
    const kolom = [persoon({ id: 'a', sortering: 2 }), persoon({ id: 'b', sortering: 7 })]
    expect(sorteringAanEinde(kolom)).toBe(8)
  })
})

describe('sorteringVoor', () => {
  const kolom = [
    persoon({ id: 'a', sortering: 0 }),
    persoon({ id: 'b', sortering: 10 }),
    persoon({ id: 'c', sortering: 20 }),
  ]

  it('plaatst tussen twee buren op het gemiddelde', () => {
    // sleep 'a' vóór 'c': tussen 'b' (10) en 'c' (20) → 15
    expect(sorteringVoor(kolom, 'c', 'a')).toBe(15)
  })

  it('plaatst vóór de bovenste op één minder', () => {
    // sleep 'c' vóór 'a' (de bovenste): geen buur erboven → 0 - 1 = -1
    expect(sorteringVoor(kolom, 'a', 'c')).toBe(-1)
  })

  // De valkuil: de gesleepte tegel mag niet als zijn eigen buur meetellen, anders
  // reken je met je oude plek en beweegt de tegel niet.
  it('telt de gesleepte tegel niet als buur', () => {
    // sleep 'b' vóór 'c': zonder 'b' is de buur erboven 'a' (0), doel 'c' (20) → 10
    expect(sorteringVoor(kolom, 'c', 'b')).toBe(10)
  })

  it('geeft null als het doel niet in de kolom zit', () => {
    expect(sorteringVoor(kolom, 'onbekend', 'a')).toBeNull()
  })

  it('geeft null als het doel de gesleepte tegel zelf is', () => {
    // doel === sleep: na het wegfilteren van de sleep is het doel weg → null
    expect(sorteringVoor(kolom, 'a', 'a')).toBeNull()
  })
})
