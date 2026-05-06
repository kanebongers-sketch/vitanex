import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.FITBIT_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'FITBIT_CLIENT_ID niet ingesteld' }, { status: 503 })
  }
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/fitbit/callback`
  const scope = 'activity sleep heartrate profile'
  const url = new URL('https://www.fitbit.com/oauth2/authorize')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', scope)
  url.searchParams.set('expires_in', '604800')
  return NextResponse.redirect(url.toString())
}
