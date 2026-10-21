import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { GEEN_CACHE } from '@/lib/club/kern/verzoek'
import { leadUitRoute, type LeadContext } from '@/lib/club/leads/api'
import { bouwLeadExport, leadExportBestandsnaam } from '@/lib/club/leads/avg'
import { haalLeadExportRuw } from '@/lib/club/leads/avg-opslag'

// GET /api/club/leads/[id]/gegevens
// Inzage (AVG): alles wat Club over deze belangstellende bewaart, als JSON-download.
// Voor wie Leads mag (de poort regelt dat per rol) en alleen in de eigen vestigingen.
// Het logboek krijgt alleen dat er gedownload is, nooit de inhoud.

export async function GET(req: NextRequest, ctx: LeadContext) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const lead = await leadUitRoute(t, ctx, { ookGewist: true })
  if (lead instanceof NextResponse) return lead

  const uit = await haalLeadExportRuw(t.admin, t.userId, lead.id)
  if (!uit.ok) return clubFout(uit.fout === 'niet gevonden' ? 'Lead niet gevonden.' : 'De gegevens konden niet worden verzameld. Probeer het opnieuw.', uit.fout === 'niet gevonden' ? 404 : 500)

  const nu = new Date()
  const vestigingen = new Map(t.vestigingen.map((v) => [v.sleutel, v.naam]))
  const bestand = bouwLeadExport(uit.ruw, { sportschool: t.organisatie.naam, gemaaktOp: nu, vestigingen, medewerkers: uit.medewerkers })
  await logActie(t, 'Gegevens lead gedownload (AVG)', lead.naam, lead.vestiging)

  return new NextResponse(JSON.stringify(bestand, null, 2), {
    headers: {
      ...GEEN_CACHE,
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${leadExportBestandsnaam(lead.naam, nu)}"`,
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
