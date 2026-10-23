// POST   /api/club/lid/health/toestemming  { akkoord: true, versie, delen, trainerZien, trainerBronnen }
//        De keuze van het lid (een nieuwe rij met tijdstip en tekstversie). Soorten die het
//        lid niet meer deelt, worden meteen gewist.
// DELETE /api/club/lid/health/toestemming
//        Alles intrekken: er wordt niets meer opgehaald en alle metingen uit apps worden gewist
//        (zonder toestemming mogen we ze niet bewaren). Koppelingen blijven staan tot het lid ontkoppelt.
// Het lid komt altijd uit de sessie. In de voorvertoning verandert er niets.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { zonderLid } from '@/lib/club/ledenlogin/toegang'
import { vereisLidHealth } from '@/lib/club/health/server'
import { bewaarToestemming, haalToestemming, wisMetingen, wisSoorten } from '@/lib/club/health/opslag'
import { leesKeuze, TOESTEMMING_VERSIE } from '@/lib/club/health/toestemming'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const l = await vereisLidHealth(req)
  if (l instanceof NextResponse) return l
  const gelezen = await leesJsonOfTeGroot(req, 4096)
  if (gelezen instanceof NextResponse) return gelezen
  const keuze = leesKeuze(zonderLid(gelezen.body))
  if (!keuze.ok) return clubFout(keuze.fout, 400)
  if (l.voorvertoning) return clubJson({ ok: true, voorvertoning: true })
  const vorige = await haalToestemming(l.admin, l.userId, l.lid.id)
  if (!vorige) return clubFout('Opslaan lukt nu niet. Probeer het opnieuw.', 500)
  const gestopt = vorige.delen.filter((s) => !keuze.delen.includes(s))
  const opgeslagen = await bewaarToestemming(l.admin, { userId: l.userId, lidId: l.lid.id, delen: keuze.delen, trainerZien: keuze.trainerZien, trainerBronnen: keuze.trainerBronnen, versie: TOESTEMMING_VERSIE, ingetrokken: false })
  if (!opgeslagen) return clubFout('Opslaan lukt nu niet. Probeer het opnieuw.', 500)
  const gewist = await wisSoorten(l.admin, l.userId, l.lid.id, gestopt)
  return clubJson({ ok: true, gewist: gewist ? gestopt : [], toestemming: await haalToestemming(l.admin, l.userId, l.lid.id) })
}

export async function DELETE(req: NextRequest) {
  const l = await vereisLidHealth(req)
  if (l instanceof NextResponse) return l
  if (l.voorvertoning) return clubJson({ ok: true, voorvertoning: true })
  const opgeslagen = await bewaarToestemming(l.admin, { userId: l.userId, lidId: l.lid.id, delen: [], trainerZien: [], trainerBronnen: [], versie: TOESTEMMING_VERSIE, ingetrokken: true })
  if (!opgeslagen) return clubFout('Intrekken lukt nu niet. Probeer het opnieuw.', 500)
  // Lukt het wissen nu niet, dan doet de nachtelijke ronde het (migratie 463).
  const gewist = await wisMetingen(l.admin, l.userId, l.lid.id, null)
  return clubJson({ ok: true, gewist })
}
