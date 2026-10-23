// POST /api/pt/[code]/belangrijk — "Belangrijk" bovenaan het startscherm.
// Kane (beheerder): punten toevoegen, wijzigen, volgorde, aan/uit, verwijderen.
// Een PT'er: een punt afvinken (of terugzetten) en zijn kledingmaten doorgeven,
// altijd voor zichzelf (persoon_id uit zijn sessie, nooit uit de body).
// Eigenaren en clubmanagers: 403. Body: { actie, ... } (zie belangrijk.ts).

import { NextResponse, type NextRequest } from 'next/server'
import { GEEN_CACHE, eisZelfdeOorsprong, foutAntwoord, ingelogdeLink } from '@/lib/lifeos/leads/toegang'
import { isBeheerActie, leesBelangrijkActie } from '@/lib/lifeos/pt-dashboard/belangrijk'
import { geweigerd, magActie } from '@/lib/lifeos/pt-dashboard/belangrijk-rechten'
import { slaKledingmatenOp, voerBeheerUit, zetGedaan } from '@/lib/lifeos/pt-dashboard/belangrijk-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  const vreemd = eisZelfdeOorsprong(req)
  if (vreemd) return vreemd
  const { code } = await ctx.params
  const r = await ingelogdeLink(req, code, { eigenaarMag: true })
  if (r instanceof NextResponse) return r

  const invoer = leesBelangrijkActie(await req.json().catch(() => null))
  if (!invoer.ok) return foutAntwoord(invoer.fout, 400)
  const a = invoer.waarde
  if (!magActie(r.link.rol, a)) return foutAntwoord(geweigerd(a), 403)

  const uit = isBeheerActie(a)
    ? await voerBeheerUit(r.admin, r.link.userId, a)
    : a.actie === 'gedaan'
      ? await zetGedaan(r.admin, r.link.userId, r.link.persoonId, a.id, a.gedaan)
      : await slaKledingmatenOp(r.admin, r.link.userId, r.link.persoonId, a.maten)
  if (!uit.ok) return foutAntwoord(uit.fout, uit.status)
  return new NextResponse(null, { status: 204, headers: GEEN_CACHE })
}
