/**
 * OAuth state helpers.
 * Bindt een OAuth-flow aan de ingelogde gebruiker via een HMAC-getekende
 * state-parameter, zodat callbacks CSRF-veilig zijn en tokens nooit
 * via de browser-URL hoeven te reizen.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

const STATE_TTL_MS = 10 * 60 * 1000 // 10 minuten

function getSecret(): string {
  const secret = process.env.OAUTH_STATE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) {
    throw new Error('OAUTH_STATE_SECRET of SUPABASE_SERVICE_ROLE_KEY ontbreekt')
  }
  return secret
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url')
}

/**
 * Maakt een getekende state-string voor de gegeven gebruiker,
 * geldig voor 10 minuten.
 */
export function createOAuthState(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + STATE_TTL_MS })
  ).toString('base64url')
  return `${payload}.${sign(payload)}`
}

/**
 * Verifieert een state-string en geeft het user-id terug,
 * of null bij een ongeldige of verlopen state.
 */
export function verifyOAuthState(state: string | null): string | null {
  if (!state) return null

  const delen = state.split('.')
  if (delen.length !== 2) return null
  const [payload, signature] = delen
  if (!payload || !signature) return null

  const expected = Buffer.from(sign(payload))
  const received = Buffer.from(signature)
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      uid?: string
      exp?: number
    }
    if (!parsed.uid || !parsed.exp || Date.now() > parsed.exp) return null
    return parsed.uid
  } catch {
    return null
  }
}
