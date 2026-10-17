// PATCH /api/club/afspraken/[id]: status zetten (geweest, niet gekomen,
// geannuleerd, terug naar gepland), verplaatsen (datum, tijd, trainer) of de
// notitie wijzigen. Een per keer.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { nlNaarUtc } from '@/lib/club/rooster/tijd'
import { isUuid, leesAfspraakPatch, type AfspraakPatch } from '@/lib/club/afspraken/invoer'
import { haalAfspraak, haalType, werkAfspraakBij } from '@/lib/club/afspraken/opslag'
import { STATUS_LABEL, type Afspraak } from '@/lib/club/afspraken/model'
import { eindVan, magStatusZetten, magVerplaatsen } from '@/lib/club/afspraken/regels'
import { controleerTijd, leesJson } from '@/lib/club/afspraken/api'

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await ctx.params
  if (!isUuid(id)) return clubFout('Afspraak niet gevonden.', 404)
  const afspraak = await haalAfspraak(t.admin, t.userId, id)
  if (!afspraak) return clubFout('Afspraak niet gevonden.', 404)
  const invoer = leesAfspraakPatch(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const patch = await bouwPatch(t, afspraak, invoer.waarde)
  if (patch instanceof NextResponse) return patch
  const uit = await werkAfspraakBij(t.admin, t.userId, id, patch)
  if (!uit.ok) return clubFout(uit.fout, uit.status)
  const wat = invoer.waarde.soort === 'status' ? `afspraak: ${STATUS_LABEL[invoer.waarde.status].toLowerCase()}` : invoer.waarde.soort === 'verplaats' ? 'afspraak verplaatst' : 'afspraaknotitie gewijzigd'
  await logActie(t, wat, null, afspraak.vestiging)
  return clubJson({ afspraak: uit.waarde })
}

async function bouwPatch(t: ClubToegang, afspraak: Afspraak, p: AfspraakPatch): Promise<Record<string, unknown> | NextResponse> {
  const nu = new Date()
  if (p.soort === 'notitie') return { notitie: p.notitie }
  if (p.soort === 'status') {
    const mag = magStatusZetten(afspraak, p.status, nu)
    if (!mag.ok) return clubFout(mag.fout, 409)
    return { status: p.status, geannuleerd_op: p.status === 'geannuleerd' ? nu.toISOString() : null }
  }
  const mag = magVerplaatsen(afspraak)
  if (!mag.ok) return clubFout(mag.fout, 409)
  if (nlNaarUtc(p.datum, p.tijd).getTime() < nu.getTime()) return clubFout('Dit tijdstip is al voorbij.', 400)
  const type = await haalType(t.admin, t.userId, afspraak.typeId)
  if (!type) return clubFout('Het soort afspraak bestaat niet meer.', 409)
  const controle = await controleerTijd(t, {
    vestiging: afspraak.vestiging,
    type,
    datum: p.datum,
    tijd: p.tijd,
    medewerkerId: p.medewerkerId,
    vanaf: null,
    tot: null,
    negeerAfspraakId: afspraak.id,
  })
  if (!controle.ok) return clubFout(controle.fout, controle.status)
  const { eind, bezetTot } = eindVan(controle.start, type)
  return { medewerker_id: controle.medewerkerId, start_op: controle.start.toISOString(), eind_op: eind.toISOString(), bezet_tot: bezetTot.toISOString() }
}
