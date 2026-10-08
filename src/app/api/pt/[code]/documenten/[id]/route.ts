// GET /api/pt/[code]/documenten/[id] — een PT'er opent een document (achter de
// pincode). Antwoord: 302 naar een signed URL van 5 minuten op de privé bucket.
// PDF opent inline; Word/PowerPoint/Excel komen met een nette bestandsnaam (op
// een iPhone toont iOS ze in het voorbeeldscherm). Alleen zichtbare documenten.

import { NextResponse, type NextRequest } from 'next/server'
import { GEEN_CACHE, foutAntwoord, ingelogdeLink, isUuid } from '@/lib/lifeos/leads/toegang'
import { haalDocument, tekenDownload } from '@/lib/lifeos/pt-dashboard/documenten-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string; id: string }>
}

const NIET_GEVONDEN = 'Dit document bestaat niet (meer).'

export async function GET(req: NextRequest, ctx: Context) {
  const { code, id } = await ctx.params
  const r = await ingelogdeLink(req, code, { eigenaarMag: true })
  if (r instanceof NextResponse) return r
  if (!isUuid(id)) return foutAntwoord(NIET_GEVONDEN, 404)

  const doc = await haalDocument(r.admin, r.link.userId, id, { alleenZichtbaar: true })
  if (!doc.ok) {
    return doc.reden === 'niet_gevonden'
      ? foutAntwoord(NIET_GEVONDEN, 404)
      : foutAntwoord('Het document kon niet geladen worden. Probeer het opnieuw.', 502)
  }
  const url = await tekenDownload(r.admin, doc.waarde)
  if (!url.ok) return foutAntwoord('Het document kon niet geopend worden. Probeer het opnieuw.', 502)

  // 302 + no-store: de signed URL mag nergens in een cache blijven hangen.
  return NextResponse.redirect(url.waarde, { status: 302, headers: { ...GEEN_CACHE, 'Referrer-Policy': 'no-referrer' } })
}
