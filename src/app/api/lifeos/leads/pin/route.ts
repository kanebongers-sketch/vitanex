// POST /api/lifeos/leads/pin — de pincode van een PT'er goedkeuren, afwijzen of
// resetten (vergeten pin). Body: { persoonId, actie }.
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { beoordeelPin } from '@/lib/lifeos/leads/opslag'
import type { PinActie } from '@/lib/lifeos/leads/leads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ACTIES: readonly PinActie[] = ['goedkeuren', 'afwijzen', 'resetten']

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang
  const body: unknown = await req.json().catch(() => null)
  const o = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  const actie = ACTIES.find((a) => a === o.actie)
  if (typeof o.persoonId !== 'string' || !actie) return NextResponse.json({ fout: 'Ongeldige invoer.' }, { status: 400 })

  const uit = await beoordeelPin(toegang.admin, toegang.userId, o.persoonId, actie)
  if (uit === 'niet_gevonden') return NextResponse.json({ fout: 'Er wacht geen pincode op goedkeuring.' }, { status: 404 })
  if (uit === 'db') return NextResponse.json({ fout: 'Opslaan mislukt.' }, { status: 502 })
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } })
}
