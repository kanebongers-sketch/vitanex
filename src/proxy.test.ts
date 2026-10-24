import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from './proxy'

// De taal door de echte proxy heen (besluit Kane 24-10-2026): geen /en in
// adressen, oude /en-links worden een 308 met de cookie ayg-taal=en.

function verzoek(adres: string, koppen: Record<string, string> = {}): NextRequest {
  const url = new URL(adres)
  return new NextRequest(url, { headers: { host: url.host, ...koppen } })
}

describe('proxy: taal op aiyourgym.com', () => {
  beforeEach(() => {
    vi.stubEnv('AIYOURGYM_SITE_ACTIEF', '1')
    vi.stubEnv('CLUB_SUBDOMEINEN_ACTIEF', '0')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('/en/functies wordt een 308 naar /functies met de cookie ayg-taal=en', async () => {
    const res = await proxy(verzoek('https://aiyourgym.com/en/functies?pakket=club'))
    expect(res.status).toBe(308)
    expect(res.headers.get('location')).toBe('https://aiyourgym.com/functies?pakket=club')
    const koekje = res.cookies.get('ayg-taal')
    expect(koekje?.value).toBe('en')
    expect(koekje).toMatchObject({ path: '/', sameSite: 'lax', secure: true, maxAge: 60 * 60 * 24 * 365 })
    expect(koekje?.httpOnly).toBeFalsy()
  })

  it('/en wordt een 308 naar de voorpagina', async () => {
    const res = await proxy(verzoek('https://aiyourgym.com/en'))
    expect(res.status).toBe(308)
    expect(res.headers.get('location')).toBe('https://aiyourgym.com/')
    expect(res.cookies.get('ayg-taal')?.value).toBe('en')
  })

  it('een gewone pagina wordt herschreven zonder taal, ook met een Engelse browser', async () => {
    const res = await proxy(verzoek('https://aiyourgym.com/functies', { 'accept-language': 'en-GB,en;q=0.9' }))
    expect(res.status).toBe(200)
    const doel = res.headers.get('x-middleware-rewrite') ?? ''
    expect(doel).toContain('/aiyourgym/functies')
    expect(doel).not.toContain('/en/')
    expect(res.cookies.get('ayg-taal')).toBeUndefined()
  })

  it('fitfactorypt.nl/aiyourgym/en/prijzen wordt een 308 naar /aiyourgym/prijzen met de cookie', async () => {
    const res = await proxy(verzoek('https://fitfactorypt.nl/aiyourgym/en/prijzen'))
    expect(res.status).toBe(308)
    expect(res.headers.get('location')).toBe('https://fitfactorypt.nl/aiyourgym/prijzen')
    expect(res.cookies.get('ayg-taal')?.value).toBe('en')
  })
})
