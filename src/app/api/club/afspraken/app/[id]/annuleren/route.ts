// POST /api/club/afspraken/app/[id]/annuleren { lidId }: het lid annuleert zelf,
// binnen de annuleerregel van het type. Daarna is het tijdslot weer vrij.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { volledigeNaam } from '@/lib/club/kern/lid'
import { isUuid } from '@/lib/club/afspraken/invoer'
import { haalAfspraak, haalType, werkAfspraakBij } from '@/lib/club/afspraken/opslag'
import { magLidAnnuleren } from '@/lib/club/afspraken/regels'
import { leesJson } from '@/lib/club/afspraken/api'
import { lidVoorApp } from '@/lib/club/afspraken/app-api'

interface Context {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await ctx.params
  if (!isUuid(id)) return clubFout('Afspraak niet gevonden.', 404)
  const body = await leesJson(req)
  const lidId = typeof body === 'object' && body !== null && 'lidId' in body ? body.lidId : null
  const lid = await lidVoorApp(t, lidId)
  if (lid instanceof NextResponse) return lid
  const afspraak = await haalAfspraak(t.admin, t.userId, id)
  if (!afspraak || afspraak.lidId !== lid.id) return clubFout('Afspraak niet gevonden.', 404)
  const type = await haalType(t.admin, t.userId, afspraak.typeId)
  if (!type) return clubFout('Annuleren lukt nu niet. Bel of mail de sportschool.', 409)
  const mag = magLidAnnuleren(type, afspraak, new Date())
  if (!mag.ok) return clubFout(mag.fout, 409)
  const uit = await werkAfspraakBij(t.admin, t.userId, id, { status: 'geannuleerd', geannuleerd_op: new Date().toISOString() })
  if (!uit.ok) return clubFout(uit.fout, uit.status)
  await logActie(t, 'afspraak geannuleerd in de app', `${type.naam}, ${volledigeNaam(lid)}`, lid.vestiging)
  return clubJson({ ok: true })
}
