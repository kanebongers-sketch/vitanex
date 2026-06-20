import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/api-auth'

const GELDIGE_STEMMINGEN = ['moe', 'gestrest', 'ok', 'blij', 'energiek'] as const
type Stemming = (typeof GELDIGE_STEMMINGEN)[number]

function vandaagDatum(): string {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

// GET: laatste 7 mood_logs van de huidige user
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('mood_logs')
      .select('datum, stemming')
      .eq('user_id', user.id)
      .order('datum', { ascending: false })
      .limit(7)

    if (error) {
      return NextResponse.json({ error: `Ophalen mislukt: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ logs: data ?? [] })
  } catch (err) {
    console.error('[mood GET]', err)
    return NextResponse.json({ error: 'Er is een fout opgetreden.' }, { status: 500 })
  }
}

// POST: vandaag's stemming opslaan (upsert op user_id + datum)
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
    }

    const body = await req.json() as { stemming?: unknown }
    const stemming = body.stemming

    if (
      typeof stemming !== 'string' ||
      !GELDIGE_STEMMINGEN.includes(stemming as Stemming)
    ) {
      return NextResponse.json({ error: 'Ongeldige stemming.' }, { status: 400 })
    }

    const datum = vandaagDatum()
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('mood_logs')
      .upsert(
        { user_id: user.id, datum, stemming },
        { onConflict: 'user_id,datum' }
      )
      .select('datum, stemming')
      .single()

    if (error || !data) {
      console.error('[mood POST] Opslaan mislukt:', error?.message)
      return NextResponse.json(
        { error: 'Opslaan mislukt. Probeer opnieuw.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ log: data })
  } catch (err) {
    console.error('[mood POST]', err)
    return NextResponse.json({ error: 'Er is een fout opgetreden.' }, { status: 500 })
  }
}
