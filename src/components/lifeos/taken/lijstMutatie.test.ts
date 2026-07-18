import { describe, expect, it } from 'vitest'
import { herstelTaak, vervangTaak, verwijderTaak } from './lijstMutatie'
import type { Taak } from '@/lib/lifeos/taken/taken'

function taak(overschrijf: Partial<Taak> = {}): Taak {
  return {
    id: 'id-1',
    titel: 'Iets doen',
    notitie: null,
    klaar: false,
    klaarOp: null,
    datum: null,
    top3Positie: null,
    impact: null,
    inspanningMinuten: null,
    energie: null,
    deadline: null,
    projectId: null,
    aangemaaktOp: '2026-07-15T08:00:00.000Z',
    ...overschrijf,
  }
}

describe('vervangTaak', () => {
  it('vervangt alleen de doeltaak en laat de rest staan', () => {
    const a = taak({ id: 'a' })
    const b = taak({ id: 'b' })
    const na = vervangTaak([a, b], 'a', { ...a, klaar: true })

    expect(na.find((t) => t.id === 'a')?.klaar).toBe(true)
    expect(na.find((t) => t.id === 'b')?.klaar).toBe(false)
  })

  it('muteert de bronlijst niet', () => {
    const a = taak({ id: 'a' })
    const bron = [a]
    vervangTaak(bron, 'a', { ...a, titel: 'Anders' })

    expect(bron[0].titel).toBe('Iets doen')
  })

  // De kern van de concurrency-fix: rollt één taak terug zonder een gelijktijdige,
  // geslaagde wijziging op een andere taak weg te gooien.
  it('rollback van één taak behoudt een gelijktijdige wijziging op een andere', () => {
    const a0 = taak({ id: 'a', klaar: false })
    const b0 = taak({ id: 'b', klaar: false })
    const start = [a0, b0]

    // Mutatie A: vink a af (optimistisch).
    const naA = vervangTaak(start, 'a', { ...a0, klaar: true })
    // Mutatie B overlapt: vink b af (optimistisch), bovenop A.
    const naB = vervangTaak(naA, 'b', { ...b0, klaar: true })
    // A faalt op de server → alleen a terug naar zijn oude stand.
    const naRollback = vervangTaak(naB, 'a', a0)

    expect(naRollback.find((t) => t.id === 'a')?.klaar).toBe(false) // a teruggedraaid
    expect(naRollback.find((t) => t.id === 'b')?.klaar).toBe(true) // b BLIJFT afgevinkt
  })
})

describe('verwijderTaak', () => {
  it('verwijdert alleen de doeltaak en muteert de bron niet', () => {
    const a = taak({ id: 'a' })
    const b = taak({ id: 'b' })
    const bron = [a, b]
    const na = verwijderTaak(bron, 'a')

    expect(na.map((t) => t.id)).toEqual(['b'])
    expect(bron.map((t) => t.id)).toEqual(['a', 'b'])
  })
})

describe('herstelTaak', () => {
  it('zet een verwijderde taak terug op zijn oude index', () => {
    const a = taak({ id: 'a' })
    const b = taak({ id: 'b' })
    const c = taak({ id: 'c' })
    const hersteld = herstelTaak([a, c], b, 1)

    expect(hersteld.map((t) => t.id)).toEqual(['a', 'b', 'c'])
  })

  it('herstelt niet dubbel als de taak er al staat', () => {
    const a = taak({ id: 'a' })
    const b = taak({ id: 'b' })
    const hersteld = herstelTaak([a, b], b, 1)

    expect(hersteld.map((t) => t.id)).toEqual(['a', 'b'])
  })

  it('klemt een index buiten bereik binnen de lijst', () => {
    const a = taak({ id: 'a' })
    const b = taak({ id: 'b' })

    expect(herstelTaak([a], b, 99).map((t) => t.id)).toEqual(['a', 'b'])
    expect(herstelTaak([a], b, -5).map((t) => t.id)).toEqual(['b', 'a'])
  })
})
