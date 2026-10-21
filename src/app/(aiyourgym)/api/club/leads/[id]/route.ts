// GET   /api/club/leads/[id]: de lead met historie (voor het zijpaneel).
// PATCH /api/club/leads/[id]: gegevens, medewerker, opvolgdatum of status
//       (nieuw, contact, proefles geweest, verloren met reden).

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { leesLeadPatch } from '@/lib/club/leads/invoer'
import { LEAD_STATUS_LABEL, type Lead } from '@/lib/club/leads/model'
import { haalHistorie, schrijfHistorie, werkLeadBij } from '@/lib/club/leads/data'
import { isGeldigeMedewerker, leadUitRoute, leesJson, medewerkerNaam, type LeadContext } from '@/lib/club/leads/api'

export async function GET(req: NextRequest, ctx: LeadContext) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const lead = await leadUitRoute(t, ctx, { ookGewist: true })
  if (lead instanceof NextResponse) return lead
  const historie = await haalHistorie(t.admin, t.userId, lead.id)
  if (!historie) return clubFout('De historie kon niet worden geladen.', 500)
  return clubJson({ lead, historie })
}

export async function PATCH(req: NextRequest, ctx: LeadContext) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const lead = await leadUitRoute(t, ctx)
  if (lead instanceof NextResponse) return lead

  const invoer = leesLeadPatch(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const patch = invoer.waarde
  if (patch.medewerker_id !== undefined && !(await isGeldigeMedewerker(t, lead.vestiging, patch.medewerker_id))) {
    return clubFout('Deze medewerker werkt niet in deze vestiging.', 400)
  }
  if (patch.status && lead.status === 'lid') return clubFout('Deze lead is al lid. Pas het lid aan in Leden of Sportivity.', 409)

  // Een proefles die nog stond, vervalt als de lead handmatig een andere kant op gaat.
  const extra = patch.status && patch.status !== 'proefles_geweest' && lead.status === 'proefles' ? { proefles_op: null, proefles_les_id: null } : {}
  const nieuw = await werkLeadBij(t.admin, t.userId, lead.id, { ...patch, ...extra })
  if (!nieuw) return clubFout('De wijziging kon niet worden opgeslagen. Probeer het opnieuw.', 500)

  await schrijfWijzigingen(t, lead, nieuw)
  return clubJson({ lead: nieuw })
}

async function schrijfWijzigingen(t: ClubToegang, oud: Lead, nieuw: Lead): Promise<void> {
  if (oud.status !== nieuw.status) {
    const reden = nieuw.status === 'verloren' && nieuw.verlorenReden ? ` Reden: ${nieuw.verlorenReden}` : ''
    const tekst = `Van ${LEAD_STATUS_LABEL[oud.status]} naar ${LEAD_STATUS_LABEL[nieuw.status]}.${reden}`
    await schrijfHistorie(t.admin, t.userId, nieuw.id, { soort: 'status', tekst, auteur: t.naam })
    await logActie(t, `lead naar ${LEAD_STATUS_LABEL[nieuw.status].toLowerCase()}`, nieuw.naam, nieuw.vestiging)
  }
  if (oud.medewerkerId !== nieuw.medewerkerId) {
    const naam = nieuw.medewerkerId ? await medewerkerNaam(t, nieuw.vestiging, nieuw.medewerkerId) : null
    const tekst = naam ? `Toegewezen aan ${naam}.` : 'Niet meer toegewezen.'
    await schrijfHistorie(t.admin, t.userId, nieuw.id, { soort: 'notitie', tekst, auteur: t.naam })
  }
}
