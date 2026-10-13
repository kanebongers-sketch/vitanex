// POST /api/lifeos/pt-kleding — kleding beheren (alleen Kane): artikel toevoegen,
// voorraad in Eersel zetten, kleding uitgeven aan een PT'er of terugnemen.
// Body: { actie: 'artikel' | 'voorraad' | 'uitgeven' | 'terug', ... } (zie kleding.ts).
// Auth: de founder-gate. Lezen gebeurt server-side op de kledingpagina.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'
import { leesKledingActie } from '@/lib/lifeos/pt-dashboard/kleding'
import { voerKledingActieUit } from '@/lib/lifeos/pt-dashboard/kleding-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang
  const invoer = leesKledingActie(await req.json().catch(() => null), dagSleutelNl(new Date()))
  if (!invoer.ok) return NextResponse.json({ fout: invoer.fout }, { status: 400 })
  const uit = await voerKledingActieUit(toegang.admin, toegang.userId, invoer.waarde)
  if (!uit.ok) return NextResponse.json({ fout: uit.fout }, { status: uit.status })
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } })
}
