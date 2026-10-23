// GET /api/club/lid/health/callback/<bron>?code=&state=: de leverancier stuurt
// het lid hier terug. We controleren de state (handtekening, vervaltijd, bron,
// sportschool en lid uit de sessie) en de nonce uit het cookie, wisselen de code
// in voor tokens, bewaren ze versleuteld en halen meteen een eerste keer op.
// Tokens en codes komen nooit in een log of in de URL van de terugweg.

import { NextResponse, type NextRequest } from 'next/server'
import { bronContext, bronUitParams, terugNaarKoppelingen, vereisLidHealth } from '@/lib/club/health/server'
import { controleerCallback, KOPPEL_COOKIE, KOPPEL_COOKIE_PAD } from '@/lib/club/health/oauth'
import { bewaarKoppeling, echteHttp, supabaseSyncOpslag } from '@/lib/club/health/opslag'
import { synchroniseer, tokenVelden, vraagTokens } from '@/lib/club/health/sync'
import type { Tokens } from '@/lib/club/health/adapter'
import type { BronContext } from '@/lib/club/health/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function zonderCookie(res: NextResponse): NextResponse {
  res.cookies.set(KOPPEL_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: KOPPEL_COOKIE_PAD, maxAge: 0 })
  return res
}

/** Polar en WHOOP: een stap direct na het koppelen. Geeft de tokens terug, eventueel met het id bij de leverancier. */
async function naKoppelen(ctx: BronContext, tokens: Tokens): Promise<Tokens | null> {
  const verzoek = ctx.adapter.naKoppelen?.(tokens) ?? null
  if (!verzoek) return tokens
  try {
    const a = await echteHttp(verzoek)
    if (!(a.status >= 200 && a.status < 300) && a.status !== 409) return null
    const extern = ctx.adapter.externIdNaKoppelen?.(a.json) ?? null
    return extern ? { ...tokens, externGebruikerId: extern } : tokens
  } catch {
    return null
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ bron: string }> }) {
  const l = await vereisLidHealth(req)
  if (l instanceof NextResponse) return l
  const bron = await bronUitParams(params)
  const ctx = bron ? bronContext(bron) : null
  if (!bron || !ctx) return zonderCookie(terugNaarKoppelingen(req, { fout: 'niet_beschikbaar' }))
  if (l.voorvertoning) return zonderCookie(terugNaarKoppelingen(req, { fout: 'voorvertoning' }))

  const vraag = req.nextUrl.searchParams
  if (vraag.get('error')) return zonderCookie(terugNaarKoppelingen(req, { fout: 'geweigerd' }))
  const nu = new Date()
  const controle = controleerCallback({ state: vraag.get('state'), cookie: req.cookies.get(KOPPEL_COOKIE)?.value, bron, userId: l.userId, lidId: l.lid.id, hoofdsleutel: ctx.hoofdsleutel, nu })
  if (!controle.ok) return zonderCookie(terugNaarKoppelingen(req, { fout: controle.fout === 'verlopen' ? 'verlopen' : 'ongeldig' }))
  const code = vraag.get('code')
  if (!code || code.length > 2000) return zonderCookie(terugNaarKoppelingen(req, { fout: 'ongeldig' }))

  const http = echteHttp
  const ruw = await vraagTokens({ adapter: ctx.adapter, sleutels: ctx.sleutels, http, nu }, { soort: 'code', code, codeVerifier: controle.verifier, redirectUri: ctx.redirectUri })
  const tokens = ruw ? await naKoppelen(ctx, ruw) : null
  if (!tokens) return zonderCookie(terugNaarKoppelingen(req, { fout: 'token' }))

  const koppeling = await bewaarKoppeling(l.admin, { userId: l.userId, lidId: l.lid.id, bron, wijziging: { status: 'actief', ...tokenVelden(tokens, { userId: l.userId, lidId: l.lid.id, bron }, ctx.hoofdsleutel) } })
  if (!koppeling) return zonderCookie(terugNaarKoppelingen(req, { fout: 'opslaan' }))

  // Meteen een eerste keer ophalen; gaat dat mis, dan probeert de cron het later opnieuw.
  await synchroniseer({ adapter: ctx.adapter, sleutels: ctx.sleutels, hoofdsleutel: ctx.hoofdsleutel, opslag: supabaseSyncOpslag(l.admin), http, nu }, koppeling)
  return zonderCookie(terugNaarKoppelingen(req, { gekoppeld: bron }))
}
