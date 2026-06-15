import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

interface StemmingLog {
  id: string
  stemming: number
  aangemaakt_op: string
}

interface DagGroep {
  datum: string
  stemming: number
  count: number
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()

  const negentigDagenGeleden = new Date()
  negentigDagenGeleden.setDate(negentigDagenGeleden.getDate() - 89)
  negentigDagenGeleden.setHours(0, 0, 0, 0)

  const { data, error } = await admin
    .from('stemming_logs')
    .select('id, stemming, aangemaakt_op')
    .eq('user_id', user.id)
    .gte('aangemaakt_op', negentigDagenGeleden.toISOString())
    .order('aangemaakt_op', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const logs = (data ?? []) as StemmingLog[]

  const perDag = new Map<string, { som: number; count: number }>()
  for (const log of logs) {
    const datum = log.aangemaakt_op.slice(0, 10)
    const bestaand = perDag.get(datum) ?? { som: 0, count: 0 }
    perDag.set(datum, { som: bestaand.som + log.stemming, count: bestaand.count + 1 })
  }

  const gegroepeerd: DagGroep[] = Array.from(perDag.entries()).map(([datum, val]) => ({
    datum,
    stemming: Math.round((val.som / val.count) * 10) / 10,
    count: val.count,
  }))

  return NextResponse.json({ logs: gegroepeerd })
}
