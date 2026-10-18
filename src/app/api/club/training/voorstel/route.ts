import { type NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { coachingVoor } from '@/lib/club/training/coaching'
import { haalIntake, haalOefeningen } from '@/lib/club/training/data'
import { isRij } from '@/lib/club/training/rijen'
import { GEEN_EXTRA } from '@/lib/club/training/invoer'
import { maakSchema } from '@/lib/club/training/schrijven'
import { stelSchemaVoor } from '@/lib/club/training/voorstel'

// POST /api/club/training/voorstel { intakeId }: maak uit een intake een
// conceptschema met vaste regels (zie voorstel-regels.ts). Alleen oefeningen
// met coaching (standaard of van de sportschool). De trainer past het daarna
// aan in de editor; "Waarom dit schema" staat in de notitie.

/** Ids van oefeningen met eigen coaching van de sportschool. Bij een leesfout: leeg (dan telt de standaardcoaching). */
async function eigenCoachingIds(admin: SupabaseClient, userId: string): Promise<Set<string>> {
  const { data, error } = await admin.from('club_oefeningen').select('id').eq('user_id', userId).not('coaching', 'is', null).limit(1000)
  if (error) console.error('[club/training] eigen coaching lezen mislukt', error.message)
  return new Set((data ?? []).map((r) => (isRij(r) && typeof r.id === 'string' ? r.id : '')).filter(Boolean))
}

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t

  const body: unknown = await req.json().catch(() => null)
  if (!isRij(body) || typeof body.intakeId !== 'string') return clubFout('Ongeldig verzoek.', 400)

  const [intake, oefeningen, eigen] = await Promise.all([
    haalIntake(t.admin, t.userId, body.intakeId),
    haalOefeningen(t.admin, t.userId),
    eigenCoachingIds(t.admin, t.userId),
  ])
  if (!intake) return clubFout('Onbekende intake.', 404)
  if (!intake.antwoorden) return clubFout('Deze intake mist de antwoorden voor een voorstel.', 422)
  if (!oefeningen || oefeningen.length === 0) return clubFout('De oefeningenbibliotheek is nog leeg.', 422)

  const v = stelSchemaVoor(intake.antwoorden, oefeningen, { heeftCoaching: (o) => eigen.has(o.id) || coachingVoor(o.naam) !== null })
  if (v.dagen.every((d) => d.regels.length === 0)) return clubFout('Er zijn geen passende oefeningen met coaching voor dit lid.', 422)
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
      d.regels.map((r) => ({
        dag: d.dag, oefeningId: r.oefeningId, sets: r.sets, herhalingen: r.herhalingen, gewichtKg: null, rustSec: r.rustSec, notitie: r.notitie, ...GEEN_EXTRA, rir: r.rir,
      })),
    ),
  )
  if (!uit.ok) return clubFout(uit.fout, 500)
  return clubJson({ id: uit.id, waarom: v.waarom }, 201)
}
