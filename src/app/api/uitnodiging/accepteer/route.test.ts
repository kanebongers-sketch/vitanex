import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, uitnodigingHoortBij } from './route'

// ─── Wat hier bewaakt wordt ─────────────────────────────────────────────────
// Deze route verving een client-side `profiles.upsert` waarin de client zelf
// het bedrijf_id koos, plus een publieke UPDATE-policy op uitnodiging_tokens
// (zie migratie 045). Twee eigenschappen houden dat gat dicht:
//
//   1. Zonder geldige sessie kom je er niet in.
//   2. Een uitnodiging is alleen te verzilveren door het adres waarvoor hij
//      bedoeld is.
//
// Punt 2 is de kern: het onderscheidt "ik ben ingelogd" van "deze uitnodiging
// is aan mij gericht". Zonder die regel geeft élk onderschept token toegang
// tot het bijbehorende bedrijf.

function post(headers: Record<string, string> = {}, body: unknown = {}): NextRequest {
  return new NextRequest('https://mentaforce.test/api/uitnodiging/accepteer', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

describe('uitnodigingHoortBij — de binding tussen token en sessie', () => {
  it('accepteert hetzelfde adres', () => {
    expect(uitnodigingHoortBij('jan@bedrijf.nl', 'jan@bedrijf.nl')).toBe(true)
  })

  it('negeert hoofdletters — HR typt met de hand, Supabase niet', () => {
    expect(uitnodigingHoortBij('Jan@Bedrijf.NL', 'jan@bedrijf.nl')).toBe(true)
  })

  it('negeert omringende spaties', () => {
    expect(uitnodigingHoortBij('  jan@bedrijf.nl  ', 'jan@bedrijf.nl')).toBe(true)
  })

  it('wijst een ander adres af — dit is de hele beveiliging', () => {
    expect(uitnodigingHoortBij('jan@bedrijf.nl', 'aanvaller@evil.nl')).toBe(false)
  })

  it('wijst een adres af dat alleen een prefix deelt', () => {
    expect(uitnodigingHoortBij('jan@bedrijf.nl', 'jan@bedrijf.nl.evil.nl')).toBe(false)
  })

  it('laat leeg nooit als match gelden', () => {
    expect(uitnodigingHoortBij('', '')).toBe(false)
    expect(uitnodigingHoortBij('jan@bedrijf.nl', '')).toBe(false)
    expect(uitnodigingHoortBij('', 'jan@bedrijf.nl')).toBe(false)
    expect(uitnodigingHoortBij('   ', '   ')).toBe(false)
  })
})

describe('POST /api/uitnodiging/accepteer — auth-gate', () => {
  it('wijst af (401) zonder Authorization-header', async () => {
    const res = await POST(post())
    expect(res.status).toBe(401)
  })

  it('wijst af (401) bij een niet-Bearer schema', async () => {
    const res = await POST(post({ authorization: 'Basic aGFsbG86ZGFhcg==' }))
    expect(res.status).toBe(401)
  })

  it('wijst af (401) bij een kale token-waarde zonder Bearer-prefix', async () => {
    const res = await POST(post({ authorization: 'zomaar-een-token' }))
    expect(res.status).toBe(401)
  })
})
