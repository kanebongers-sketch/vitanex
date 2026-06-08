import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/koppelingen?error=fit_denied`)
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_FIT_CLIENT_ID!,
      client_secret: process.env.GOOGLE_FIT_CLIENT_SECRET!,
      redirect_uri: `${appUrl}/api/google-fit/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    const body = await tokenRes.text()
    console.error('[Google Fit callback] token error:', body)
    return NextResponse.redirect(`${appUrl}/koppelingen?error=fit_token`)
  }

  const tokens = await tokenRes.json() as {
    access_token: string
    refresh_token?: string
    expires_in?: number
    scope?: string
  }

  // Get the authenticated user from cookie
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
  const { data: { user } } = await client.auth.getUser()

  if (!user) {
    // Pass tokens via URL so koppelingen page can store them after login
    const params = new URLSearchParams({
      fit_connected: '1',
      fit_access_token: tokens.access_token,
      fit_refresh_token: tokens.refresh_token ?? '',
      fit_expires_in: String(tokens.expires_in ?? 3600),
    })
    return NextResponse.redirect(`${appUrl}/koppelingen?${params.toString()}`)
  }

  const admin = createAdminClient()
  await admin.from('wearable_tokens').upsert({
    user_id: user.id,
    provider: 'google_fit',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_at: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
    scope: tokens.scope ?? '',
    bijgewerkt_op: new Date().toISOString(),
  }, { onConflict: 'user_id,provider' })

  return NextResponse.redirect(`${appUrl}/koppelingen?fit_connected=1`)
}
