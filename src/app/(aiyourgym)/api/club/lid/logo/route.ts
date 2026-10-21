// GET /api/club/lid/logo
// Het logo van de eigen sportschool, voor de ledenapp. Alleen met een
// ledensessie (of Kane in de voorvertoning met ?voor=); welke sportschool komt
// uit de sessie, nooit uit de vraag. Een SVG krijgt een strenge eigen CSP.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout } from '@/lib/club/toegang'
import { LOGO_FIT_FACTORY, LOGO_PAD } from '@/lib/club/kern/organisatie'
import { LOGO_BUCKET } from '@/lib/club/kern/organisatie-opslag'
import { vereisLidToegang } from '@/lib/club/ledenlogin/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TYPE: Record<string, string> = { png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml', jpg: 'image/jpeg' }

export async function GET(req: NextRequest) {
  const l = await vereisLidToegang(req)
  if (l instanceof NextResponse) return l
  const pad = l.organisatie.logo
  if (!pad || pad === LOGO_FIT_FACTORY || !LOGO_PAD.test(pad) || !pad.startsWith(`${l.userId}/`)) return clubFout('Niet gevonden.', 404)
  const { data, error } = await l.admin.storage.from(LOGO_BUCKET).download(pad)
  if (error || !data) return clubFout('Niet gevonden.', 404)
  return new NextResponse(data, {
    headers: {
      'Content-Type': TYPE[pad.slice(pad.lastIndexOf('.') + 1)] ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
    },
  })
}
