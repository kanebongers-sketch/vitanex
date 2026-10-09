// GET /api/pt/[code]/coaching/[id]/pdf — een eigenaar of de beheerder opent
// het verslag van een coachgesprek als pdf, vanuit de PT-app (sessiecookie, dus
// een gewone link werkt — ook op de telefoon). Een PT'er krijgt 403: de scores
// en notities van Kane zijn voor de eigenaren, niet voor de PT'er zelf.
// Het verslag wordt compleet opgebouwd (lead tracker, klanten, voorbereiding),
// zie `verslag-bouw.ts`.

import { NextResponse, type NextRequest } from 'next/server'
import { kijktMee } from '@/lib/lifeos/leads/links'
import { GEEN_CACHE, foutAntwoord, ingelogdeLink, isUuid } from '@/lib/lifeos/leads/toegang'
import { bouwVerslag, verslagPdfAntwoord } from '@/lib/lifeos/pt-coaching/verslag-bouw'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string; id: string }>
}

const NIET_GEVONDEN = 'Dit verslag bestaat niet.'

export async function GET(req: NextRequest, ctx: Context) {
  const { code, id } = await ctx.params
  const r = await ingelogdeLink(req, code, { eigenaarMag: true })
  if (r instanceof NextResponse) return r
  if (!kijktMee(r.link.rol)) return foutAntwoord('Verslagen zijn alleen voor de eigenaren en Kane.', 403)
  if (!isUuid(id)) return foutAntwoord(NIET_GEVONDEN, 404)

  const v = await bouwVerslag(r.admin, r.link.userId, id, new Date())
  if (!v.ok) return v.reden === 'niet_gevonden' ? foutAntwoord(NIET_GEVONDEN, 404) : foutAntwoord('Het verslag kon niet gelezen worden. Probeer het opnieuw.', 502)

  // Inline: opent in de browser/app; de bestandsnaam blijft voor "bewaren".
  return verslagPdfAntwoord(v.waarde, { inline: true, headers: GEEN_CACHE })
}
