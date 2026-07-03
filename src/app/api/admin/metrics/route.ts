import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const DAG_MS = 24 * 60 * 60 * 1000

interface EventRij {
  user_id: string
  event: string
  aangemaakt_op: string
  meta: { melding?: string; pad?: string } | null
}

/**
 * Founder-metrics op basis van app_events (laatste 30 dagen): actieve
 * gebruikers, gebruik per feature, client-fouten en week-op-week terugkeer.
 * Alleen voor rol 'admin' — dit is bedrijfsoverstijgende data.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profiel } = await admin
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()
    if (profiel?.rol !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
    }

    const nu = Date.now()
    const start30d = new Date(nu - 30 * DAG_MS).toISOString()

    const [{ data: events, error: eventsFout }, { count: totaalGebruikers }] = await Promise.all([
      admin
        .from('app_events')
        .select('user_id, event, aangemaakt_op, meta')
        .gte('aangemaakt_op', start30d)
        .order('aangemaakt_op', { ascending: false })
        .limit(20_000),
      admin.from('profiles').select('id', { count: 'exact', head: true }),
    ])

    if (eventsFout) {
      console.error('[admin metrics]', eventsFout.message)
      return NextResponse.json({ error: 'Kon metrics niet laden.' }, { status: 500 })
    }

    const rijen = (events ?? []) as EventRij[]

    const uniekeSinds = (drempelMs: number): number => {
      const set = new Set<string>()
      for (const r of rijen) {
        if (new Date(r.aangemaakt_op).getTime() >= drempelMs) set.add(r.user_id)
      }
      return set.size
    }

    // Actieve gebruikers per dag, laatste 14 dagen (oud → nieuw).
    const perDag: { datum: string; actieven: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const dagStart = new Date(nu - i * DAG_MS)
      const datum = dagStart.toISOString().slice(0, 10)
      const set = new Set<string>()
      for (const r of rijen) {
        if (r.aangemaakt_op.slice(0, 10) === datum) set.add(r.user_id)
      }
      perDag.push({ datum, actieven: set.size })
    }

    const eventsPerType = new Map<string, number>()
    for (const r of rijen) {
      eventsPerType.set(r.event, (eventsPerType.get(r.event) ?? 0) + 1)
    }

    const fouten = rijen.filter((r) => r.event === 'client_error')

    // Week-op-week terugkeer: van de gebruikers die 8–14 dagen geleden actief
    // waren, welk deel was ook in de afgelopen 7 dagen actief?
    const vorigeWeek = new Set<string>()
    const dezeWeek = new Set<string>()
    for (const r of rijen) {
      const t = new Date(r.aangemaakt_op).getTime()
      if (t >= nu - 14 * DAG_MS && t < nu - 7 * DAG_MS) vorigeWeek.add(r.user_id)
      if (t >= nu - 7 * DAG_MS) dezeWeek.add(r.user_id)
    }
    const teruggekeerd = [...vorigeWeek].filter((id) => dezeWeek.has(id)).length
    const weekRetentiePct = vorigeWeek.size > 0
      ? Math.round((teruggekeerd / vorigeWeek.size) * 100)
      : null

    return NextResponse.json({
      totaalGebruikers: totaalGebruikers ?? 0,
      actievenVandaag: uniekeSinds(nu - DAG_MS),
      actieven7d: uniekeSinds(nu - 7 * DAG_MS),
      actieven30d: uniekeSinds(nu - 30 * DAG_MS),
      weekRetentiePct,
      perDag,
      eventsPerType: [...eventsPerType.entries()]
        .map(([event, aantal]) => ({ event, aantal }))
        .sort((a, b) => b.aantal - a.aantal),
      clientFouten: {
        aantal30d: fouten.length,
        recent: fouten.slice(0, 8).map((f) => ({
          wanneer: f.aangemaakt_op,
          melding: f.meta?.melding ?? 'onbekend',
          pad: f.meta?.pad ?? '',
        })),
      },
      meetVanaf: rijen.length > 0 ? rijen[rijen.length - 1].aangemaakt_op : null,
    })
  } catch (err) {
    console.error('[admin metrics]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Interne fout.' }, { status: 500 })
  }
}
