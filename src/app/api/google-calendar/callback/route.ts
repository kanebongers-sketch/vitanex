import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { verifyOAuthState } from '@/lib/oauth-state'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    console.error('[Google Calendar callback] NEXT_PUBLIC_APP_URL niet ingesteld')
    return NextResponse.json({ error: 'Serverconfiguratie onvolledig' }, { status: 500 })
  }

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/koppelingen?error=google_denied`)
  }

  // State bindt deze callback aan de gebruiker die de flow startte (CSRF-bescherming)
  const userId = verifyOAuthState(searchParams.get('state'))
  if (!userId) {
    return NextResponse.redirect(`${appUrl}/koppelingen?error=google_state`)
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

  const tokens = await tokenRes.json() as {
    access_token: string
    refresh_token?: string
    expires_in?: number
    scope?: string
  }

  const admin = createAdminClient()
  const { error: dbError } = await admin.from('wearable_tokens').upsert({
    user_id: userId,
    provider: 'google_calendar',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_at: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
    scope: tokens.scope ?? '',
    bijgewerkt_op: new Date().toISOString(),
  }, { onConflict: 'user_id,provider' })

  if (dbError) {
    console.error('[Google Calendar callback] opslaan mislukt:', dbError)
    return NextResponse.redirect(`${appUrl}/koppelingen?error=google_opslaan`)
  }

  return NextResponse.redirect(`${appUrl}/koppelingen?google_connected=1`)
}
