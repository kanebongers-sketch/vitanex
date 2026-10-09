// PUT    /api/pt/[code]/klanten/[id] — klant/abonnement bijwerken (bv. opzeggen, bevriezen).
// DELETE /api/pt/[code]/klanten/[id] — verwijderen (verkeerd ingevoerd).
// Achter de pincode; alleen klanten van díe PT'er — of, voor de beheerder, van het
// hele team (met `trainerId` in de body verplaatst hij de klant naar een andere trainer).

import { NextResponse, type NextRequest } from 'next/server'
import { leesKlantInvoer, zonderPrijs } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { verplaatsKlant, verwijderKlant, wijzigKlant } from '@/lib/lifeos/pt-dashboard/klanten-opslag'
import { crmKlantInactief, synchroniseerMetCrm } from '@/lib/lifeos/pt-dashboard/crm-sync'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'
import { GEEN_CACHE, eisZelfdeOorsprong, foutAntwoord, isUuid, klantToegang, verplaatsNaar } from '@/lib/lifeos/leads/toegang'

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
  const invoer = leesKlantInvoer(body)
  if (!invoer.ok) return foutAntwoord(invoer.fout, 400)
  // Alleen de beheerder zet een afwijkende prijs; van een PT'er telt die nooit mee.
  if (!r.beheerderId) delete invoer.waarde.prijsAfwijkend
  const uit = await wijzigKlant(r.admin, r.link, id, invoer.waarde)
  if (!uit.ok) return uit.reden === 'niet_gevonden' ? foutAntwoord('Klant bestaat niet.', 404) : foutAntwoord('Opslaan mislukt.', 502)
  const naar = await verplaatsNaar(r, typeof body === 'object' && body !== null ? (body as Record<string, unknown>).trainerId : undefined)
  if (naar) {
    const verplaatst = await verplaatsKlant(r.admin, r.link, id, naar)
    if (!verplaatst.ok) return foutAntwoord('Opgeslagen, maar verplaatsen naar de andere trainer mislukte.', 502)
  }
  // Kane's eigen klanten lopen mee in zijn CRM-planning (best effort).
  if (r.beheerderId) await synchroniseerMetCrm(r.admin, r.link.userId, r.beheerderId, uit.waarde, dagSleutelNl(new Date())).catch(() => undefined)
  return NextResponse.json(r.beheerderId ? uit.waarde : zonderPrijs(uit.waarde), { headers: GEEN_CACHE })
}

export async function DELETE(req: NextRequest, ctx: Context) {
  // Mutaties alleen vanaf onze eigen pagina's (CSRF-vangrail naast SameSite=Lax).
  const vreemd = eisZelfdeOorsprong(req)
  if (vreemd) return vreemd
  const { code, id } = await ctx.params
  if (!isUuid(id)) return foutAntwoord('Klant bestaat niet.', 404)
  const r = await klantToegang(req, code, id)
  if (r instanceof NextResponse) return r
  const { data: koppeling } = r.beheerderId
    ? await r.admin.from('pt_klanten').select('crm_persoon_id').eq('id', id).eq('user_id', r.link.userId).maybeSingle()
    : { data: null }
  const uit = await verwijderKlant(r.admin, r.link, id)
  if (!uit.ok) return uit.reden === 'niet_gevonden' ? foutAntwoord('Klant bestaat niet.', 404) : foutAntwoord('Verwijderen mislukt.', 502)
  await crmKlantInactief(r.admin, r.link.userId, (koppeling?.crm_persoon_id as string | null) ?? null).catch(() => undefined)
  return new Response(null, { status: 204, headers: GEEN_CACHE })
}
