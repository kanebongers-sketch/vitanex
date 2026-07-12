import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const limitRaw = parseInt(searchParams.get('limit') ?? '14')
  const limit = isNaN(limitRaw) ? 14 : Math.min(limitRaw, 30)

  try {
    const { data, error } = await admin
      .from('stemming_logs')
      .select('id, stemming, energie, emoji, notitie, aangemaakt_op')
      .eq('user_id', user.id)
      .order('aangemaakt_op', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[GET /api/stemming] DB error:', error.message)
      return NextResponse.json({ error: 'Ophalen mislukt. Probeer opnieuw.' }, { status: 500 })
    }

    return NextResponse.json({ logs: data ?? [] })
  } catch (err) {
    console.error('[GET /api/stemming] Onverwachte fout:', err)
    return NextResponse.json({ error: 'Interne serverfout.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  let body: { stemming: number; energie?: number; emoji?: string; notitie?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldig JSON verzoek.' }, { status: 400 })
  }

  const { stemming, energie, emoji, notitie } = body

  if (!Number.isInteger(stemming) || stemming < 1 || stemming > 5) {
    return NextResponse.json({ error: 'stemming moet een geheel getal zijn tussen 1 en 5.' }, { status: 400 })
  }

  if (energie !== undefined && (typeof energie !== 'number' || energie < 1 || energie > 5)) {
    return NextResponse.json({ error: 'energie moet een getal zijn tussen 1 en 5.' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    const { data, error } = await admin
      .from('stemming_logs')
      .insert({
        user_id: user.id,
        stemming,
        energie: energie ?? null,
        emoji: emoji ?? null,
        notitie: notitie?.trim() ?? null,
      })
      .select('id, stemming, energie, emoji, notitie, aangemaakt_op')
      .single()

    if (error) {
      console.error('[POST /api/stemming] DB error:', error.message)
      return NextResponse.json({ error: 'Opslaan mislukt. Probeer opnieuw.' }, { status: 500 })
    }

    return NextResponse.json({ log: data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/stemming] Onverwachte fout:', err)
    return NextResponse.json({ error: 'Interne serverfout.' }, { status: 500 })
  }
}
