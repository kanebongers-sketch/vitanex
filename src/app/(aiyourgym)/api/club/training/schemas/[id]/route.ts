import { type NextRequest, NextResponse } from 'next/server'
import { medewerkerBestaat } from '@/lib/club/kern/medewerker'
import { clubFout, clubJson, logActie, vereisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { leesSchema } from '@/lib/club/training/invoer'
import { isRij } from '@/lib/club/training/rijen'
import { lidVestiging, oefeningenBestaan, vervangRegels } from '@/lib/club/training/schrijven'
import { isUuid } from '@/lib/club/training/typen'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'

// PUT    /api/club/training/schemas/[id]: het hele schema opslaan (kop en oefeningen).
// DELETE /api/club/training/schemas/[id]: schema of sjabloon verwijderen.
// Actief zetten wordt gelogd; een lid heeft maximaal een actief schema, het vorige
// actieve schema van de trainer gaat dan naar afgerond. Eigen schema's van het lid
// blijven staan; het net actief gezette schema is wel het schema dat het lid ziet.

type Params = { params: Promise<{ id: string }> }

async function huidigSchema(t: ClubToegang, id: string): Promise<{ lidId: string | null; status: string } | null> {
  const { data, error } = await t.admin.from('club_schemas').select('lid_id, status').eq('user_id', t.userId).eq('id', id).maybeSingle()
  if (error || !isRij(data)) return null
  return { lidId: typeof data.lid_id === 'string' ? data.lid_id : null, status: typeof data.status === 'string' ? data.status : '' }
}

async function rondAndereAf(t: ClubToegang, lidId: string, behalve: string): Promise<void> {
  const { error } = await t.admin
    .from('club_schemas')
    .update({ status: 'afgerond', bijgewerkt_op: new Date().toISOString() })
    .eq('user_id', t.userId)
    .eq('lid_id', lidId)
    .eq('status', 'actief')
    // Eigen schema's van het lid blijven naast dat van de trainer bestaan (migratie 472).
    .eq('maker', 'trainer')
    .neq('id', behalve)
  if (error) console.error('[club/training] vorige schema afronden mislukt', error.message)
}

/** Net actief gezet: dit schema ziet het lid nu in de app (ook naast een eigen schema). */
async function zetGekozen(t: ClubToegang, id: string): Promise<void> {
  const { error } = await t.admin.from('club_schemas').update({ actief_gekozen_op: new Date().toISOString() }).eq('user_id', t.userId).eq('id', id)
  if (error) console.error('[club/training] actief kiezen mislukt', error.message)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  const buiten = await eisVestigingVanRecord(t, 'club_schemas', id)
  if (buiten) return buiten
  if (!isUuid(id)) return clubFout('Onbekend schema.', 404)

  const body: unknown = await req.json().catch(() => null)
  const invoer = leesSchema(body)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const s = invoer.waarde

  const huidig = await huidigSchema(t, id)
  if (!huidig) return clubFout('Onbekend schema.', 404)
  if (!(await oefeningenBestaan(t.admin, t.userId, s.regels.map((r) => r.oefeningId)))) return clubFout('Een van de oefeningen bestaat niet meer.', 400)
  if (!(await medewerkerBestaat(t.admin, t.userId, s.medewerkerId))) return clubFout('Onbekende trainer.', 400)

  const { error } = await t.admin
    .from('club_schemas')
    .update({
      naam: s.naam, doel: s.doel, niveau: s.niveau, weken: s.weken, status: s.status, medewerker_id: s.medewerkerId,
      notitie: s.notitie, dag_titels: s.dagTitels, bijgewerkt_op: new Date().toISOString(),
    })
    .eq('user_id', t.userId)
    .eq('id', id)
  if (error) {
    console.error('[club/training] schema opslaan mislukt', error.message)
    return clubFout('Het schema kon niet worden opgeslagen.', 500)
  }
  if (!(await vervangRegels(t.admin, t.userId, id, s.regels))) return clubFout('De oefeningen konden niet worden opgeslagen.', 500)

  if (s.status === 'actief' && huidig.status !== 'actief' && huidig.lidId) {
    await rondAndereAf(t, huidig.lidId, id)
    await zetGekozen(t, id)
    await logActie(t, 'Schema actief gezet', s.naam, await lidVestiging(t.admin, t.userId, huidig.lidId))
  }
  return clubJson({ id })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  const buiten = await eisVestigingVanRecord(t, 'club_schemas', id)
  if (buiten) return buiten
  if (!isUuid(id)) return clubFout('Onbekend schema.', 404)

  const { data, error } = await t.admin.from('club_schemas').delete().eq('user_id', t.userId).eq('id', id).select('id')
  if (error) {
    console.error('[club/training] schema verwijderen mislukt', error.message)
    return clubFout('Het schema kon niet worden verwijderd.', 500)
  }
  if (!data || data.length === 0) return clubFout('Onbekend schema.', 404)
  return clubJson({ id })
}
