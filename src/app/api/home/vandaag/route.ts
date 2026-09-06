// GET /api/home/vandaag — wat heb je vandaag al gelogd?
//
// Voedt de "Te doen vandaag"-sectie op de home: per leefgebied of er vandaag
// (NL-tijd) al een log is. Eerlijk en concreet — het dashboard weet zo wat je nog
// kunt doen i.p.v. alleen een score te tonen. Puur lezen; geen zij-effecten.

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { vandaagNL, dagstartUtcNL } from '@/lib/utils/date-nl'

export const dynamic = 'force-dynamic'

/** True als de (al gefilterde) count-query ≥1 rij oplevert. */
async function heeftRij(query: PromiseLike<{ count: number | null }>): Promise<boolean> {
  const { count } = await query
  return (count ?? 0) > 0
}

export interface VandaagStatus {
  /** Stemming + energie samen ("hoe voel je je?"). */
  gevoel: boolean
  stress: boolean
  slaap: boolean
  beweging: boolean
  voeding: boolean
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const db = createAdminClient()
  const vandaag = vandaagNL()
  const dagstart = dagstartUtcNL()
  const uid = user.id

  /** Bestaat er vandaag (op `datum`) een rij in deze tabel? */
  const opDatum = (tabel: string) =>
    heeftRij(db.from(tabel).select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('datum', vandaag))

  const [gevoel, stress, slaap, stappenDag, stappenNative, voeding, water] = await Promise.all([
    opDatum('stemming_logs'),
    heeftRij(db.from('stress_logs').select('*', { count: 'exact', head: true }).eq('user_id', uid).gte('aangemaakt_op', dagstart)),
    opDatum('slaap_logs'),
    opDatum('dagmetingen'),
    opDatum('health_native_logs'),
    opDatum('voeding_logs'),
    opDatum('water_logs'),
  ])

  const status: VandaagStatus = {
    gevoel,
    stress,
    slaap,
    beweging: stappenDag || stappenNative,
    voeding: voeding || water,
  }
  return NextResponse.json(status, { headers: { 'Cache-Control': 'private, no-store' } })
}
