// POST /api/club/leads: een nieuwe lead (balie of telefoon). Toestemming om
// contact op te nemen is verplicht (AVG); zonder vinkje geen lead.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { leesNieuweLead } from '@/lib/club/leads/invoer'
import { LEAD_BRON_LABEL, LEAD_KOLOMMEN, leadUitRij } from '@/lib/club/leads/model'
import { schrijfHistorie } from '@/lib/club/leads/data'
import { isGeldigeMedewerker, leesJson } from '@/lib/club/leads/api'

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t

  const invoer = leesNieuweLead(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const n = invoer.waarde
  if (!(await isGeldigeMedewerker(t, n.vestiging, n.medewerkerId))) return clubFout('Deze medewerker werkt niet in deze vestiging.', 400)

  const { data, error } = await t.admin
    .from('club_leads')
    .insert({
      user_id: t.userId,
      vestiging: n.vestiging,
      naam: n.naam,
      email: n.email,
      telefoon: n.telefoon,
      bron: n.bron,
      interesse: n.interesse,
      medewerker_id: n.medewerkerId,
      opvolgen_op: n.opvolgenOp,
      toestemming_contact: true,
      status: 'nieuw',
    })
    .select(LEAD_KOLOMMEN)
    .single()
  const lead = error ? null : leadUitRij(data)
  if (!lead) {
    console.error('[club/leads] lead aanmaken mislukt', error?.message)
    return clubFout('De lead kon niet worden opgeslagen. Probeer het opnieuw.', 500)
  }

  await schrijfHistorie(t.admin, t.userId, lead.id, {
    soort: 'status',
    tekst: `Lead aangemaakt via ${LEAD_BRON_LABEL[lead.bron].toLowerCase()}. Toestemming voor contact gegeven.`,
    auteur: t.naam,
  })
  await logActie(t, 'lead aangemaakt', lead.naam, lead.vestiging)
  return clubJson({ lead }, 201)
}
