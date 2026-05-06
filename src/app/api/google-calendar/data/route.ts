import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

async function refreshGoogleToken(refreshToken: string, userId: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) return null
  const tokens = await res.json()
  const admin = createAdminClient()
  await admin.from('wearable_tokens').update({
    access_token: tokens.access_token,
    expires_at: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
    bijgewerkt_op: new Date().toISOString(),
  }).eq('user_id', userId).eq('provider', 'google_calendar')
  return tokens.access_token
}

export async function GET() {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const admin = createAdminClient()
  const { data: tokenRow } = await admin
    .from('wearable_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', user.id)
    .eq('provider', 'google_calendar')
    .single()

  if (!tokenRow) return NextResponse.json({ error: 'Niet gekoppeld' }, { status: 404 })

  let accessToken = tokenRow.access_token
  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    if (tokenRow.refresh_token) {
      const newToken = await refreshGoogleToken(tokenRow.refresh_token, user.id)
      if (newToken) accessToken = newToken
    }
  }

  // Fetch events for the next 7 days
  const now = new Date()
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const calRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: weekLater.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '50',
    }),
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  )

  if (!calRes.ok) return NextResponse.json({ error: 'Agenda ophalen mislukt' }, { status: 500 })

  const calData = await calRes.json()
  const events: { summary: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string } }[] = calData.items ?? []

  // Calculate metrics
  let totalMeetingMinuten = 0
  let aantalAfspraken = 0
  const vandaagAfspraken: string[] = []
  const todayStr = now.toISOString().split('T')[0]

  for (const e of events) {
    const start = e.start.dateTime ?? e.start.date
    const end = e.end.dateTime ?? e.end.date
    if (start && end) {
      aantalAfspraken++
      const duurMs = new Date(end).getTime() - new Date(start).getTime()
      totalMeetingMinuten += duurMs / 60000
      if (start.startsWith(todayStr)) {
        vandaagAfspraken.push(e.summary ?? 'Afspraak')
      }
    }
  }

  const werkLast = totalMeetingMinuten > 1200 ? 'hoog' : totalMeetingMinuten > 600 ? 'gemiddeld' : 'laag'

  return NextResponse.json({
    aantalAfspraken,
    totalMeetingMinuten: Math.round(totalMeetingMinuten),
    vandaagAfspraken,
    werkLast,
    balansScore: werkLast === 'laag' ? 5 : werkLast === 'gemiddeld' ? 3 : 1.5,
  })
}
