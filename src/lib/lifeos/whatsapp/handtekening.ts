// ─── Meta-webhookhandtekening verifiëren ────────────────────────────────────
// Server-only: `node:crypto`. De WhatsApp Cloud API-webhook heeft geen sessie om
// tegen te gate'n — de énige bewijzen dat een POST écht van Meta komt zijn (1)
// deze handtekening en (2) de afzender-allowlist (`toegang.ts`). Deze laag doet
// stap 1: bewijzen dat de body niet onderweg gemanipuleerd of verzonnen is.
//
// HOE META ONDERTEKENT
//
//   Elke webhook-POST draagt de header `X-Hub-Signature-256: sha256=<hex>`. Die
//   <hex> is een HMAC-SHA256 over de RAUWE request-body (exact de bytes die
//   binnenkwamen — niet een opnieuw ge-JSON.stringify'de versie, want elke
//   herformattering breekt de hash) met de app-secret als sleutel.
//
//   Wij herberekenen diezelfde HMAC en vergelijken. Kloppen ze, dan bezit de
//   afzender de app-secret én is de body ongewijzigd.
//
// WAAROM CONSTANTE-TIJD VERGELIJKEN
//
//   `===` op strings stopt bij het eerste verschillende teken; hoe langer een gok
//   klopt, hoe langer de vergelijking duurt. Dat timing-verschil laat een
//   aanvaller een geldige handtekening raden. We hergebruiken daarom `geheimGelijk`
//   — die hasht beide kanten naar 32 vaste bytes en vergelijkt met
//   `timingSafeEqual`, dus zonder inhoud- óf lengte-lek.

import { createHmac } from 'node:crypto'
import { geheimGelijk } from '@/lib/lifeos/auth/geheim'

/** Meta's header-prefix. De rest van de headerwaarde is de hex-digest. */
const HANDTEKENING_PREFIX = 'sha256='

/**
 * Is deze webhook-POST echt door Meta ondertekend?
 *
 * Fail-closed op elke onvolkomenheid: ontbrekende/lege `appSecret` (een
 * niet-geconfigureerd slot hoort dicht), ontbrekende header, een header zonder
 * het `sha256=`-prefix, of een digest die niet matcht → `false`. Alleen een
 * kloppende HMAC over de RAUWE body → `true`.
 */
export function handtekeningGeldig(
  rauweBody: string,
  handtekeningHeader: string | null,
  appSecret: string | undefined,
): boolean {
  // Zonder secret valt er niets te verifiëren: dichte deur, niet open.
  if (!appSecret || appSecret.length === 0) return false

  // Geen header of verkeerd prefix → we weten niet wát we zouden vergelijken.
  if (handtekeningHeader === null) return false
  if (!handtekeningHeader.startsWith(HANDTEKENING_PREFIX)) return false

  const gegevenHex = handtekeningHeader.slice(HANDTEKENING_PREFIX.length)

  // Herbereken de HMAC over exact dezelfde bytes die Meta ondertekende.
  const verwachteHex = createHmac('sha256', appSecret).update(rauweBody, 'utf8').digest('hex')

  // Constante-tijd vergelijking; `geheimGelijk` geeft ook netjes false bij een
  // lege of ongelijk-lange `gegevenHex` (bv. header was kaal "sha256=").
  return geheimGelijk(verwachteHex, gegevenHex)
}
