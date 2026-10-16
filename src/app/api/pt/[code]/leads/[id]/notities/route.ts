// POST /api/pt/[code]/leads/[id]/notities — een contactmoment bij een lead: wat
// er gebeurde ("gebeld, voicemail"), en optioneel in hetzelfde moment de nieuwe
// status en de volgende opvolging. Body: { tekst, status?, opvolgdatum?, opvolgtijd? }.
// Datum = vandaag (NL). Antwoord: { notitie, lead }.
// Achter de pincode; alleen leads van díe PT'er, of voor de beheerder van het hele team.

import { NextResponse, type NextRequest } from 'next/server'
import { dagSleutelNl, leesContactmoment } from '@/lib/lifeos/leads/leads'
import { voegContactmomentToe } from '@/lib/lifeos/leads/opslag'
import { GEEN_CACHE, eisZelfdeOorsprong, foutAntwoord, isUuid, leadToegang } from '@/lib/lifeos/leads/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string; id: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  const vreemd = eisZelfdeOorsprong(req)
  if (vreemd) return vreemd
  const { code, id } = await ctx.params
  if (!isUuid(id)) return foutAntwoord('Lead bestaat niet.', 404)
  const r = await leadToegang(req, code, id)
  if (r instanceof NextResponse) return r
  const moment = leesContactmoment(await req.json().catch(() => null))
  if (!moment.ok) return foutAntwoord(moment.fout, 400)
  const uit = await voegContactmomentToe(r.admin, r.link, id, moment.waarde, dagSleutelNl(new Date()), r.link.naam)
  if (!uit.ok) {
    if (uit.reden === 'niet_gevonden') return foutAntwoord('Lead bestaat niet.', 404)
    if (uit.reden === 'te_veel') return foutAntwoord('Het logboek van deze lead is vol. Haal eerst een oude notitie weg.', 409)
    return foutAntwoord('Opslaan mislukt. Probeer het opnieuw.', 502)
  }
  return NextResponse.json(uit.waarde, { status: 201, headers: GEEN_CACHE })
}
