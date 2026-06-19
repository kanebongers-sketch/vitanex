import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const admin = createAdminClient()
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '14'), 30)

    const { data } = await admin
      .from('slaap_logs')
      .select('id, datum, uren_slaap, kwaliteit, bedtijd, wektijd, notitie, aangemaakt_op')
      .eq('user_id', user.id)
      .order('datum', { ascending: false })
      .limit(limit)

    const gemiddeldUren = data?.length
      ? Math.round((data.reduce((s, l) => s + l.uren_slaap, 0) / data.length) * 10) / 10
      : null

    const metKwaliteit = data?.filter(l => l.kwaliteit) ?? []
    const gemiddeldKwaliteit = metKwaliteit.length
      ? Math.round((metKwaliteit.reduce((s, l) => s + (l.kwaliteit ?? 0), 0) / metKwaliteit.length) * 10) / 10
      : null

    return NextResponse.json(
      { logs: data ?? [], gemiddeld_uren: gemiddeldUren, gemiddeld_kwaliteit: gemiddeldKwaliteit },
      { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=30' } }
    )
  } catch (err) {
    console.error('[slaap GET]', err)
    return NextResponse.json({ error: 'Er is een fout opgetreden.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const body: {
      datum?: unknown
      uren_slaap?: unknown
      kwaliteit?: unknown
      bedtijd?: unknown
      wektijd?: unknown
      notitie?: unknown
    } = await req.json()

    const { datum, uren_slaap, kwaliteit, bedtijd, wektijd, notitie } = body

    if (
      typeof datum !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(datum) ||
      typeof uren_slaap !== 'number' ||
      uren_slaap < 0 ||
      uren_slaap > 24
    ) {
      return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('slaap_logs')
      .upsert({
        user_id: user.id,
        datum,
        uren_slaap,
        kwaliteit: typeof kwaliteit === 'number' ? kwaliteit : null,
        bedtijd: typeof bedtijd === 'string' ? bedtijd : null,
        wektijd: typeof wektijd === 'string' ? wektijd : null,
        notitie: typeof notitie === 'string' ? notitie.trim() : null,
      }, { onConflict: 'user_id,datum' })
      .select('id, datum, uren_slaap, kwaliteit, bedtijd, wektijd, notitie')
      .single()

    if (error) {
      console.error('[slaap POST] Opslaan mislukt:', error.message)
      return NextResponse.json({ error: 'Opslaan mislukt. Probeer opnieuw.' }, { status: 500 })
    }

    return NextResponse.json({ log: data }, { status: 201 })
  } catch (err) {
    console.error('[slaap POST]', err)
    return NextResponse.json({ error: 'Er is een fout opgetreden.' }, { status: 500 })
  }
}
