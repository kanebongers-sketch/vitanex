// GET  /api/club/leads/[id]/omzetten: mogelijke dubbele leden (zelfde e-mail of
//      telefoon in deze vestiging), zodat het paneel vooraf kan waarschuwen.
// POST /api/club/leads/[id]/omzetten: maak een proeflid in club_leden of koppel
//      aan een bestaand lid. Inschrijving en abonnement gaan daarna in Sportivity.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { haalLid } from '@/lib/club/gedeeld/lid'
import { leesOmzetten } from '@/lib/club/leads/invoer'
import { splitsNaam } from '@/lib/club/leads/naam'
import { dagVan } from '@/lib/club/leads/regels'
import type { Lead } from '@/lib/club/leads/model'
import { schrijfHistorie, werkLeadBij, zoekDubbeleLeden } from '@/lib/club/leads/data'
import { leadUitRoute, leesJson, type LeadContext } from '@/lib/club/leads/api'

const SPORTIVITY = 'Inschrijving en abonnement afronden in Sportivity.'

export async function GET(req: NextRequest, ctx: LeadContext) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const lead = await leadUitRoute(t, ctx)
  if (lead instanceof NextResponse) return lead
  const dubbelen = await zoekDubbeleLeden(t.admin, t.userId, lead.vestiging, lead)
  if (!dubbelen) return clubFout('Kon niet controleren op dubbele leden.', 500)
  return clubJson({ dubbelen })
}

async function koppel(t: ClubToegang, lead: Lead, lidId: string, historie: string): Promise<NextResponse> {
  const nieuw = await werkLeadBij(t.admin, t.userId, lead.id, { status: 'lid', lid_id: lidId, opvolgen_op: null, verloren_reden: null })
  if (!nieuw) return clubFout('De lead kon niet worden bijgewerkt. Probeer het opnieuw.', 500)
  await schrijfHistorie(t.admin, t.userId, lead.id, { soort: 'status', tekst: `${historie} ${SPORTIVITY}`, auteur: t.naam })
  await logActie(t, 'lead omgezet naar lid', lead.naam, lead.vestiging)
  return clubJson({ lead: nieuw, lidId, melding: SPORTIVITY })
}

async function maakLid(t: ClubToegang, lead: Lead, nu: Date): Promise<{ id: string } | { fout: string; status: number }> {
  const { voornaam, achternaam } = splitsNaam(lead.naam)
  if (!achternaam) return { fout: 'Vul bij de lead ook een achternaam in, dan kan het lid worden aangemaakt.', status: 400 }
  const { data, error } = await t.admin
    .from('club_leden')
    .insert({
      user_id: t.userId,
      vestiging: lead.vestiging,
      voornaam: voornaam.slice(0, 60),
      achternaam: achternaam.slice(0, 80),
      email: lead.email,
      telefoon: lead.telefoon,
      status: 'proef',
      lid_sinds: dagVan(nu),
      // Een demolead wordt een demolid, zodat opruimen van de demodata alles meeneemt.
      demo: lead.demo,
    })
    .select('id')
    .single()
  if (error || typeof data?.id !== 'string') {
    console.error('[club/leads] lid aanmaken mislukt', error?.message)
    return { fout: 'Het lid kon niet worden aangemaakt. Probeer het opnieuw.', status: 500 }
  }
  return { id: data.id }
}

export async function POST(req: NextRequest, ctx: LeadContext) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const lead = await leadUitRoute(t, ctx)
  if (lead instanceof NextResponse) return lead
  if (lead.lidId) return clubFout('Deze lead is al aan een lid gekoppeld.', 409)

  const invoer = leesOmzetten(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)

  if (invoer.waarde.bestaandLidId) {
    const lid = await haalLid(t.admin, t.userId, invoer.waarde.bestaandLidId)
    if (!lid || lid.vestiging !== lead.vestiging) return clubFout('Dit lid bestaat niet in deze vestiging.', 404)
    return koppel(t, lead, lid.id, `Gekoppeld aan bestaand lid ${lid.voornaam} ${lid.achternaam}.`)
  }

  if (!invoer.waarde.negeerDubbel) {
    const dubbelen = await zoekDubbeleLeden(t.admin, t.userId, lead.vestiging, lead)
    if (!dubbelen) return clubFout('Kon niet controleren op dubbele leden.', 500)
    if (dubbelen.length > 0) return clubJson({ fout: 'Er is al een lid met dit e-mailadres of telefoonnummer.', dubbelen }, 409)
  }

  const lid = await maakLid(t, lead, new Date())
  if ('fout' in lid) return clubFout(lid.fout, lid.status)
  const antwoord = await koppel(t, lead, lid.id, 'Lid gemaakt (status proeflid).')
  // Lukt het koppelen niet, dan halen we het net gemaakte lid weg: geen losse dubbele kaart.
  if (antwoord.status >= 400) await t.admin.from('club_leden').delete().eq('user_id', t.userId).eq('id', lid.id)
  return antwoord
}
