// POST /api/sport/cardio — log handmatig een cardio-sessie.
// Schrijft met de admin-client op naam van de ingelogde gebruiker (uit het token).
// Later kan hier ook 'strava'/'apple_health'/'google_health' als bron binnenkomen.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const DATUM = /^\d{4}-\d{2}-\d{2}$/

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Getal binnen bereik of null; iets buiten bereik → 'ongeldig'. */
function inBereik(v: unknown, min: number, max: number): number | null | 'ongeldig' {
  if (v === null || v === undefined) return null
  if (typeof v !== 'number' || !Number.isFinite(v)) return 'ongeldig'
  return v >= min && v <= max ? Math.round(v) : 'ongeldig'
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

  const soort = typeof body.soort === 'string' ? body.soort.trim() : ''
  if (soort.length === 0 || soort.length > 40) {
    return NextResponse.json({ error: 'Kies een soort cardio.' }, { status: 400 })
  }
  const datum = typeof body.datum === 'string' && DATUM.test(body.datum) ? body.datum : new Date().toISOString().slice(0, 10)

  const duur = inBereik(body.duurMinuten, 1, 1440)
  const afstand = inBereik(body.afstandMeter, 0, 1_000_000)
  const hartslag = inBereik(body.gemHartslag, 30, 250)
  const rpe = inBereik(body.rpe, 1, 10)
  if (duur === 'ongeldig' || afstand === 'ongeldig' || hartslag === 'ongeldig' || rpe === 'ongeldig') {
    return NextResponse.json({ error: 'Een van de waarden valt buiten bereik.' }, { status: 400 })
  }
  const notitie = typeof body.notitie === 'string' && body.notitie.trim().length > 0 ? body.notitie.trim().slice(0, 1000) : null

  const { error: insErr } = await admin.from('cardio_sessies').insert({
    user_id: user.id,
    datum,
    soort,
    duur_minuten: duur,
    afstand_meter: afstand,
    gem_hartslag: hartslag,
    rpe,
    notitie,
    bron: 'handmatig',
  })
  if (insErr) {
    return NextResponse.json({ error: 'Kon de cardio niet opslaan.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
