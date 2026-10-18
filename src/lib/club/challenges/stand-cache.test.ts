import { describe, expect, it, vi } from 'vitest'
import type { Challenge } from './model'
import { maakStandCache, standSleutel, standVoorLid } from './stand-cache'
import type { Stand } from './voortgang'

const challenge: Challenge = {
  id: 'c1',
  titel: 'Oktober',
  uitleg: null,
  soort: 'bezoeken',
  doel: 12,
  start: '2026-10-01',
  eind: '2026-10-31',
  vestigingen: ['budel'],
  deelname: 'automatisch',
  zichtbaarApp: true,
  ranglijst: true,
  gestoptOp: null,
  demo: false,
}

function stand(aantal: number): Stand[] {
  return Array.from({ length: aantal }, (_, i) => ({ lidId: `l${i + 1}`, naam: `Lid ${i + 1}`, volledigeNaam: `Lid ${i + 1}`, score: aantal - i, gehaald: false, positie: i + 1 }))
}

describe('maakStandCache', () => {
  it('laadt een keer binnen de bewaartijd, ook bij gelijktijdige vragen', async () => {
    // Arrange
    let nu = 0
    const cache = maakStandCache<number>(() => nu, 60_000)
    const laad = vi.fn(async () => 42)
    // Act
    const [a, b] = await Promise.all([cache.haal('k', laad), cache.haal('k', laad)])
    nu = 59_000
    const c = await cache.haal('k', laad)
    // Assert
    expect([a, b, c]).toEqual([42, 42, 42])
    expect(laad).toHaveBeenCalledTimes(1)
  })

  it('laadt opnieuw na de bewaartijd', async () => {
    let nu = 0
    const cache = maakStandCache<number>(() => nu, 60_000)
    const laad = vi.fn(async () => 1)
    await cache.haal('k', laad)
    nu = 60_000
    await cache.haal('k', laad)
    expect(laad).toHaveBeenCalledTimes(2)
  })

  it('onthoudt een leesfout niet', async () => {
    const cache = maakStandCache<number>(() => 0)
    const laad = vi.fn<() => Promise<number | null>>().mockResolvedValueOnce(null).mockResolvedValueOnce(7)
    expect(await cache.haal('k', laad)).toBeNull()
    expect(await cache.haal('k', laad)).toBe(7)
  })

  it('houdt hoogstens het maximum aantal standen vast', async () => {
    const cache = maakStandCache<number>(() => 0, 60_000, 3)
    for (const k of ['a', 'b', 'c', 'd', 'e']) await cache.haal(k, async () => 1)
    expect(cache.grootte()).toBeLessThanOrEqual(3)
  })
})

describe('standSleutel', () => {
  it('verandert als de challenge wordt aangepast of bij een andere sportschool', () => {
    const basis = standSleutel('org1', challenge)
    expect(standSleutel('org1', { ...challenge, doel: 10 })).not.toBe(basis)
    expect(standSleutel('org1', { ...challenge, gestoptOp: '2026-10-10T10:00:00Z' })).not.toBe(basis)
    expect(standSleutel('org2', challenge)).not.toBe(basis)
    expect(standSleutel('org1', { ...challenge, titel: 'Andere titel' })).toBe(basis)
  })
})

describe('standVoorLid', () => {
  it('geeft de top plus de eigen plek', () => {
    const uit = standVoorLid(stand(40), 'l25', 10)
    expect(uit).toHaveLength(11)
    expect(uit[10].lidId).toBe('l25')
  })

  it('voegt het lid niet dubbel toe als het al in de top staat', () => {
    expect(standVoorLid(stand(40), 'l3', 10)).toHaveLength(10)
  })
})
