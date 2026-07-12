import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { isCoach } from '@/lib/coaching/server'
import {
  coachBeheertKlant,
  getTrajectVoorKlant,
  maakOfVervangTraject,
  updateTrajectVeld,
} from '@/lib/coaching/traject-server'
import type { TrajectInvoer, TrajectStatus } from '@/lib/coaching/traject'

// GET   /api/coaching/traject?klant=<id>  → coach: traject + fases van één klant
// POST  /api/coaching/traject             → coach: maakt/vervangt traject met fases
// PATCH /api/coaching/traject             → coach: werkt status/titel/doel bij

type Admin = ReturnType<typeof createAdminClient>

/** Auth + coach-rol in één stap. Geeft de admin-client + user terug, of een fout-response. */
async function vereisCoach(req: NextRequest): Promise<
  { admin: Admin; userId: string } | { fout: NextResponse }
> {
  const user = await getAuthenticatedUser(req)
  if (!user) return { fout: NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 }) }
  const admin = createAdminClient()
  if (!(await isCoach(admin, user.id))) {
    return { fout: NextResponse.json({ error: 'Geen toegang.' }, { status: 403 }) }
  }
  return { admin, userId: user.id }
}

export async function GET(req: NextRequest) {
  const ctx = await vereisCoach(req)
  if ('fout' in ctx) return ctx.fout

  const klantId = req.nextUrl.searchParams.get('klant')
  if (!klantId) return NextResponse.json({ error: 'Parameter "klant" ontbreekt.' }, { status: 400 })

  if (!(await coachBeheertKlant(ctx.admin, ctx.userId, klantId))) {
    return NextResponse.json({ error: 'Klant niet gevonden.' }, { status: 404 })
  }

  const traject = await getTrajectVoorKlant(ctx.admin, ctx.userId, klantId)
  return NextResponse.json({ traject })
}

export async function POST(req: NextRequest) {
  const ctx = await vereisCoach(req)
  if ('fout' in ctx) return ctx.fout

  let body: { klant_id?: string } & Partial<TrajectInvoer>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }
  if (!body.klant_id) return NextResponse.json({ error: 'klant_id ontbreekt.' }, { status: 400 })

  const invoer: TrajectInvoer = {
    titel: body.titel ?? '',
    doel: body.doel ?? null,
    start_datum: body.start_datum,
    duur_maanden: body.duur_maanden,
    status: body.status,
    fases: body.fases ?? [],
  }

  const resultaat = await maakOfVervangTraject(ctx.admin, ctx.userId, body.klant_id, invoer)
  if (!resultaat.ok) return NextResponse.json({ error: resultaat.fout }, { status: resultaat.status })
  return NextResponse.json({ traject: resultaat.traject })
}

export async function PATCH(req: NextRequest) {
  const ctx = await vereisCoach(req)
  if ('fout' in ctx) return ctx.fout

  let body: { klant_id?: string; status?: TrajectStatus; titel?: string; doel?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }
  if (!body.klant_id) return NextResponse.json({ error: 'klant_id ontbreekt.' }, { status: 400 })

  const resultaat = await updateTrajectVeld(ctx.admin, ctx.userId, body.klant_id, {
    status: body.status,
    titel: body.titel,
    doel: body.doel,
  })
  if (!resultaat.ok) return NextResponse.json({ error: resultaat.fout }, { status: resultaat.status })
  return NextResponse.json({ traject: resultaat.traject })
}
