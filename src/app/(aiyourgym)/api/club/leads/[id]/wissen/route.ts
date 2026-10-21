import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { leadUitRoute, leesJson, type LeadContext } from '@/lib/club/leads/api'
import { LEAD_AL_GEWIST, leadNaamKlopt, magLeadWissen, wisBlokkade } from '@/lib/club/leads/avg'
import { wisLead } from '@/lib/club/leads/avg-opslag'

// POST /api/club/leads/[id]/wissen  { bevestiging: "<naam van de lead>" }
// Wissen (AVG): naam, contact, interesse, reden, historie en afspraaknotities
// gaan weg; status, bron en datums blijven voor de cijfers. Direct en
// onomkeerbaar. Alleen Kane, de eigenaar en de clubmanager; anderen een 404.
// De database schrijft zelf een logregel zonder naam (migratie 449).

export async function POST(req: NextRequest, ctx: LeadContext) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  if (!magLeadWissen(t)) return clubFout('Niet gevonden.', 404)
  const lead = await leadUitRoute(t, ctx, { ookGewist: true })
  if (lead instanceof NextResponse) return lead

  const blokkade = wisBlokkade(lead)
  if (blokkade) return clubFout(blokkade, 409)
  const body = await leesJson(req)
  const bevestiging = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).bevestiging : null
  if (!leadNaamKlopt(bevestiging, lead.naam)) return clubFout(`Typ de naam "${lead.naam}" om te bevestigen.`, 400)

  const gewist = await wisLead(t.admin, t.userId, lead.id, t.naam, new Date())
  if (gewist === null) return clubFout('Wissen lukte niet. Probeer het opnieuw.', 500)
  if (!gewist) return clubFout(LEAD_AL_GEWIST, 409)
  return clubJson({ ok: true })
}
