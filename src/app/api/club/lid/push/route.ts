// POST   /api/club/lid/push  { endpoint, keys: { p256dh, auth } }  meldingen aan op dit toestel
// DELETE /api/club/lid/push  { endpoint }                          meldingen uit op dit toestel
// Het lid komt altijd uit de sessie (vereisLidToegang), nooit uit de body.
// Het endpoint moet van een bekende push-dienst zijn (geen SSRF). Zonder
// CLUB_PUSH_ACTIEF=1 of zonder kloppende VAPID-sleutels: aanmelden kan niet.
// In de voorvertoning kijkt Kane alleen mee: er verandert niets.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { vereisLidToegang } from '@/lib/club/ledenlogin/toegang'
import { kortToestel, leesAbonnement, leesEndpoint } from '@/lib/club/push/abonnement'
import { bewaarAbonnement, verwijderAbonnement } from '@/lib/club/push/opslag'
import { publiekeSleutelVoorApp } from '@/lib/club/push/sleutels'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY = 4096

export async function POST(req: NextRequest) {
  const l = await vereisLidToegang(req)
  if (l instanceof NextResponse) return l
  if (!publiekeSleutelVoorApp(process.env)) return clubFout('Meldingen op je telefoon zijn nog niet beschikbaar.', 404)
  const gelezen = await leesJsonOfTeGroot(req, MAX_BODY)
  if (gelezen instanceof NextResponse) return gelezen
  const invoer = leesAbonnement(gelezen.body)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  if (l.voorvertoning) return clubJson({ ok: true, voorvertoning: true })
  const gelukt = await bewaarAbonnement(l.admin, {
    userId: l.userId,
    lidId: l.lid.id,
    abonnement: invoer.waarde,
    toestel: kortToestel(req.headers.get('user-agent')),
    sessieHash: l.sessieHash,
  })
  return gelukt ? clubJson({ ok: true }) : clubFout('Meldingen aanzetten lukt nu niet. Probeer het later opnieuw.', 500)
}

export async function DELETE(req: NextRequest) {
  const l = await vereisLidToegang(req)
  if (l instanceof NextResponse) return l
  const gelezen = await leesJsonOfTeGroot(req, MAX_BODY)
  if (gelezen instanceof NextResponse) return gelezen
  if (l.voorvertoning) return clubJson({ ok: true, voorvertoning: true })
  // Ook zonder (geldig) endpoint: dan alleen de voorkeur bijwerken als er niets meer over is.
  const gelukt = await verwijderAbonnement(l.admin, l.userId, l.lid.id, leesEndpoint(gelezen.body))
  return gelukt ? clubJson({ ok: true }) : clubFout('Meldingen uitzetten lukt nu niet. Probeer het later opnieuw.', 500)
}
