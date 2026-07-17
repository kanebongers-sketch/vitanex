// PATCH  /api/lifeos/crm/personen/[id] — hernoemen, verplaatsen (status/sortering),
//   contact/follow-up bijwerken. Body = PersoonWijziging-velden + `groep`.
//   → { persoon: Persoon }.  400 ongeldig · 404 niet gevonden · 409 conflict.
// DELETE /api/lifeos/crm/personen/[id] — weg ermee (historie cascadet) → 204.
//
// `groep` moet mee in de PATCH-body: een nieuwe status valideren we tegen de
// JUISTE groep (een klant-status op een teamlid is een fout, geen "kan gebeuren").
// De groep zelf wijzigt niet — dat is een verhuizing, geen wijziging (zie crm.ts).
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { isGroep, leesPersoonWijziging } from '@/lib/lifeos/crm/crm'
import { verwijderPersoon, wijzigPersoon } from '@/lib/lifeos/crm/opslag'
import type { Reden } from '@/lib/lifeos/crm/fout'

export const runtime = 'nodejs'

interface Context {
  // Next 16: params is een Promise. Zie node_modules/next/dist/docs →
  // 01-app/03-api-reference/03-file-conventions/route.md
  params: Promise<{ id: string }>
}

function foutAntwoord(reden: Reden) {
  if (reden === 'bezet') {
    return NextResponse.json({ fout: 'Dit botst met een bestaande invoer.' }, { status: 409 })
  }
  if (reden === 'ongeldig') {
    return NextResponse.json({ fout: 'Die combinatie kan niet.' }, { status: 400 })
  }
  if (reden === 'niet_gevonden') {
    return NextResponse.json({ fout: 'Persoon bestaat niet.' }, { status: 404 })
  }
  return NextResponse.json({ fout: 'Opslaan mislukt.' }, { status: 502 })
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { id } = await ctx.params

  const body: unknown = await req.json().catch(() => null)
  // De groep bepaalt tegen welke statusset we valideren; hij hoort in de body.
  const groep = isObject(body) ? body.groep : undefined
  if (!isGroep(groep)) {
    return NextResponse.json({ fout: 'Geef de groep mee zodat de status klopt.' }, { status: 400 })
  }

  const wijziging = leesPersoonWijziging(body, groep)
  if (!wijziging.ok) {
    return NextResponse.json({ fout: wijziging.fout }, { status: 400 })
  }

  const uitkomst = await wijzigPersoon(toegang.admin, toegang.userId, id, wijziging.waarde)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ persoon: uitkomst.waarde })
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { id } = await ctx.params
  const uitkomst = await verwijderPersoon(toegang.admin, toegang.userId, id)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return new NextResponse(null, { status: 204 })
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
