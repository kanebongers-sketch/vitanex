// POST /api/sport/eigen-workout — sla een zelf samengestelde workout op.
//
// Schrijft een fitness_schemas-rij met ai_gegenereerd=false en actief=true, zodat
// de trainingslogger 'm meteen als actief schema oppikt. Mirrort de insert van de
// AI-generator (company_id uit het profiel, mag null voor consumenten).

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { bouwTrainingsdag, type GekozenOefening } from '@/lib/sport/eigen-workout'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Narrowt de ruwe body-oefeningen naar GekozenOefening; onbruikbare vallen weg. */
function leesOefeningen(ruw: unknown): GekozenOefening[] {
  if (!Array.isArray(ruw)) return []
  return ruw.filter(isObject).flatMap((o) => {
    const naam = typeof o.naam === 'string' ? o.naam : ''
    const sets = typeof o.sets === 'number' ? o.sets : 0
    if (naam.trim().length === 0 || sets <= 0) return []
    return [{
      naam,
      spiergroep: typeof o.spiergroep === 'string' ? o.spiergroep : null,
      sets,
      herhalingen: typeof o.herhalingen === 'string' ? o.herhalingen : '',
      rusttijd_sec: typeof o.rusttijd_sec === 'number' ? o.rusttijd_sec : undefined,
      heeft_gewicht: typeof o.heeft_gewicht === 'boolean' ? o.heeft_gewicht : undefined,
      uitvoering_tip: typeof o.uitvoering_tip === 'string' ? o.uitvoering_tip : undefined,
    }]
  })
}

export async function POST(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data: { user }, error: userError } = await admin.auth.getUser(authHeader.slice(7))
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await request.json().catch(() => null)
  if (!isObject(body)) {
    return NextResponse.json({ error: 'Ongeldige invoer' }, { status: 400 })
  }
  const naam = typeof body.naam === 'string' ? body.naam : ''
  const dag = bouwTrainingsdag(naam, leesOefeningen(body.oefeningen))
  if (dag === null) {
    return NextResponse.json({ error: 'Kies minstens één oefening.' }, { status: 400 })
  }

  // company_id uit het profiel (mag null); zelfde bron als de AI-generator.
  const { data: profiel } = await admin
    .from('profiles')
    .select('bedrijf_id')
    .eq('id', user.id)
    .maybeSingle()
  const bedrijfId = (profiel?.bedrijf_id as string | null | undefined) ?? null

  // Eén actief schema tegelijk: deactiveer de rest zodat de logger deze oppikt.
  await admin.from('fitness_schemas').update({ actief: false }).eq('user_id', user.id).eq('actief', true)

  const { error: insErr } = await admin.from('fitness_schemas').insert({
    user_id: user.id,
    company_id: bedrijfId,
    naam: dag.naam,
    doel: null,
    niveau: null,
    sessies_per_week: 1,
    schema_json: [dag],
    ai_gegenereerd: false,
    actief: true,
  })
  if (insErr) {
    return NextResponse.json({ error: 'Kon de workout niet opslaan.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
