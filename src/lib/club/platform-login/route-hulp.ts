// ─── AI Your Gym, platform-inlog: gedeelde stappen van de routes (SERVER) ───
// De rem per IP (gehasht met remSleutel, nooit het IP zelf als sleutel) en het
// zetten van de sessiecookie. Gebruikt door /api/club/inloggen (e-mail en
// wachtwoord) en /api/club/inloggen/platform/[code]/wachtwoord.

import type { NextRequest, NextResponse } from 'next/server'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { remSleutel } from '@/lib/club/kern/rem-hash'
import { ipVan } from '@/lib/club/kern/verzoek'
import { platformCookie } from './platform'

/** Per IP: ruim boven wat een mens tikt, ver onder wat bruteforce nodig heeft. */
const IP_MAX = 10
const IP_VENSTER_MS = 15 * 60_000

/** True als dit netwerk even moet wachten. */
export function platformGeremd(req: NextRequest, doel: 'inloggen' | 'wachtwoord'): boolean {
  return isRateLimited(`platform-${doel}:${remSleutel(`platform-${doel}`, ipVan(req))}`, IP_MAX, IP_VENSTER_MS)
}

/** De sessiecookie op het antwoord: httpOnly, alleen deze host, alleen pad /. */
export function zetPlatformCookie(res: NextResponse, token: string, verlooptOp: Date): NextResponse {
  res.cookies.set(platformCookie(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: verlooptOp,
  })
  return res
}
