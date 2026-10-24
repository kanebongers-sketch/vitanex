import { beforeEach, describe, expect, it, vi } from 'vitest'

// getSiteTaal en getTaal met een nagebootst verzoek: de cookie telt, de taal
// van de browser nooit (besluit Kane 24-10-2026).

const verzoek = vi.hoisted(() => ({ cookie: undefined as string | undefined, acceptLanguage: 'en-GB,en;q=0.9' }))

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (naam: string) => (naam === 'ayg-taal' && verzoek.cookie !== undefined ? { name: naam, value: verzoek.cookie } : undefined) }),
  headers: async () => new Headers({ 'accept-language': verzoek.acceptLanguage }),
}))

async function laad() {
  vi.resetModules()
  return import('./server')
}

describe('taal op de server', () => {
  beforeEach(() => {
    verzoek.cookie = undefined
    verzoek.acceptLanguage = 'en-GB,en;q=0.9'
  })

  it('zonder cookie Nederlands, ook als de browser Engels vraagt', async () => {
    const { getSiteTaal, getTaal } = await laad()
    expect(await getSiteTaal()).toBe('nl')
    expect(await getTaal()).toBe('nl')
  })

  it('met de cookie ayg-taal=en Engels, op de website en in Club', async () => {
    verzoek.cookie = 'en'
    verzoek.acceptLanguage = 'nl-NL,nl;q=0.9'
    const { getSiteTaal, getTaal } = await laad()
    expect(await getSiteTaal()).toBe('en')
    expect(await getTaal()).toBe('en')
  })

  it('een onzinnige cookie telt niet', async () => {
    verzoek.cookie = 'de'
    const { getSiteTaal } = await laad()
    expect(await getSiteTaal()).toBe('nl')
  })
})
