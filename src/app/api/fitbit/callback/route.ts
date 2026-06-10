import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { verifyOAuthState } from '@/lib/oauth-state'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    console.error('[Fitbit callback] NEXT_PUBLIC_APP_URL niet ingesteld')
    return NextResponse.json({ error: 'Serverconfiguratie onvolledig' }, { status: 500 })
  }

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/koppelingen?error=fitbit_denied`)
  }

  // State bindt deze callback aan de gebruiker die de flow startte (CSRF-bescherming)
  const userId = verifyOAuthState(searchParams.get('state'))
  if (!userId) {
    return NextResponse.redirect(`${appUrl}/koppelingen?error=fitbit_state`)
  }

  const clientId = process.env.FITBIT_CLIENT_ID!
  const clientSecret = process.env.FITBIT_CLIENT_SECRET!
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const tokenRes = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${appUrl}/api/fitbit/callback`,
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/koppelingen?error=fitbit_token`)
  }

  const tokens = await tokenRes.json() as {
    access_token: string
    refresh_token?: string
    expires_in?: number
    scope?: string
    user_id?: string
  }

  const admin = createAdminClient()
  const { error: dbError } = await admin.from('wearable_tokens').upsert({
    user_id: userId,
    provider: 'fitbit',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_at: new Date(Date.now() + (tokens.expires_in ?? 28800) * 1000).toISOString(),
    scope: tokens.scope ?? '',
    raw_data: { fitbit_user_id: tokens.user_id },
    bijgewerkt_op: new Date().toISOString(),
  }, { onConflict: 'user_id,provider' })

  if (dbError) {
    console.error('[Fitbit callback] opslaan mislukt:', dbError)
    return NextResponse.redirect(`${appUrl}/koppelingen?error=fitbit_opslaan`)
  }

  return NextResponse.redirect(`${appUrl}/koppelingen?fitbit_connected=1`)
}
