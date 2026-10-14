import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { haalIntake, haalOefeningen } from '@/lib/club/training/data'
import { isRij } from '@/lib/club/training/rijen'
import { maakSchema } from '@/lib/club/training/schrijven'
import { stelSchemaVoor } from '@/lib/club/training/voorstel'

// POST /api/club/training/voorstel { intakeId }: maak uit een intake een
// conceptschema (zonder AI). De trainer past het daarna aan in de editor.

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t

  const body: unknown = await req.json().catch(() => null)
  if (!isRij(body) || typeof body.intakeId !== 'string') return clubFout('Ongeldig verzoek.', 400)

  const [intake, oefeningen] = await Promise.all([haalIntake(t.admin, t.userId, body.intakeId), haalOefeningen(t.admin, t.userId)])
  if (!intake) return clubFout('Onbekende intake.', 404)
  if (!intake.antwoorden) return clubFout('Deze intake mist de antwoorden voor een voorstel.', 422)
  if (!oefeningen || oefeningen.length === 0) return clubFout('De oefeningenbibliotheek is nog leeg.', 422)

  const v = stelSchemaVoor(intake.antwoorden, oefeningen)
  const uit = await maakSchema(
    t.admin,
    t.userId,
    {
      lidId: intake.lidId,
      naam: v.naam,
      doel: v.doel,
      niveau: v.niveau,
      weken: v.weken,
      status: 'concept',
      medewerkerId: intake.medewerkerId,
      notitie: v.notitie,
      dagTitels: v.dagen.map((d) => d.titel),
    },
    v.dagen.flatMap((d) =>
      d.regels.map((r) => ({ dag: d.dag, oefeningId: r.oefeningId, sets: r.sets, herhalingen: r.herhalingen, gewichtKg: null, rustSec: r.rustSec, notitie: r.notitie })),
    ),
  )
  if (!uit.ok) return clubFout(uit.fout, 500)
  return clubJson({ id: uit.id }, 201)
}
