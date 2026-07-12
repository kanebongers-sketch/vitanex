import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createOAuthState } from '@/lib/auth/oauth-state'

/**
 * Start de Google Fit OAuth-flow voor de ingelogde gebruiker.
 * Geeft de autorisatie-URL terug (incl. getekende state) zodat de
 * client zelf kan doorsturen.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

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
  url.searchParams.set('state', createOAuthState(user.id))

  return NextResponse.json({ url: url.toString() })
}
