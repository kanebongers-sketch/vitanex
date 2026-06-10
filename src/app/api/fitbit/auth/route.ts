import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createOAuthState } from '@/lib/oauth-state'

/**
 * Start de Fitbit OAuth-flow voor de ingelogde gebruiker.
 * Geeft de autorisatie-URL terug (incl. getekende state) zodat de
 * client zelf kan doorsturen.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const clientId = process.env.FITBIT_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'FITBIT_CLIENT_ID niet ingesteld' }, { status: 503 })
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/fitbit/callback`
  const url = new URL('https://www.fitbit.com/oauth2/authorize')

  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', 'activity sleep heartrate profile')
  url.searchParams.set('expires_in', '604800')
  url.searchParams.set('state', createOAuthState(user.id))

  return NextResponse.json({ url: url.toString() })
}
