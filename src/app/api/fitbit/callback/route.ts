import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/koppelingen?error=fitbit_denied`)
  }

  const clientId = process.env.FITBIT_CLIENT_ID!
  const clientSecret = process.env.FITBIT_CLIENT_SECRET!
  const redirectUri = `${appUrl}/api/fitbit/callback`

  // Exchange code for tokens
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
      redirect_uri: redirectUri,
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/koppelingen?error=fitbit_token`)
  }

  const tokens = await tokenRes.json()

  // Get user from Supabase cookie-based session
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })

  // Try to get session from Authorization header or cookie
  const { data: { user } } = await client.auth.getUser()

  const fitbitUserId = tokens.user_id

  if (!user) {
    // Fallback: redirect to koppelingen with a temp token in query for client-side pickup
    const params = new URLSearchParams({
      fitbit_connected: '1',
      fitbit_access_token: tokens.access_token,
      fitbit_refresh_token: tokens.refresh_token ?? '',
      fitbit_expires_in: String(tokens.expires_in ?? 28800),
    })
    return NextResponse.redirect(`${appUrl}/koppelingen?${params.toString()}`)
  }

  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 28800) * 1000)
  const admin = createAdminClient()

  await admin.from('wearable_tokens').upsert({
    user_id: user.id,
    provider: 'fitbit',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_at: expiresAt.toISOString(),
    scope: tokens.scope ?? '',
    raw_data: { fitbit_user_id: fitbitUserId },
    bijgewerkt_op: new Date().toISOString(),
  }, { onConflict: 'user_id,provider' })

  return NextResponse.redirect(`${appUrl}/koppelingen?fitbit_connected=1`)
}
