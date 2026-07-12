import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { logCompletie } from '@/lib/coaching/taken-server'

// POST /api/coaching/taken/log { taak_id, gehaald?, notitie? }
// De KLANT vinkt een aan hem toegewezen taak voor vandaag af (of terug).
// `gehaald` defaultt op true. De helper verifieert dat de taak bij deze klant
// hoort en spiegelt de completie naar gewoonte_logs (streak/achievements).

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  let body: { taak_id?: string; gehaald?: boolean; notitie?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  if (!body.taak_id) {
    return NextResponse.json({ error: 'taak_id is verplicht.' }, { status: 400 })
  }

  const gehaald = body.gehaald ?? true
  const notitie = typeof body.notitie === 'string' ? body.notitie : null

  const admin = createAdminClient()
  const resultaat = await logCompletie(admin, user.id, body.taak_id, gehaald, notitie)
  if (!resultaat.ok) return NextResponse.json({ error: resultaat.fout }, { status: resultaat.status })

  return NextResponse.json({
    succes: true,
    vandaag_gehaald: resultaat.vandaag_gehaald,
    deze_week_gehaald: resultaat.deze_week_gehaald,
  })
}
