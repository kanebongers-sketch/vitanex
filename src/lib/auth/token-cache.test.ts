import { describe, expect, test, vi } from 'vitest'
import { maakTokenCache } from './token-cache'

// ── Helpers ────────────────────────────────────────────────────────────────

interface TestUser {
  id: string
}

const USER: TestUser = { id: '4f1c9c2e-0000-4000-8000-000000000001' }

/** Bouwt een JWT-vormig token met de gegeven `exp` (ms sinds epoch). */
function maakToken(expMs: number, uid = USER.id): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({ sub: uid, exp: Math.floor(expMs / 1000) })
  ).toString('base64url')
  return `${header}.${payload}.nep-handtekening`
}

/** Verifier die altijd slaagt, en telt hoe vaak hij is aangeroepen. */
function slagendeVerifier(user: TestUser = USER) {
  return vi.fn(async (): Promise<TestUser | null> => user)
}

/** Belofte die je handmatig kunt afronden — voor het testen van in-flight dedupe. */
function uitgesteldeBelofte<T>() {
  let los: (waarde: T) => void = () => {}
  const belofte = new Promise<T>((resolve) => {
    los = resolve
  })
  return { belofte, los }
}

const NU = new Date('2026-07-15T10:00:00Z').getTime()
const UUR = 60 * 60 * 1000

// ── Tests ──────────────────────────────────────────────────────────────────

describe('maakTokenCache — cachen van successen', () => {
  test('tweede aanroep komt uit cache, verifier draait maar één keer', async () => {
    // Arrange
    const cache = maakTokenCache<TestUser>()
    const verifieer = slagendeVerifier()
    const token = maakToken(NU + UUR)

    // Act
    const eerste = await cache.haal(token, verifieer, NU)
    const tweede = await cache.haal(token, verifieer, NU + 1_000)

    // Assert
    expect(eerste).toEqual(USER)
    expect(tweede).toEqual(USER)
    expect(verifieer).toHaveBeenCalledTimes(1)
  })

  test('na de TTL wordt opnieuw geverifieerd', async () => {
    // Arrange
    const cache = maakTokenCache<TestUser>(30_000)
    const verifieer = slagendeVerifier()
    const token = maakToken(NU + UUR)

    // Act
    await cache.haal(token, verifieer, NU)
    await cache.haal(token, verifieer, NU + 30_001)

    // Assert
    expect(verifieer).toHaveBeenCalledTimes(2)
  })

  test('verschillende tokens delen geen cache-entry', async () => {
    // Arrange
    const cache = maakTokenCache<TestUser>()
    const verifieer = slagendeVerifier()

    // Act
    await cache.haal(maakToken(NU + UUR, 'gebruiker-a'), verifieer, NU)
    await cache.haal(maakToken(NU + UUR, 'gebruiker-b'), verifieer, NU)

    // Assert
    expect(verifieer).toHaveBeenCalledTimes(2)
    expect(cache.omvang()).toBe(2)
  })
})

describe('maakTokenCache — exp wordt altijd gerespecteerd', () => {
  test('verlopen token wordt niet uit de cache geserveerd', async () => {
    // Arrange — token vervalt 10s na nu, TTL is langer (30s)
    const cache = maakTokenCache<TestUser>(30_000)
    const verifieer = slagendeVerifier()
    const token = maakToken(NU + 10_000)

    // Act — vul de cache, en vraag daarna ná exp opnieuw op
    await cache.haal(token, verifieer, NU)
    await cache.haal(token, verifieer, NU + 11_000)

    // Assert — de cache mag het verlopen token niet geldig teruggeven;
    // er moet opnieuw bij de verifier worden aangeklopt.
    expect(verifieer).toHaveBeenCalledTimes(2)
  })

  test('cache-duur wordt afgekapt op exp, niet op de TTL', async () => {
    // Arrange — exp ligt binnen de TTL
    const cache = maakTokenCache<TestUser>(30_000)
    const verifieer = slagendeVerifier()
    const token = maakToken(NU + 5_000)

    // Act
    await cache.haal(token, verifieer, NU)
    const netVoorExp = await cache.haal(token, verifieer, NU + 4_000)
    expect(verifieer).toHaveBeenCalledTimes(1) // nog binnen exp → cache-hit
    await cache.haal(token, verifieer, NU + 6_000)

    // Assert — voorbij exp maar binnen de TTL: tóch opnieuw verifiëren
    expect(netVoorExp).toEqual(USER)
    expect(verifieer).toHaveBeenCalledTimes(2)
  })

  test('al verlopen token belandt nooit in de cache', async () => {
    // Arrange
    const cache = maakTokenCache<TestUser>()
    const verifieer = slagendeVerifier()
    const token = maakToken(NU - 1_000)

    // Act
    await cache.haal(token, verifieer, NU)

    // Assert
    expect(cache.omvang()).toBe(0)
  })

  test('token zonder leesbare exp wordt niet gecachet', async () => {
    // Arrange
    const cache = maakTokenCache<TestUser>()
    const verifieer = slagendeVerifier()
    const zonderExp = `${Buffer.from('{}').toString('base64url')}.${Buffer.from(
      JSON.stringify({ sub: USER.id })
    ).toString('base64url')}.handtekening`

    // Act
    await cache.haal(zonderExp, verifieer, NU)
    await cache.haal(zonderExp, verifieer, NU)

    // Assert — geen exp = geen bovengrens = niet cachen
    expect(cache.omvang()).toBe(0)
    expect(verifieer).toHaveBeenCalledTimes(2)
  })

  test('onzin-token wordt niet gecachet en blijft langs de verifier gaan', async () => {
    // Arrange
    const cache = maakTokenCache<TestUser>()
    const verifieer = vi.fn(async (): Promise<TestUser | null> => null)

    // Act
    const resultaat = await cache.haal('dit-is-geen-jwt', verifieer, NU)

    // Assert
    expect(resultaat).toBeNull()
    expect(cache.omvang()).toBe(0)
  })
})

