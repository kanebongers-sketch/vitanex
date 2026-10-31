// ─── AI Your Gym: het TOTP-geheim versleuteld bewaren (PUUR, node:crypto) ───
// Het geheim van de authenticator-app is net zo gevoelig als een wachtwoord:
// wie het heeft, maakt zelf geldige codes. Het staat daarom alleen versleuteld
// in de database (AES-256-GCM), met een sleutel die met HKDF uit CLUB_2FA_SLEUTEL
// komt (zelfde opzet als health/versleutelen.ts: nieuwe IV per keer).
// Het account (soort plus id) gaat mee als extra gegevens (AAD): een geheim dat
// in een andere rij geplakt wordt, valt niet te ontsleutelen.
// Formaat: "v1.<iv>.<versleuteld>.<tag>" in base64url. Nooit in een log.

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'

const VERSIE = 'v1'
const IV_BYTES = 12
const TAG_BYTES = 16

export type Omgeving = Readonly<Record<string, string | undefined>>

/** De soorten accounts met tweestapsverificatie. Nu alleen het platform; eigenaren later. */
export type AccountSoort = 'platform' | 'beheerder'

export interface AccountSleutel {
  soort: AccountSoort
  id: string
}

/** CLUB_2FA_SLEUTEL als 32 bytes (64 hextekens of base64), of null als hij ontbreekt of niet klopt. */
export function tweestapsHoofdsleutel(omgeving: Omgeving = process.env): Buffer | null {
  const ruw = omgeving.CLUB_2FA_SLEUTEL?.trim()
  if (!ruw) return null
  if (/^[0-9a-f]{64}$/i.test(ruw)) return Buffer.from(ruw, 'hex')
  const b64 = Buffer.from(ruw.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
  return b64.length === 32 ? b64 : null
}

function afgeleid(hoofdsleutel: Uint8Array): Buffer {
  if (hoofdsleutel.length !== 32) throw new Error('Ongeldige hoofdsleutel')
  return Buffer.from(hkdfSync('sha256', hoofdsleutel, Buffer.from('club-2fa-v1'), Buffer.from('totp-geheim', 'utf8'), 32))
}

function aad(account: AccountSleutel): Buffer {
  return Buffer.from(`${account.soort}|${account.id}`, 'utf8')
}

export function versleutelGeheim(geheim: Uint8Array, hoofdsleutel: Uint8Array, account: AccountSleutel, iv: Uint8Array = randomBytes(IV_BYTES)): string {
  const cipher = createCipheriv('aes-256-gcm', afgeleid(hoofdsleutel), iv, { authTagLength: TAG_BYTES })
  cipher.setAAD(aad(account))
  const versleuteld = Buffer.concat([cipher.update(geheim), cipher.final()])
  return [VERSIE, Buffer.from(iv).toString('base64url'), versleuteld.toString('base64url'), cipher.getAuthTag().toString('base64url')].join('.')
}

/** Het geheim, of null als het formaat, de sleutel of het account niet klopt. Gooit nooit. */
export function ontsleutelGeheim(opgeslagen: string, hoofdsleutel: Uint8Array, account: AccountSleutel): Buffer | null {
  const delen = opgeslagen.split('.')
  if (delen.length !== 4 || delen[0] !== VERSIE) return null
  try {
    const iv = Buffer.from(delen[1], 'base64url')
    const tag = Buffer.from(delen[3], 'base64url')
    if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) return null
    const decipher = createDecipheriv('aes-256-gcm', afgeleid(hoofdsleutel), iv, { authTagLength: TAG_BYTES })
    decipher.setAAD(aad(account))
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(Buffer.from(delen[2], 'base64url')), decipher.final()])
  } catch {
    return null
  }
}
