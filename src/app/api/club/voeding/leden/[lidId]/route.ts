import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { isUuid } from '@/lib/club/rooster/invoer'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { leesPlan } from '@/lib/club/voeding/invoer'
import { haalEigenLid, haalPlan } from '@/lib/club/voeding/lezen'
import { bewaarPlan, verwijderPlan } from '@/lib/club/voeding/opslag'

// GET    /api/club/voeding/leden/[lidId]  het plan van een lid (of { plan: null })
// POST   /api/club/voeding/leden/[lidId]  (opslaan, nieuw of bestaand) { kcal, eiwitG, koolhydratenG, vetG, doel, adviezen, maaltijden, notitie, berekening, sjabloonId }
// DELETE /api/club/voeding/leden/[lidId]  het plan weghalen
// Het lid moet bij deze sportschool horen, in een van haar eigen vestigingen.

const MAX_BODY = 32 * 1024
const GEEN_LID = 'Dit lid bestaat niet.'

type Ctx = { params: Promise<{ lidId: string }> }

async function lidUit(req: NextRequest, ctx: Ctx) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return { fout: t }
  const { lidId } = await ctx.params
  const lid = isUuid(lidId) ? await haalEigenLid(t.admin, t.userId, t.vestigingen, lidId) : null
  return lid ? { t, lid } : { fout: clubFout(GEEN_LID, 404) }
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const r = await lidUit(req, ctx)
  if ('fout' in r) return r.fout
  const plan = await haalPlan(r.t.admin, r.t.userId, r.lid.id)
  if (plan === null) return clubFout('Het voedingsplan kon niet worden geladen.', 500)
  return clubJson({ plan: plan ?? null })
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const r = await lidUit(req, ctx)
  if ('fout' in r) return r.fout
  const body = await leesJsonBegrensd(req, MAX_BODY)
  if (body === 'te-groot') return clubFout('Het plan is te groot.', 413)
  const invoer = leesPlan(body)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await bewaarPlan(r.t, r.lid, invoer.waarde))
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const r = await lidUit(req, ctx)
  if ('fout' in r) return r.fout
  return alsAntwoord(await verwijderPlan(r.t, r.lid))
}
