// POST /api/lifeos/agenda/categorieen/regel — leg een geleerde categorie-regel vast.
//
// Body: { titel: string, categorie: AgendaCategorie }. LifeOS onthoudt: elke afspraak
// met deze (genormaliseerde) titel hoort voortaan in deze categorie. Zo leert het van
// jouw herindeling. Founder-gated, net als de rest van LifeOS.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { CATEGORIE_VOLGORDE, type AgendaCategorie } from '@/lib/lifeos/agenda/categorie'
import { zetCategorieRegel } from '@/lib/lifeos/agenda/categorie-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isCategorie(v: unknown): v is AgendaCategorie {
  return typeof v === 'string' && (CATEGORIE_VOLGORDE as readonly string[]).includes(v)
}

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ fout: 'Ongeldige body.' }, { status: 400 })
  }

  const o = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  const titel = typeof o.titel === 'string' ? o.titel : null
  if (!titel || titel.trim().length === 0) {
    return NextResponse.json({ fout: 'Titel ontbreekt.' }, { status: 400 })
  }
  if (!isCategorie(o.categorie)) {
    return NextResponse.json({ fout: 'Onbekende categorie.' }, { status: 400 })
  }

  const uit = await zetCategorieRegel(toegang.admin, toegang.userId, titel, o.categorie)
  if (!uit.ok) {
    const status = uit.reden === 'lege_titel' ? 400 : 502
    return NextResponse.json({ fout: 'Kon de regel niet opslaan.' }, { status })
  }

  return NextResponse.json({ ok: true })
}
