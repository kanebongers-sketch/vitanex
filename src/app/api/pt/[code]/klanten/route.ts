// POST /api/pt/[code]/klanten — een PT-klant met abonnement vastleggen (achter de pincode).
// De beheerder kiest de trainer (`trainerId` in de body); een eigenaar mag niet.

import { NextResponse, type NextRequest } from 'next/server'
import { leesKlantInvoer, zonderPrijs } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { voegKlantToe } from '@/lib/lifeos/pt-dashboard/klanten-opslag'
import { synchroniseerMetCrm } from '@/lib/lifeos/pt-dashboard/crm-sync'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'
import { GEEN_CACHE, foutAntwoord, nieuwToegang } from '@/lib/lifeos/leads/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  const { code } = await ctx.params
  const body: unknown = await req.json().catch(() => null)
  const trainerId = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).trainerId : undefined
  const r = await nieuwToegang(req, code, trainerId)
  if (r instanceof NextResponse) return r
  const invoer = leesKlantInvoer(body)
  if (!invoer.ok) return foutAntwoord(invoer.fout, 400)
  // Alleen de beheerder zet een afwijkende prijs; van een PT'er telt die nooit mee.
  if (!r.beheerderId) delete invoer.waarde.prijsAfwijkend
  const uit = await voegKlantToe(r.admin, r.link, invoer.waarde)
  if (!uit.ok) {
    return uit.reden === 'te_veel'
      ? foutAntwoord('Even rustig aan: te veel nieuwe klanten in het afgelopen uur. Probeer het straks opnieuw.', 429)
      : foutAntwoord('Opslaan mislukt. Probeer het opnieuw.', 502)
  }
  // Kane's eigen klant → ook in zijn CRM-planning (best effort).
  if (r.beheerderId) await synchroniseerMetCrm(r.admin, r.link.userId, r.beheerderId, uit.waarde, dagSleutelNl(new Date())).catch(() => undefined)
  return NextResponse.json(r.beheerderId ? uit.waarde : zonderPrijs(uit.waarde), { status: 201, headers: GEEN_CACHE })
}
