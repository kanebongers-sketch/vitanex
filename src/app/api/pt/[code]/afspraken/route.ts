// POST /api/pt/[code]/afspraken — meetbare afspraken uit de checkup vastleggen.
// Body: { persoonId, gesprekken?, nieuweKlanten?, referrals?, nietsTeLaat?, notitie? }.
// Alleen Kane (beheerder): de checkup is zijn gesprek met de PT'er.

import { NextResponse, type NextRequest } from 'next/server'
import { GEEN_CACHE, eisZelfdeOorsprong, foutAntwoord, ingelogdeLink, isUuid } from '@/lib/lifeos/leads/toegang'
import { leesAfspraakInvoer } from '@/lib/lifeos/pt-dashboard/checkup'
import { maakAfspraak } from '@/lib/lifeos/pt-dashboard/afspraken-opslag'
import { haalTrainers } from '@/lib/lifeos/pt-dashboard/team-opslag'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'

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
  if (r.link.rol !== 'beheerder') return foutAntwoord('Afspraken uit de checkup legt Kane vast.', 403)

  const body: unknown = await req.json().catch(() => null)
  const persoonId = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).persoonId : null
  if (typeof persoonId !== 'string' || !isUuid(persoonId)) return foutAntwoord('Ongeldige invoer.', 400)
  const invoer = leesAfspraakInvoer(body)
  if (!invoer.ok) return foutAntwoord(invoer.fout, 400)

  const team = await haalTrainers(r.admin, r.link.userId)
  if (!team) return foutAntwoord('Opslaan mislukt. Probeer het opnieuw.', 502)
  if (!team.some((p) => p.id === persoonId)) return foutAntwoord("Kies een PT'er uit het team.", 404)

  const ok = await maakAfspraak(r.admin, r.link.userId, persoonId, invoer.waarde, dagSleutelNl(new Date()), r.link.naam)
  if (!ok) return foutAntwoord('Opslaan mislukt. Probeer het opnieuw.', 502)
  return new NextResponse(null, { status: 204, headers: GEEN_CACHE })
}
