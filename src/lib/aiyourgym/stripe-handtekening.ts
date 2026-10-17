// ─── AI Your Gym: de handtekening van een Stripe-webhook (PUUR, node:crypto) ─
// Zoals Stripe het voorschrijft: de kop Stripe-Signature bevat t=<tijd> en een
// of meer v1=<hmac>. De HMAC-SHA256 met het webhookgeheim over "<t>.<ruwe body>"
// moet met een van de v1-waarden overeenkomen (vergelijken in vaste tijd), en t
// mag niet ouder zijn dan TOLERANTIE_S (tegen het opnieuw afspelen van een oud
// bericht). Altijd over de ruwe body: na JSON.parse klopt de handtekening niet meer.

import { createHmac, timingSafeEqual } from 'node:crypto'

export const TOLERANTIE_S = 300

export function tekenStripe(payload: string, geheim: string, tijd: number): string {
  return createHmac('sha256', geheim).update(`${tijd}.${payload}`, 'utf8').digest('hex')
}

function leesKop(kop: string): { tijd: number; handtekeningen: string[] } | null {
  let tijd = NaN
  const handtekeningen: string[] = []
  for (const deel of kop.split(',')) {
    const [sleutel, waarde] = deel.trim().split('=', 2)
    if (sleutel === 't' && /^\d{1,12}$/.test(waarde ?? '')) tijd = Number(waarde)
    if (sleutel === 'v1' && /^[0-9a-f]{64}$/.test(waarde ?? '')) handtekeningen.push(waarde)
  }
  return Number.isFinite(tijd) && handtekeningen.length > 0 ? { tijd, handtekeningen } : null
}

/** Klopt de handtekening van dit bericht? `nuS` = de huidige tijd in seconden. */
export function handtekeningKlopt(payload: string, kop: string | null, geheim: string, nuS: number): boolean {
  if (!kop || kop.length > 2_000 || !geheim) return false
  const gelezen = leesKop(kop)
  if (!gelezen || Math.abs(nuS - gelezen.tijd) > TOLERANTIE_S) return false
  const verwacht = Buffer.from(tekenStripe(payload, geheim, gelezen.tijd), 'hex')
  return gelezen.handtekeningen.some((h) => {
    const gegeven = Buffer.from(h, 'hex')
    return gegeven.length === verwacht.length && timingSafeEqual(gegeven, verwacht)
  })
}
