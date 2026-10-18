import { describe, expect, it } from 'vitest'
import { gewichtMee, kopieRegels } from './kopie'
import type { SchemaRegel } from './rijen'

const regel = (id: string, dag: number, volgorde: number, extra: Partial<SchemaRegel> = {}): SchemaRegel => ({
  id, dag, volgorde, oefeningId: `o-${id}`, sets: 3, herhalingen: '8-10', gewichtKg: 40, rustSec: 90, notitie: null,
  groep: null, tijdSec: null, rpe: null, rir: 2, tempo: '3110', ...extra,
})

describe('kopieRegels', () => {
  const bron = [regel('c', 2, 0), regel('b', 1, 1, { groep: 4 }), regel('a', 1, 0, { groep: 4 })]

  it('sorteert, houdt supersets en nummert ze opnieuw', () => {
    const k = kopieRegels(bron, { metGewicht: true })
    expect(k.map((r) => r.oefeningId)).toEqual(['o-a', 'o-b', 'o-c'])
    expect(k.map((r) => r.groep)).toEqual([1, 1, null])
    expect(k[0]).toMatchObject({ gewichtKg: 40, rir: 2, tempo: '3110', herhalingen: '8-10' })
  })

  it('laat gewichten weg als dat gevraagd is', () => {
    expect(kopieRegels(bron, { metGewicht: false }).every((r) => r.gewichtKg === null)).toBe(true)
  })

  it('verandert de bron niet', () => {
    kopieRegels(bron, { metGewicht: false })
    expect(bron[1].groep).toBe(4)
  })
})

describe('gewichtMee', () => {
  it('nooit naar een sjabloon, wel van sjabloon naar lid, naar ander lid alleen op verzoek', () => {
    expect(gewichtMee(null, 'lid1', true)).toBe(false)
    expect(gewichtMee('lid1', null, false)).toBe(true)
    expect(gewichtMee('lid1', 'lid1', false)).toBe(true)
    expect(gewichtMee('lid2', 'lid1', false)).toBe(false)
    expect(gewichtMee('lid2', 'lid1', true)).toBe(true)
  })
})
