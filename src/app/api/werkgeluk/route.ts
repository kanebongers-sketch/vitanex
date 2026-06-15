import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

function vandaagDatum(): string {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const admin = createAdminClient()
    const vandaag = vandaagDatum()

    const dertigDagenGeleden = new Date()
    dertigDagenGeleden.setDate(dertigDagenGeleden.getDate() - 30)
    const grens = dertigDagenGeleden.toISOString().split('T')[0]

    const { data, error } = await admin
      .from('werkgeluk_logs')
      .select('score, notitie, datum')
      .eq('user_id', user.id)
      .gte('datum', grens)
      .order('datum', { ascending: false })
      .limit(31)

    if (error) {
      return NextResponse.json({ error: `Ophalen mislukt: ${error.message}` }, { status: 500 })
    }

    const logs = data ?? []
    const vandaagLog = logs.find(l => l.datum === vandaag)
    const geschiedenis = logs.map(l => ({ datum: l.datum, score: l.score }))

    const gemiddelde =
      logs.length > 0
        ? Math.round((logs.reduce((som, l) => som + l.score, 0) / logs.length) * 10) / 10
        : null

    return NextResponse.json({
      vandaag: vandaagLog ? { score: vandaagLog.score, notitie: vandaagLog.notitie ?? null } : null,
      geschiedenis,
      gemiddelde,
    })
  } catch (err) {
    console.error('[werkgeluk GET]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const body = await req.json() as { score?: unknown; notitie?: unknown }
    const score = body.score
    const notitie = typeof body.notitie === 'string' ? body.notitie.trim().slice(0, 500) : null

    if (!Number.isInteger(score) || (score as number) < 1 || (score as number) > 10) {
      return NextResponse.json({ error: 'Score moet een geheel getal zijn tussen 1 en 10.' }, { status: 400 })
    }

    const datum = vandaagDatum()
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('werkgeluk_logs')
      .upsert(
        { user_id: user.id, score, notitie, datum },
        { onConflict: 'user_id,datum' }
      )
      .select('datum, score, notitie')
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({ error: `Opslaan mislukt: ${error?.message}` }, { status: 500 })
    }

    return NextResponse.json({ log: data })
  } catch (err) {
    console.error('[werkgeluk POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
