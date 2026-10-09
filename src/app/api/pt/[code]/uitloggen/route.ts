// POST /api/pt/[code]/uitloggen — dit toestel uitloggen (sessie weg + cookie leeg).

import { NextResponse, type NextRequest } from 'next/server'
import { logUit } from '@/lib/lifeos/leads/links'
import { sessieCookieNaam } from '@/lib/lifeos/leads/pin'
import { GEEN_CACHE, eisZelfdeOorsprong, linkVoor } from '@/lib/lifeos/leads/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  // Een andere site mag een PT'er niet uitloggen (klein ongemak, maar wel een
  // vector om 'm naar een nep-inlogscherm te duwen).
  const vreemd = eisZelfdeOorsprong(req)
  if (vreemd) return vreemd
  const { code } = await ctx.params
  const r = await linkVoor(code)
  if (r instanceof NextResponse) return r
  const naam = sessieCookieNaam(r.link.code)
  const token = req.cookies.get(naam)?.value
  if (token) await logUit(r.admin, token)
  const res = NextResponse.json({ staat: 'uit' }, { headers: GEEN_CACHE })
  res.cookies.delete(naam)
  return res
}
