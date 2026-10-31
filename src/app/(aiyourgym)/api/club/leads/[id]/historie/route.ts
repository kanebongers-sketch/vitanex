// POST /api/club/leads/[id]/historie: gebeld, gemaild of een notitie, en
// eventueel meteen de volgende opvolgdatum (null = opvolging afgerond).
// Eerste contact met een nieuwe lead zet hem vanzelf op "Contact".
// Bellen vraagt een uitkomst uit een vaste lijst (migratie 482), mailen mag.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { leesHistorie } from '@/lib/club/leads/invoer'
import { schrijfHistorie, werkLeadBij } from '@/lib/club/leads/data'
import { leadUitRoute, leesJson, type LeadContext } from '@/lib/club/leads/api'

export async function POST(req: NextRequest, ctx: LeadContext) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const lead = await leadUitRoute(t, ctx)
  if (lead instanceof NextResponse) return lead

  const invoer = leesHistorie(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const { soort, tekst, uitkomst, opvolgenOp } = invoer.waarde

  const opgeslagen = await schrijfHistorie(t.admin, t.userId, lead.id, { soort, tekst, uitkomst, auteur: t.naam })
  if (!opgeslagen) return clubFout('Dit kon niet worden opgeslagen. Probeer het opnieuw.', 500)

  const naarContact = lead.status === 'nieuw' && soort !== 'notitie'
  const velden: Record<string, unknown> = {}
  if (opvolgenOp !== undefined) velden.opvolgen_op = opvolgenOp
  if (naarContact) velden.status = 'contact'
  if (Object.keys(velden).length === 0) return clubJson({ lead }, 201)

  const nieuw = await werkLeadBij(t.admin, t.userId, lead.id, velden)
  if (!nieuw) return clubFout('Opgeslagen, maar de lead kon niet worden bijgewerkt.', 500)
  if (naarContact) {
    await schrijfHistorie(t.admin, t.userId, lead.id, { soort: 'status', tekst: 'Van Nieuw naar Contact.', auteur: t.naam })
    await logActie(t, 'lead naar contact', lead.naam, lead.vestiging)
  }
  return clubJson({ lead: nieuw }, 201)
}
