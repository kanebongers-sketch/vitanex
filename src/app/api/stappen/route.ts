import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

function vandaagNL(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(new Date())
}

/** GET /api/stappen — afgelopen 7 dagen stappen uit dagmetingen */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const admin = createAdminClient()
  const vandaag = vandaagNL()
  const zeveDagenGelden = new Date(Date.now() - 6 * 86_400_000)
  const startDatum = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(zeveDagenGelden)

  const { data, error } = await admin
    .from('dagmetingen')
    .select('datum, stappen')
    .eq('user_id', user.id)
    .gte('datum', startDatum)
    .lte('datum', vandaag)
    .order('datum', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ dagen: data ?? [] })
}

/** POST /api/stappen — sla manueel stappen op voor vandaag */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  let body: { stappen?: unknown; datum?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 }) }

  const stappen = Number(body.stappen)
  if (!Number.isFinite(stappen) || stappen < 0 || stappen > 200_000) {
    return NextResponse.json({ error: 'Ongeldig aantal stappen' }, { status: 400 })
  }

  const datum = typeof body.datum === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.datum)
    ? body.datum
    : vandaagNL()

  const admin = createAdminClient()
  const { error } = await admin
    .from('dagmetingen')
    .upsert(
      { user_id: user.id, datum, stappen: Math.round(stappen), bron: 'manueel' },
      { onConflict: 'user_id,datum' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, datum, stappen: Math.round(stappen) })
}
