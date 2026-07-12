import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { slaDagMetingenOp } from '@/lib/health/health-sync-server'
import { isGeldigeDagMeting, type DagMeting, type HealthBron } from '@/lib/health/health-data'

const NATIVE_BRONNEN: HealthBron[] = ['health_connect', 'apple_health']
const MAX_DAGEN = 31

/**
 * Ontvangt dagmetingen uit de native app (Health Connect op Android,
 * Apple Health op iOS) en slaat ze idempotent op voor de ingelogde gebruiker.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  let body: { bron?: string; dagen?: unknown[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  if (!NATIVE_BRONNEN.includes(body.bron as HealthBron)) {
    return NextResponse.json({ error: 'Onbekende bron' }, { status: 400 })
  }
  if (!Array.isArray(body.dagen) || body.dagen.length === 0 || body.dagen.length > MAX_DAGEN) {
    return NextResponse.json({ error: `dagen moet 1 t/m ${MAX_DAGEN} metingen bevatten` }, { status: 400 })
  }
  if (!body.dagen.every(isGeldigeDagMeting)) {
    return NextResponse.json({ error: 'Eén of meer metingen zijn ongeldig' }, { status: 400 })
  }

  try {
    const admin = createAdminClient()
    const { opgeslagen } = await slaDagMetingenOp(admin, user.id, body.bron as string, body.dagen as DagMeting[])
    return NextResponse.json({ ok: true, opgeslagen })
  } catch (err) {
    console.error('[health/sync]', err)
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 })
  }
}
