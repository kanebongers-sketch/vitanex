import { describe, expect, it, vi } from 'vitest'
import { AFGEROND_MAX_MS, trainingDag, trainingTijdstip } from './training-tijd'
import { leesTrainingId, maakTrainingId } from './training-id'

// 18 oktober 2026, 00:20 in Nederland (zomertijd, UTC+2).
const NU = new Date('2026-10-17T22:20:00Z')

describe('datum van een training', () => {
  it('neemt het moment van afronden op de telefoon, niet dat van ontvangen', () => {
    const gisteren = new Date('2026-10-17T21:30:00Z').getTime() // 23:30 Nederlandse tijd
    const op = trainingTijdstip(gisteren, NU)
    expect(op.getTime()).toBe(gisteren)
    expect(trainingDag(op)).toBe('2026-10-17')
    expect(trainingDag(NU)).toBe('2026-10-18')
    expect(trainingTijdstip('2026-10-17T21:30:00.000Z', NU).getTime()).toBe(gisteren)
  })

  it('een tijdstip in de toekomst of ouder dan 7 dagen: de servertijd', () => {
    expect(trainingTijdstip(NU.getTime() + 1000, NU)).toBe(NU)
    expect(trainingTijdstip(NU.getTime() - AFGEROND_MAX_MS - 1, NU)).toBe(NU)
    expect(trainingTijdstip(NU.getTime() - AFGEROND_MAX_MS, NU).getTime()).toBe(NU.getTime() - AFGEROND_MAX_MS)
  })

  it('geen of onzin: de servertijd', () => {
    for (const v of [undefined, null, 'gisteren', Number.NaN, Infinity, {}, 'x'.repeat(100)]) expect(trainingTijdstip(v, NU)).toBe(NU)
  })
})

describe('vast id van een training', () => {
  const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

  it('maakt een uuid, ook zonder crypto.randomUUID', () => {
    expect(maakTrainingId()).toMatch(V4)
    vi.stubGlobal('crypto', { getRandomValues: (b: Uint8Array) => b.fill(255) })
    expect(maakTrainingId()).toMatch(V4)
    vi.stubGlobal('crypto', undefined)
    expect(maakTrainingId()).toMatch(V4)
    vi.unstubAllGlobals()
  })

  it('leest alleen een geldig id, in kleine letters', () => {
    expect(leesTrainingId('AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE')).toBe('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')
    expect(leesTrainingId('1; drop table')).toBeNull()
    expect(leesTrainingId(42)).toBeNull()
  })
})
