// PATCH  /api/club/berichten/[id]: bewerken, vastpinnen of losmaken, nu stoppen.
// DELETE /api/club/berichten/[id]: definitief verwijderen (de pagina vraagt eerst om bevestiging).

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { isUuid } from '@/lib/club/kern/organisatie'
import { leesActie, leesBericht, stopVenster, type BerichtActie } from '@/lib/club/berichten/invoer'
import { BERICHT_KOLOMMEN, berichtUitRij, type Bericht } from '@/lib/club/berichten/model'
import { leesJsonBegrensd } from '@/lib/club/kern/body'

interface Context {
  params: Promise<{ id: string }>
}

type Wijziging = { ok: true; velden: Record<string, unknown>; log: string } | { ok: false; fout: string }

function wijzigingVoor(t: ClubToegang, actie: BerichtActie, huidig: Bericht, nu: Date): Wijziging {
  if (actie.actie === 'vastpinnen') return { ok: true, velden: { vastgepind: actie.vastgepind }, log: actie.vastgepind ? 'bericht vastgepind' : 'bericht losgemaakt' }
  if (actie.actie === 'stoppen') return { ok: true, velden: stopVenster(huidig.zichtbaarVan, nu), log: 'bericht gestopt' }
  const invoer = leesBericht(actie.body, t.vestigingen.map((v) => v.sleutel), nu)
  return invoer.ok ? { ok: true, velden: { ...invoer.waarde }, log: 'bericht bewerkt' } : { ok: false, fout: invoer.fout }
}

async function haalHuidig(t: ClubToegang, id: string): Promise<Bericht | null | 'fout'> {
  const { data, error } = await t.admin.from('club_berichten').select(BERICHT_KOLOMMEN).eq('id', id).eq('user_id', t.userId).maybeSingle()
  if (error) {
    console.error('[club/berichten] bericht lezen mislukt', error.message)
    return 'fout'
  }
  return berichtUitRij(data)
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await ctx.params
  if (!isUuid(id)) return clubFout('Bericht niet gevonden.', 404)
  const body = await leesJsonBegrensd(req, 32 * 1024)
  if (body === 'te-groot') return clubFout('Dit bericht is te groot.', 413)
  const actie = leesActie(body)
  if (!actie.ok) return clubFout(actie.fout, 400)

  const huidig = await haalHuidig(t, id)
  if (huidig === 'fout') return clubFout('Het bericht kon niet worden geladen. Probeer het opnieuw.', 500)
  if (!huidig) return clubFout('Bericht niet gevonden.', 404)
  const nu = new Date()
  if (actie.waarde.actie === 'stoppen' && huidig.zichtbaarTot !== null && Date.parse(huidig.zichtbaarTot) <= nu.getTime()) {
    return clubFout('Dit bericht is al verlopen.', 409)
  }
  const wijziging = wijzigingVoor(t, actie.waarde, huidig, nu)
  if (!wijziging.ok) return clubFout(wijziging.fout, 400)

  const { data, error } = await t.admin
    .from('club_berichten')
    .update({ ...wijziging.velden, bijgewerkt_op: nu.toISOString() })
    .eq('id', id)
    .eq('user_id', t.userId)
    .select(BERICHT_KOLOMMEN)
    .maybeSingle()
  if (error) {
    console.error('[club/berichten] bericht bijwerken mislukt', error.message)
    return clubFout('Opslaan mislukt. Probeer het opnieuw.', 500)
  }
  const bericht = berichtUitRij(data)
  if (!bericht) return clubFout('Bericht niet gevonden.', 404)
  await logActie(t, wijziging.log, bericht.titel, null)
  return clubJson({ bericht })
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await ctx.params
  if (!isUuid(id)) return clubFout('Bericht niet gevonden.', 404)
  const { data, error } = await t.admin.from('club_berichten').delete().eq('id', id).eq('user_id', t.userId).select('titel')
  if (error) {
    console.error('[club/berichten] bericht verwijderen mislukt', error.message)
    return clubFout('Verwijderen mislukt. Probeer het opnieuw.', 500)
  }
  const rij = (data ?? [])[0] as { titel: string } | undefined
  if (!rij) return clubFout('Bericht niet gevonden.', 404)
  await logActie(t, 'bericht verwijderd', rij.titel, null)
  return clubJson({ ok: true })
}
