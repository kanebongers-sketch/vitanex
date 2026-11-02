import { createECDH } from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, vereisPlatformEigenaar } from '@/lib/club/toegang'
import { huidigPlatformAccount } from '@/lib/club/platform-login/huidig'
import { naarB64u } from '@/lib/club/push/base64url'

// POST /api/club/platform/vapid: een nieuw VAPID-sleutelpaar voor de push van
// de ledenapp, om in Render te zetten (Systeem, koppelingen). Alleen voor het
// master account. Er wordt niets bewaard of gelogd: het paar staat alleen in
// het antwoord en verdwijnt met de pagina.

export async function POST(req: NextRequest) {
  const t = await vereisPlatformEigenaar(req)
  if (t instanceof NextResponse) return t
  const account = await huidigPlatformAccount()
  if (!account) return clubFout('Niet gevonden.', 404)
  const ecdh = createECDH('prime256v1')
  ecdh.generateKeys()
  return clubJson({
    regels: [
      `CLUB_VAPID_PUBLIC_KEY=${naarB64u(ecdh.getPublicKey())}`,
      `CLUB_VAPID_PRIVATE_KEY=${naarB64u(ecdh.getPrivateKey())}`,
      `CLUB_VAPID_SUBJECT=mailto:${account.email}`,
    ],
  })
}
