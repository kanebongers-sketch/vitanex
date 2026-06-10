import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/api-auth'

async function refreshFitbitToken(refreshToken: string, userId: string): Promise<string | null> {
  const clientId = process.env.FITBIT_CLIENT_ID!
  const clientSecret = process.env.FITBIT_CLIENT_SECRET!
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  })
  if (!res.ok) return null
  const tokens = await res.json()

  const admin = createAdminClient()
  await admin.from('wearable_tokens').update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? refreshToken,
    expires_at: new Date(Date.now() + (tokens.expires_in ?? 28800) * 1000).toISOString(),
    bijgewerkt_op: new Date().toISOString(),
  }).eq('user_id', userId).eq('provider', 'fitbit')

  return tokens.access_token
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const admin = createAdminClient()
  const { data: tokenRow } = await admin
    .from('wearable_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', user.id)
    .eq('provider', 'fitbit')
    .single()

  if (!tokenRow) return NextResponse.json({ error: 'Niet gekoppeld' }, { status: 404 })

  let accessToken = tokenRow.access_token

  // Refresh if expired
  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    if (tokenRow.refresh_token) {
      const newToken = await refreshFitbitToken(tokenRow.refresh_token, user.id)
      if (newToken) accessToken = newToken
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const headers = { 'Authorization': `Bearer ${accessToken}` }

  const [sleepRes, activityRes, heartRes] = await Promise.allSettled([
    fetch(`https://api.fitbit.com/1.2/user/-/sleep/date/${today}.json`, { headers }),
    fetch(`https://api.fitbit.com/1/user/-/activities/date/${today}.json`, { headers }),
    fetch(`https://api.fitbit.com/1/user/-/activities/heart/date/${today}/1d.json`, { headers }),
  ])

  const slaap = sleepRes.status === 'fulfilled' && sleepRes.value.ok ? await sleepRes.value.json() : null
  const activiteit = activityRes.status === 'fulfilled' && activityRes.value.ok ? await activityRes.value.json() : null
  const hart = heartRes.status === 'fulfilled' && heartRes.value.ok ? await heartRes.value.json() : null

  return NextResponse.json({
    stappen: activiteit?.summary?.steps ?? null,
    calorieën: activiteit?.summary?.caloriesOut ?? null,
    slaapMinuten: slaap?.summary?.totalMinutesAsleep ?? null,
    slaapKwaliteit: slaap?.summary?.efficiency ?? null,
    hartslag: hart?.['activities-heart']?.[0]?.value?.restingHeartRate ?? null,
  })
}
