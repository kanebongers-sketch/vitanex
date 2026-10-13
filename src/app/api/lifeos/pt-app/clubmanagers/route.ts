// POST   /api/lifeos/pt-app/clubmanagers — clubmanager toevoegen. Body: { naam, club }.
// DELETE /api/lifeos/pt-app/clubmanagers — clubmanager stoppen. Body: { persoonId }.
// Kane beheert dit onder Beheer in de PT-app. Auth: de founder-gate.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { maakClubmanager, stopClubmanager } from '@/lib/lifeos/leads/links'
import { isClub } from '@/lib/lifeos/pt-dashboard/clubs'
import { isUuid } from '@/lib/lifeos/leads/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GEEN_CACHE = { 'Cache-Control': 'private, no-store' } as const

async function body(req: NextRequest): Promise<Record<string, unknown>> {
  const ruw: unknown = await req.json().catch(() => null)
  return typeof ruw === 'object' && ruw !== null ? (ruw as Record<string, unknown>) : {}
}

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang
  const o = await body(req)
  const naam = typeof o.naam === 'string' ? o.naam.replace(/\s+/g, ' ').trim() : ''
  if (naam.length < 2 || naam.length > 60) return NextResponse.json({ fout: 'Vul een naam in (2 tot 60 tekens).' }, { status: 400 })
  if (!isClub(o.club)) return NextResponse.json({ fout: 'Kies de club.' }, { status: 400 })

  const uit = await maakClubmanager(toegang.admin, toegang.userId, naam, o.club)
  if (!uit) return NextResponse.json({ fout: 'Opslaan mislukt. Probeer het opnieuw.' }, { status: 502 })
  return NextResponse.json(uit, { status: 201, headers: GEEN_CACHE })
}

export async function DELETE(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang
  const o = await body(req)
  if (typeof o.persoonId !== 'string' || !isUuid(o.persoonId)) return NextResponse.json({ fout: 'Ongeldige invoer.' }, { status: 400 })
  const uit = await stopClubmanager(toegang.admin, toegang.userId, o.persoonId)
  if (uit === 'niet_gevonden') return NextResponse.json({ fout: 'Deze clubmanager bestaat niet (meer).' }, { status: 404 })
  if (uit === 'db') return NextResponse.json({ fout: 'Opslaan mislukt.' }, { status: 502 })
  return NextResponse.json({ ok: true }, { headers: GEEN_CACHE })
}
