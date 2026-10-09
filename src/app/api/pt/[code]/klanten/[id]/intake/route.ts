// PUT /api/pt/[code]/klanten/[id]/intake — het intakeformulier van een klant opslaan.
// Achter de pincode; alleen klanten van díe PT'er. Body: { antwoorden: {...} }.
// Een half ingevulde intake mag: ongeldige waarden vallen weg, tekst wordt ingekort.

import { NextResponse, type NextRequest } from 'next/server'
import { leesIntakeAntwoorden } from '@/lib/lifeos/pt-dashboard/intake'
import { bewaarIntake } from '@/lib/lifeos/pt-dashboard/dossier-opslag'
import { GEEN_CACHE, eisZelfdeOorsprong, foutAntwoord, isUuid, klantToegang } from '@/lib/lifeos/leads/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string; id: string }>
}

export async function PUT(req: NextRequest, ctx: Context) {
  // Mutaties alleen vanaf onze eigen pagina's (CSRF-vangrail naast SameSite=Lax).
  const vreemd = eisZelfdeOorsprong(req)
  if (vreemd) return vreemd
  const { code, id } = await ctx.params
  if (!isUuid(id)) return foutAntwoord('Klant bestaat niet.', 404)
  const r = await klantToegang(req, code, id)
  if (r instanceof NextResponse) return r
  const body: unknown = await req.json().catch(() => null)
  if (typeof body !== 'object' || body === null || !('antwoorden' in body)) return foutAntwoord('Ongeldige invoer.', 400)
  const antwoorden = leesIntakeAntwoorden((body as { antwoorden: unknown }).antwoorden)
  const uit = await bewaarIntake(r.admin, r.link, id, antwoorden)
  if (!uit.ok) return uit.reden === 'niet_gevonden' ? foutAntwoord('Klant bestaat niet.', 404) : foutAntwoord('Opslaan mislukt.', 502)
  return NextResponse.json(uit.waarde, { headers: GEEN_CACHE })
}
