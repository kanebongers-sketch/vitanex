// GET /api/club/lid/health/koppelen/<bron>: start het koppelen. Zet een kort
// HttpOnly-cookie met een nonce (en bij PKCE de verifier) en stuurt het lid met
// een ondertekende state naar de leverancier. Alleen als de bron beschikbaar is
// en het lid voor minstens een soort van die bron toestemming gaf.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLidHealth, bronContext, bronUitParams, terugNaarKoppelingen } from '@/lib/club/health/server'
import { haalToestemming } from '@/lib/club/health/opslag'
import { codeChallenge, KOPPEL_COOKIE, KOPPEL_COOKIE_PAD, koppelCookieWaarde, maakCodeVerifier, maakNonce, maakState, STATE_TTL_MS } from '@/lib/club/health/oauth'
import { PROVIDERS } from '@/lib/club/health/providers'
import { heeftToestemmingVoor } from '@/lib/club/health/toestemming'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ bron: string }> }) {
  const l = await vereisLidHealth(req)
  if (l instanceof NextResponse) return l
  const bron = await bronUitParams(params)
  const ctx = bron ? bronContext(bron) : null
  if (!bron || !ctx) return terugNaarKoppelingen(req, { fout: 'niet_beschikbaar' })
  if (l.voorvertoning) return terugNaarKoppelingen(req, { fout: 'voorvertoning' })
  const toestemming = await haalToestemming(l.admin, l.userId, l.lid.id)
  if (!toestemming || !heeftToestemmingVoor(toestemming, PROVIDERS[bron].soorten)) return terugNaarKoppelingen(req, { fout: 'geen_toestemming' })

  const nu = Date.now()
  const nonce = maakNonce()
  const verifier = ctx.adapter.pkce ? maakCodeVerifier() : null
  const state = maakState({ bron, userId: l.userId, lidId: l.lid.id, nonce, verloopt: nu + STATE_TTL_MS }, ctx.hoofdsleutel)
  const url = ctx.adapter.autorisatieUrl({ clientId: ctx.sleutels.clientId, redirectUri: ctx.redirectUri, state, codeChallenge: verifier ? codeChallenge(verifier) : null })

  const res = NextResponse.redirect(url, 303)
  res.headers.set('Cache-Control', 'no-store')
  res.headers.set('Referrer-Policy', 'no-referrer')
  // Lax: het cookie gaat mee als de leverancier het lid terugstuurt (een gewone navigatie).
  res.cookies.set(KOPPEL_COOKIE, koppelCookieWaarde(nonce, verifier), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: KOPPEL_COOKIE_PAD,
    maxAge: Math.floor(STATE_TTL_MS / 1000),
  })
  return res
}
