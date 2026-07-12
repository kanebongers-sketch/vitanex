import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { slaDagMetingenOp } from '@/lib/health/health-sync-server'
import { datumInNL } from '@/lib/health/health-data'
import {
  combineerDagMetingen, parseFitAggregaten, parseFitSlaapSessies,
  type FitAggregateRespons, type FitSessie,
} from '@/lib/health/google-fit-parser'

const SYNC_DAGEN = 14

async function vernieuwToken(refreshToken: string, userId: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_FIT_CLIENT_ID!,
      client_secret: process.env.GOOGLE_FIT_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) return null
  const tokens = await res.json() as { access_token: string; expires_in?: number }

  const admin = createAdminClient()
  await admin.from('wearable_tokens').update({
    access_token: tokens.access_token,
    expires_at: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
    bijgewerkt_op: new Date().toISOString(),
  }).eq('user_id', userId).eq('provider', 'google_fit')

  return tokens.access_token
}

/** Middernacht (Europe/Amsterdam) van N dagen geleden, als epoch ms. */
function startVanDagNL(dagenTerug: number): number {
  const datum = datumInNL(new Date(Date.now() - dagenTerug * 86400000))
  // Bepaal het UTC-tijdstip van middernacht NL voor die datum
  const utcMiddernacht = new Date(`${datum}T00:00:00Z`).getTime()
  for (const offsetUur of [2, 1]) { // zomer- dan wintertijd proberen
    const kandidaat = utcMiddernacht - offsetUur * 3600000
    if (datumInNL(new Date(kandidaat)) === datum && datumInNL(new Date(kandidaat - 1)) !== datum) {
      return kandidaat
    }
  }
  return utcMiddernacht
}

/**
 * Haalt de afgelopen 14 dagen stappen, hartslag, calorieën en slaap op
 * uit Google Fit en slaat ze op in health_native_logs.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const admin = createAdminClient()
  const { data: tokenRij } = await admin
    .from('wearable_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', user.id)
    .eq('provider', 'google_fit')
    .maybeSingle()

  if (!tokenRij) return NextResponse.json({ error: 'Google Fit niet gekoppeld' }, { status: 404 })

  let accessToken = tokenRij.access_token
  if (tokenRij.expires_at && new Date(tokenRij.expires_at) < new Date()) {
    if (!tokenRij.refresh_token) {
      return NextResponse.json({ error: 'Koppeling verlopen — koppel Google Fit opnieuw' }, { status: 401 })
    }
    const nieuw = await vernieuwToken(tokenRij.refresh_token, user.id)
    if (!nieuw) {
      return NextResponse.json({ error: 'Koppeling verlopen — koppel Google Fit opnieuw' }, { status: 401 })
    }
    accessToken = nieuw
  }

  const startMs = startVanDagNL(SYNC_DAGEN - 1)
  const eindMs = Date.now()
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }

  try {
    const [aggregaatRes, sessiesRes] = await Promise.all([
      fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          aggregateBy: [
            { dataTypeName: 'com.google.step_count.delta' },
            { dataTypeName: 'com.google.heart_rate.bpm' },
            { dataTypeName: 'com.google.calories.expended' },
          ],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startMs,
          endTimeMillis: eindMs,
        }),
      }),
      fetch(
        `https://www.googleapis.com/fitness/v1/users/me/sessions?activityType=72`
        + `&startTime=${new Date(startMs).toISOString()}&endTime=${new Date(eindMs).toISOString()}`,
        { headers }
      ),
    ])

    if (!aggregaatRes.ok) {
      const detail = await aggregaatRes.text()
      console.error('[google-fit/sync] aggregate fout:', aggregaatRes.status, detail.slice(0, 300))
      return NextResponse.json({ error: 'Google Fit gaf een fout — probeer opnieuw te koppelen' }, { status: 502 })
    }

    const aggregaat = await aggregaatRes.json() as FitAggregateRespons
    const sessies = sessiesRes.ok
      ? ((await sessiesRes.json() as { session?: FitSessie[] }).session ?? [])
      : []

    const metingen = combineerDagMetingen(
      parseFitAggregaten(aggregaat),
      parseFitSlaapSessies(sessies),
    )

    const { opgeslagen } = await slaDagMetingenOp(admin, user.id, 'google_fit', metingen)

    await admin.from('wearable_tokens')
      .update({ bijgewerkt_op: new Date().toISOString() })
      .eq('user_id', user.id).eq('provider', 'google_fit')

    return NextResponse.json({ ok: true, opgeslagen })
  } catch (err) {
    console.error('[google-fit/sync]', err)
    return NextResponse.json({ error: 'Synchronisatie mislukt' }, { status: 500 })
  }
}
