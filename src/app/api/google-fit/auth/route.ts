import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.GOOGLE_FIT_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'GOOGLE_FIT_CLIENT_ID niet ingesteld' }, { status: 503 })
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/google-fit/callback`
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')

  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.sleep.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
  ].join(' '))
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')

  return NextResponse.redirect(url.toString())
}
