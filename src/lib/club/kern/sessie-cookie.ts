// ─── AI Your Gym: een sessie per browser (SERVER) ───────────────────────────
// Er zijn drie soorten sessies in Club: het master account van het platform,
// een eigenaar of clubmanager, en een medewerker. Club kiest in die volgorde
// (toegang.ts). Logt iemand in als het ene account terwijl er nog een cookie van
// een ander staat, dan zou het oude account winnen (Kane kwam na een
// testaanmelding in zijn eigen omgeving uit in plaats van de nieuwe sportschool).
// Daarom zet elke login precies een sessiecookie en wist de andere twee.

import type { NextResponse } from 'next/server'
import { platformCookie } from '@/lib/club/platform-login/platform'
import { beheerderCookie } from '@/lib/club/beheerders/beheerder'
import { medewerkerCookie } from '@/lib/club/medewerker-login/medewerker-login'

export type SessieSoort = 'platform' | 'beheerder' | 'medewerker'

const NAAM: Record<SessieSoort, () => string> = { platform: platformCookie, beheerder: beheerderCookie, medewerker: medewerkerCookie }

function opties(extra: { expires?: Date; maxAge?: number }) {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', ...extra }
}

/** Zet de sessie van deze soort (httpOnly, alleen pad /) en wis de cookies van de andere soorten. */
export function zetClubSessie(res: NextResponse, soort: SessieSoort, token: string, verlooptOp: Date): NextResponse {
  for (const ander of Object.keys(NAAM) as SessieSoort[]) {
    if (ander !== soort) res.cookies.set(NAAM[ander](), '', opties({ maxAge: 0 }))
  }
  res.cookies.set(NAAM[soort](), token, opties({ expires: verlooptOp }))
  return res
}
