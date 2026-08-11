// ─── Push-verzending (FCM HTTP v1) ───────────────────────────────────────────
// Eén Firebase Cloud Messaging-call bereikt Android (FCM), iOS (via APNs, mits
// in Firebase gekoppeld) én web-push. Zo blijft het model één kanaal.
//
// EERLIJK: dit stuurt alléén echt iets als FCM is geconfigureerd via env-vars
// (FCM_SERVICE_ACCOUNT = de service-account-JSON, en het project-id daarin of
// FCM_PROJECT_ID). Zonder die secrets is dit een nette no-op — geen nep-succes.
// De secrets komen NOOIT in code; Kane zet ze in de omgeving.

import { createSign } from 'node:crypto'

interface ServiceAccount {
  client_email: string
  private_key: string
  project_id?: string
}

export interface PushBericht {
  titel: string
  tekst: string
  data?: Record<string, string>
}

export interface PushDoel {
  token: string
  platform: string
}

export interface VerzendResultaat {
  geconfigureerd: boolean
  verstuurd: number
  mislukt: number
  /** Tokens die FCM als ongeldig/afgemeld meldt — de cron ruimt ze op. */
  ongeldigeTokens: string[]
}

/** Leest en valideert de service-account uit env. null = niet geconfigureerd. */
export function leesServiceAccount(): ServiceAccount | null {
  const raw = process.env.FCM_SERVICE_ACCOUNT
  if (!raw) return null
  try {
    const sa = JSON.parse(raw) as Partial<ServiceAccount>
    if (typeof sa.client_email !== 'string' || typeof sa.private_key !== 'string') return null
    return { client_email: sa.client_email, private_key: sa.private_key, project_id: sa.project_id }
  } catch {
    return null
  }
}

/** Is push echt te versturen? Handig om in de UI eerlijk te tonen. */
export function pushGeconfigureerd(): boolean {
  return leesServiceAccount() !== null
}

interface TokenCache {
  token: string
  verlooptOp: number // epoch seconden
}
let tokenCache: TokenCache | null = null

/** Haalt (en cachet) een OAuth-toegangstoken via de service-account (JWT, RS256). */
async function haalToegangstoken(sa: ServiceAccount): Promise<string> {
  const nu = Math.floor(Date.now() / 1000)
  if (tokenCache && tokenCache.verlooptOp > nu + 60) return tokenCache.token

  const encode = (obj: object): string => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const header = encode({ alg: 'RS256', typ: 'JWT' })
  const claim = encode({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: nu,
    exp: nu + 3600,
  })
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claim}`)
  const handtekening = signer.sign(sa.private_key).toString('base64url')
  const jwt = `${header}.${claim}.${handtekening}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) throw new Error(`OAuth-token ophalen mislukt (${res.status})`)
  const json = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!json.access_token) throw new Error('OAuth-antwoord zonder access_token')
  tokenCache = { token: json.access_token, verlooptOp: nu + (json.expires_in ?? 3600) }
  return json.access_token
}

/**
 * Verstuurt één bericht naar meerdere apparaat-tokens. Retourneert tellingen en
 * de tokens die FCM afkeurt (afgemeld/ongeldig) zodat de cron ze kan wissen.
 * Niet geconfigureerd → { geconfigureerd: false, ... 0 }.
 */
export async function verzendPush(doelen: readonly PushDoel[], bericht: PushBericht): Promise<VerzendResultaat> {
  const sa = leesServiceAccount()
  if (!sa) return { geconfigureerd: false, verstuurd: 0, mislukt: 0, ongeldigeTokens: [] }

  const projectId = sa.project_id ?? process.env.FCM_PROJECT_ID
  if (!projectId) return { geconfigureerd: false, verstuurd: 0, mislukt: 0, ongeldigeTokens: [] }

  const toegangstoken = await haalToegangstoken(sa)
  const endpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

  let verstuurd = 0
  let mislukt = 0
  const ongeldigeTokens: string[] = []

  for (const doel of doelen) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${toegangstoken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: doel.token,
            notification: { title: bericht.titel, body: bericht.tekst },
            ...(bericht.data ? { data: bericht.data } : {}),
          },
        }),
      })
      if (res.ok) {
        verstuurd++
      } else {
        mislukt++
        // 404 UNREGISTERED of 400 met ongeldig token → opruimen.
        if (res.status === 404 || res.status === 400) ongeldigeTokens.push(doel.token)
      }
    } catch {
      mislukt++
    }
  }

  return { geconfigureerd: true, verstuurd, mislukt, ongeldigeTokens }
}
