// POST /api/club/leads/[id]/proefles
//   { actie: 'les', lesId }            plek in een geplande, niet-volle les (komende 7 dagen)
//   { actie: 'tijdstip', tijdstip }    vrij tijdstip, bv. een rondleiding
//   { actie: 'geweest' }               na de proefles: is geweest (morgen nabellen)
//   { actie: 'niet_gekomen' }          na de proefles: terug naar Contact, vandaag nabellen

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { leesProefles, type ProeflesInvoer } from '@/lib/club/leads/invoer'
import { haalProeflesLessen, schrijfHistorie, werkLeadBij } from '@/lib/club/leads/data'
import { dagPlus, dagVan, toonMoment } from '@/lib/club/leads/regels'
import type { Lead } from '@/lib/club/leads/model'
import { leadUitRoute, leesJson, type LeadContext } from '@/lib/club/leads/api'

interface Stap {
  velden: Record<string, unknown>
  historie: string
  actie: string
}

type StapUitkomst = Stap | { fout: string; status: number }

async function bepaalStap(t: ClubToegang, lead: Lead, invoer: ProeflesInvoer, nu: Date): Promise<StapUitkomst> {
  if (invoer.actie === 'geweest' || invoer.actie === 'niet_gekomen') {
    if (lead.status !== 'proefles') return { fout: 'Deze lead heeft geen geplande proefles.', status: 409 }
    if (invoer.actie === 'geweest') {
      return { velden: { status: 'proefles_geweest', opvolgen_op: dagPlus(dagVan(nu), 1) }, historie: 'Proefles geweest.', actie: 'proefles geweest' }
    }
    const velden = { status: 'contact', proefles_op: null, proefles_les_id: null, opvolgen_op: dagVan(nu) }
    return { velden, historie: 'Niet gekomen op de proefles.', actie: 'proefles niet gekomen' }
  }
  if (lead.status === 'lid' || lead.status === 'verloren') return { fout: 'Zet de lead eerst terug in de pijplijn.', status: 409 }
  if (invoer.actie === 'tijdstip') {
    const extra = invoer.omschrijving ? ` (${invoer.omschrijving})` : ''
    const velden = { status: 'proefles', proefles_op: invoer.tijdstip, proefles_les_id: null, opvolgen_op: null }
    return { velden, historie: `Proefles ingepland op ${toonMoment(invoer.tijdstip)}${extra}.`, actie: 'proefles ingepland' }
  }
  const lessen = await haalProeflesLessen(t.admin, t.userId, lead.vestiging, nu)
  if (!lessen) return { fout: 'Het rooster kon niet worden geladen.', status: 500 }
  const les = lessen.find((l) => l.id === invoer.lesId)
  if (!les) return { fout: 'Deze les is vol of niet meer beschikbaar. Kies een andere.', status: 409 }
  const velden = { status: 'proefles', proefles_op: les.startOp, proefles_les_id: les.id, opvolgen_op: null }
  return { velden, historie: `Proefles ingepland: ${les.naam}, ${toonMoment(les.startOp)}.`, actie: 'proefles ingepland' }
}

export async function POST(req: NextRequest, ctx: LeadContext) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const lead = await leadUitRoute(t, ctx)
  if (lead instanceof NextResponse) return lead

  const nu = new Date()
  const invoer = leesProefles(await leesJson(req), nu)
  if (!invoer.ok) return clubFout(invoer.fout, 400)

  const stap = await bepaalStap(t, lead, invoer.waarde, nu)
  if ('fout' in stap) return clubFout(stap.fout, stap.status)

  const nieuw = await werkLeadBij(t.admin, t.userId, lead.id, { ...stap.velden, verloren_reden: null })
  if (!nieuw) return clubFout('De proefles kon niet worden opgeslagen. Probeer het opnieuw.', 500)
  await schrijfHistorie(t.admin, t.userId, lead.id, { soort: 'proefles', tekst: stap.historie, auteur: t.naam })
  await logActie(t, stap.actie, lead.naam, lead.vestiging)
  return clubJson({ lead: nieuw })
}
