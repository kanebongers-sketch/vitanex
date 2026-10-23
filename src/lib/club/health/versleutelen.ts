// ─── Club, health: tokens versleuteld bewaren (PUUR, node) ──────────────────
// De toegangs- en verversingstokens van een leverancier zijn net zo gevoelig als
// een wachtwoord: wie ze heeft, leest de gezondheidsgegevens van het lid. Ze
// staan daarom alleen versleuteld in de database (AES-256-GCM), met een eigen
// sleutel per doel die met HKDF uit CLUB_HEALTH_SLEUTEL komt (net als
// push/versleutelen.ts: alleen node:crypto, nieuwe IV per keer).
//
// De rij (sportschool, lid, bron) gaat mee als extra gegevens (AAD): een token
// dat in een andere rij wordt geplakt, valt niet te ontsleutelen.
// Formaat: "v1.<iv>.<versleuteld>.<tag>" in base64url. Tokens komen nooit in een log.

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'

const VERSIE = 'v1'
const IV_BYTES = 12
const TAG_BYTES = 16

/** Een afgeleide sleutel van 32 bytes voor een doel (tokens, state, webhook). */
export function leidSleutelAf(hoofdsleutel: Uint8Array, doel: string): Buffer {
  if (hoofdsleutel.length !== 32) throw new Error('Ongeldige hoofdsleutel')
  return Buffer.from(hkdfSync('sha256', hoofdsleutel, Buffer.from('club-health-v1'), Buffer.from(doel, 'utf8'), 32))
}

export interface TokenRij {
  userId: string
  lidId: string
  bron: string
}

function aad(rij: TokenRij): Buffer {
  return Buffer.from(`${rij.userId}|${rij.lidId}|${rij.bron}`, 'utf8')
}

export function versleutelTokens(tekst: string, hoofdsleutel: Uint8Array, rij: TokenRij, iv: Uint8Array = randomBytes(IV_BYTES)): string {
  const sleutel = leidSleutelAf(hoofdsleutel, 'tokens')
  const cipher = createCipheriv('aes-256-gcm', sleutel, iv, { authTagLength: TAG_BYTES })
  cipher.setAAD(aad(rij))
  const versleuteld = Buffer.concat([cipher.update(tekst, 'utf8'), cipher.final()])
  return [VERSIE, Buffer.from(iv).toString('base64url'), versleuteld.toString('base64url'), cipher.getAuthTag().toString('base64url')].join('.')
}

/** De tekst, of null als het formaat, de sleutel of de rij niet klopt. Gooit nooit. */
export function ontsleutelTokens(opgeslagen: string, hoofdsleutel: Uint8Array, rij: TokenRij): string | null {
  const delen = opgeslagen.split('.')
  if (delen.length !== 4 || delen[0] !== VERSIE) return null
  try {
    const iv = Buffer.from(delen[1], 'base64url')
    const tag = Buffer.from(delen[3], 'base64url')
    if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) return null
    const decipher = createDecipheriv('aes-256-gcm', leidSleutelAf(hoofdsleutel, 'tokens'), iv, { authTagLength: TAG_BYTES })
    decipher.setAAD(aad(rij))
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(Buffer.from(delen[2], 'base64url')), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}
