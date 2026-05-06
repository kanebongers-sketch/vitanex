import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/koppelingen?error=google_denied`)
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${appUrl}/api/google-calendar/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/koppelingen?error=google_token`)
  }

  const tokens = await tokenRes.json()

  // Try to get the user from supabase
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
  const { data: { user } } = await client.auth.getUser()

  if (!user) {
    const params = new URLSearchParams({
      google_connected: '1',
      google_access_token: tokens.access_token,
      google_refresh_token: tokens.refresh_token ?? '',
      google_expires_in: String(tokens.expires_in ?? 3600),
    })
    return NextResponse.redirect(`${appUrl}/koppelingen?${params.toString()}`)
  }

  const admin = createAdminClient()
  await admin.from('wearable_tokens').upsert({
    user_id: user.id,
    provider: 'google_calendar',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_at: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
    scope: tokens.scope ?? '',
    bijgewerkt_op: new Date().toISOString(),
  }, { onConflict: 'user_id,provider' })

  return NextResponse.redirect(`${appUrl}/koppelingen?google_connected=1`)
}