describe('maakTokenCache — mislukkingen worden nooit gecachet', () => {
  test('null-resultaat gaat niet de cache in', async () => {
    // Arrange
    const cache = maakTokenCache<TestUser>()
    const verifieer = vi.fn(async (): Promise<TestUser | null> => null)
    const token = maakToken(NU + UUR)

    // Act
    await cache.haal(token, verifieer, NU)
    await cache.haal(token, verifieer, NU)

    // Assert — anders wordt één netwerkstoring een uitlog-storm
    expect(verifieer).toHaveBeenCalledTimes(2)
    expect(cache.omvang()).toBe(0)
  })

  test('een gooiende verifier cachet niets en herstelt op de volgende poging', async () => {
    // Arrange
    const cache = maakTokenCache<TestUser>()
    const token = maakToken(NU + UUR)
    const verifieer = vi
      .fn<(token: string) => Promise<TestUser | null>>()
      .mockRejectedValueOnce(new Error('netwerk plat'))
      .mockResolvedValueOnce(USER)

    // Act & Assert — de fout wordt doorgegeven, niet stil ingeslikt
    await expect(cache.haal(token, verifieer, NU)).rejects.toThrow('netwerk plat')
    expect(cache.omvang()).toBe(0)

    // De storing blokkeert de volgende poging niet
    await expect(cache.haal(token, verifieer, NU)).resolves.toEqual(USER)
  })
})

describe('maakTokenCache — in-flight dedupe', () => {
  test('twee gelijktijdige aanroepen delen één verificatie', async () => {
    // Arrange
    const cache = maakTokenCache<TestUser>()
    const token = maakToken(NU + UUR)
    const { belofte, los } = uitgesteldeBelofte<TestUser | null>()
    const verifieer = vi.fn(() => belofte)

    // Act — beide starten vóór de eerste is afgerond
    const a = cache.haal(token, verifieer, NU)
    const b = cache.haal(token, verifieer, NU)
    los(USER)
    const [resA, resB] = await Promise.all([a, b])

    // Assert
    expect(verifieer).toHaveBeenCalledTimes(1)
    expect(resA).toEqual(USER)
    expect(resB).toEqual(USER)
  })

  test('gelijktijdige aanroepen met verschillende tokens delen niets', async () => {
    // Arrange
    const cache = maakTokenCache<TestUser>()
    const verifieer = slagendeVerifier()

    // Act
    await Promise.all([
      cache.haal(maakToken(NU + UUR, 'a'), verifieer, NU),
      cache.haal(maakToken(NU + UUR, 'b'), verifieer, NU),
    ])

    // Assert
    expect(verifieer).toHaveBeenCalledTimes(2)
  })

  test('na afronding is de in-flight entry opgeruimd', async () => {
    // Arrange — exp binnen de TTL zodat er niets blijft hangen in de cache
    const cache = maakTokenCache<TestUser>(30_000)
    const verifieer = slagendeVerifier()
    const token = maakToken(NU + 1_000)

    // Act
    await cache.haal(token, verifieer, NU)
    await cache.haal(token, verifieer, NU + 2_000) // ná exp → nieuwe verificatie

    // Assert — een blijvende in-flight entry zou de tweede aanroep het oude
    // resultaat hebben gegeven in plaats van opnieuw te verifiëren
    expect(verifieer).toHaveBeenCalledTimes(2)
  })
})

describe('maakTokenCache — begrensde omvang', () => {
  test('de map groeit nooit voorbij de bovengrens', async () => {
    // Arrange
    const maxEntries = 10
    const cache = maakTokenCache<TestUser>(30_000, maxEntries)
    const verifieer = slagendeVerifier()

    // Act — ruim meer tokens dan de grens toelaat
    for (let i = 0; i < maxEntries * 3; i++) {
      await cache.haal(maakToken(NU + UUR, `gebruiker-${i}`), verifieer, NU)
    }

    // Assert
    expect(cache.omvang()).toBeLessThanOrEqual(maxEntries)
  })

  test('verlopen entries worden opgeruimd zodra de grens in zicht komt', async () => {
    // Arrange
    const maxEntries = 10
    const cache = maakTokenCache<TestUser>(30_000, maxEntries)
    const verifieer = slagendeVerifier()

    // Act — vul met kortlevende tokens, en voeg later toe als die verlopen zijn
    for (let i = 0; i < maxEntries; i++) {
      await cache.haal(maakToken(NU + 5_000, `oud-${i}`), verifieer, NU)
    }
    await cache.haal(maakToken(NU + UUR, 'nieuw'), verifieer, NU + 10_000)

    // Assert — de verlopen entries zijn weg, de nieuwe staat er
    expect(cache.omvang()).toBe(1)
  })
})
