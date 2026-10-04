import { afterEach, describe, expect, it } from 'vitest'
import { MIN_LEEFTIJD_MS, feitenSleutel, legeDagCache, magHergebruiken, metDagCache, type CacheRegel } from './cache'

const OCHTEND = new Date('2026-10-05T07:00:00+02:00')
const FEITEN = '# Feiten (opgebouwd op 07:00)\n\n## Taken\n- Offerte sturen'

function regel(over: Partial<CacheRegel<string>> = {}): CacheRegel<string> {
  return { dag: '2026-10-05', sleutel: 'a', waarde: 'briefing', gemaaktOp: OCHTEND.getTime(), ...over }
}

afterEach(() => legeDagCache())

describe('feitenSleutel', () => {
  it('negeert de klokregel bovenaan', () => {
    const later = FEITEN.replace('07:00', '07:05')
    expect(feitenSleutel(later)).toBe(feitenSleutel(FEITEN))
  })

  it('ziet een inhoudelijke wijziging', () => {
    expect(feitenSleutel(`${FEITEN}\n- Ruben bellen`)).not.toBe(feitenSleutel(FEITEN))
  })
})

describe('magHergebruiken', () => {
  const nu = OCHTEND.getTime()

  it('hergebruikt bij dezelfde feiten, hoe oud ook', () => {
    expect(magHergebruiken(regel({ gemaaktOp: nu - 10 * MIN_LEEFTIJD_MS }), '2026-10-05', 'a', nu, false)).toBe(true)
  })

  it('hergebruikt bij gewijzigde feiten zolang de briefing jong is', () => {
    expect(magHergebruiken(regel({ gemaaktOp: nu - 60_000 }), '2026-10-05', 'b', nu, false)).toBe(true)
  })

  it('schrijft opnieuw bij gewijzigde feiten als de briefing oud genoeg is', () => {
    expect(magHergebruiken(regel({ gemaaktOp: nu - MIN_LEEFTIJD_MS }), '2026-10-05', 'b', nu, false)).toBe(false)
  })

  it('schrijft opnieuw op een nieuwe dag', () => {
    expect(magHergebruiken(regel({ dag: '2026-10-04' }), '2026-10-05', 'a', nu, false)).toBe(false)
  })

  it('schrijft opnieuw als je zelf ververst', () => {
    expect(magHergebruiken(regel(), '2026-10-05', 'a', nu, true)).toBe(false)
  })

  it('schrijft als er nog niets is', () => {
    expect(magHergebruiken(undefined, '2026-10-05', 'a', nu, false)).toBe(false)
  })
})

describe('metDagCache', () => {
  it('roept het model maar één keer aan voor dezelfde feiten', async () => {
    // Arrange
    let calls = 0
    const maak = async () => `briefing ${++calls}`

    // Act
    const eerste = await metDagCache('kane', FEITEN, OCHTEND, false, maak)
    const tweede = await metDagCache('kane', FEITEN, new Date(OCHTEND.getTime() + 5 * 60_000), false, maak)

    // Assert
    expect(calls).toBe(1)
    expect(eerste.uitCache).toBe(false)
    expect(tweede).toEqual({ waarde: 'briefing 1', uitCache: true })
  })

  it('maakt een nieuwe bij forceren', async () => {
    let calls = 0
    const maak = async () => `briefing ${++calls}`
    await metDagCache('kane', FEITEN, OCHTEND, false, maak)
    const geforceerd = await metDagCache('kane', FEITEN, OCHTEND, true, maak)
    expect(geforceerd.waarde).toBe('briefing 2')
  })

  it('onthoudt niets als het maken faalt', async () => {
    await expect(metDagCache('kane', FEITEN, OCHTEND, false, async () => Promise.reject(new Error('stuk')))).rejects.toThrow('stuk')
    let calls = 0
    await metDagCache('kane', FEITEN, OCHTEND, false, async () => `b${++calls}`)
    expect(calls).toBe(1)
  })
})
