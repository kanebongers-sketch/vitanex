// POST /api/lifeos/pt-app/sessie — Kane opent de Fit Factory PT-app vanuit zijn
// hoofdaccount: geen pincode, maar een sessiecookie (httpOnly) op zijn
// beheerderslink. Antwoord: { code } → de app staat op /<code>.
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { startBeheerSessie } from '@/lib/lifeos/leads/links'
import { sessieCookieNaam } from '@/lib/lifeos/leads/pin'
import { GEEN_CACHE, foutAntwoord } from '@/lib/lifeos/leads/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const sessie = await startBeheerSessie(toegang.admin, toegang.userId, new Date())
  if (!sessie) return foutAntwoord('Je beheerderstoegang tot de PT-app kon niet gestart worden. Probeer het opnieuw.', 502)

  const res = NextResponse.json({ code: sessie.code }, { headers: GEEN_CACHE })
  res.cookies.set(sessieCookieNaam(sessie.code), sessie.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: sessie.verlooptOp,
  })
  return res
}
