// POST   /api/club/lid/push  { endpoint, keys: { p256dh, auth } }  meldingen aan op dit toestel
//        met stil: true  nakijken bij het openen (geen tik): zet een uitgezette voorkeur
//                        nooit weer aan en schrijft niets als het toestel al bekend is.
//                        Antwoord { ok, aan } met aan = false als het lid push uitzette.
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
import { bewaarAbonnement, controleerAbonnement, verwijderAbonnement } from '@/lib/club/push/opslag'
import { publiekeSleutelVoorApp } from '@/lib/club/push/sleutels'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY = 4096

function isStil(body: unknown): boolean {
  return typeof body === 'object' && body !== null && (body as Record<string, unknown>).stil === true
}

export async function POST(req: NextRequest) {
  const l = await vereisLidToegang(req)
  if (l instanceof NextResponse) return l
  if (!publiekeSleutelVoorApp(process.env)) return clubFout('Meldingen op je telefoon zijn nog niet beschikbaar.', 404)
  const gelezen = await leesJsonOfTeGroot(req, MAX_BODY)
  if (gelezen instanceof NextResponse) return gelezen
  const invoer = leesAbonnement(gelezen.body)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  if (l.voorvertoning) return clubJson({ ok: true, voorvertoning: true })
  const aanmelding = {
    userId: l.userId,
    lidId: l.lid.id,
    abonnement: invoer.waarde,
    toestel: kortToestel(req.headers.get('user-agent')),
    sessieHash: l.sessieHash,
  }
  if (isStil(gelezen.body)) {
    const controle = await controleerAbonnement(l.admin, aanmelding)
    return controle === 'fout' ? clubFout('Meldingen nakijken lukt nu niet.', 500) : clubJson({ ok: true, aan: controle !== 'uit' })
  }
  const gelukt = await bewaarAbonnement(l.admin, aanmelding)
  return gelukt ? clubJson({ ok: true, aan: true }) : clubFout('Meldingen aanzetten lukt nu niet. Probeer het later opnieuw.', 500)
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
