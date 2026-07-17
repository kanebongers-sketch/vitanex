import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

// ─── Wat hier bewaakt wordt ─────────────────────────────────────────────────
// Deze route is publiek (wie een uitnodiging opent heeft nog geen account) en
// draait op de service-role. De vormcontrole op het token is dus geen cosmetica
// maar de eerste zeef: hij vuurt vóór er ook maar één query op de database
// losgelaten wordt. Daarom zijn deze tests uitvoerbaar zonder Supabase-mock —
// als er ooit een pad langs de zeef ontstaat, faalt dit bestand met een
// configuratiefout in plaats van stil door te lopen.

function get(query: string): NextRequest {
  return new NextRequest(`https://mentaforce.test/api/uitnodiging${query}`)
}

describe('GET /api/uitnodiging — tokenvorm', () => {
  it('wijst af (404) zonder token', async () => {
    const res = await GET(get(''))
    expect(res.status).toBe(404)
  })

  it('wijst af (404) bij een leeg token', async () => {
    const res = await GET(get('?token='))
    expect(res.status).toBe(404)
  })

  it('wijst af (404) bij een te kort token', async () => {
    const res = await GET(get('?token=abc123'))
    expect(res.status).toBe(404)
  })

  it('wijst af (404) bij niet-hex tekens', async () => {
    const res = await GET(get(`?token=${'z'.repeat(48)}`))
    expect(res.status).toBe(404)
  })

  it('wijst af (404) bij hoofdletters — encode(...,\'hex\') levert lowercase', async () => {
    const res = await GET(get(`?token=${'A'.repeat(48)}`))
    expect(res.status).toBe(404)
  })

  it('geeft geen onderscheid tussen "bestaat niet" en "al gebruikt"', async () => {
    // Beide leveren exact dezelfde 404 met dezelfde body op. Zou dat verschillen,
    // dan had je een oracle om geldige tokens mee af te tasten.
    const res = await GET(get('?token=nietgeldig'))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ fout: 'Ongeldige uitnodiging.' })
  })
})
