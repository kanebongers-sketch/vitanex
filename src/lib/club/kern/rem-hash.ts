// ─── Club: hash voor remmen tegen misbruik (SERVER-ONLY) ────────────────────
// Remmen (widget, app-aanvragen, demo-aanvragen) tellen per IP-adres en per
// e-mailadres zonder die zelf te bewaren. Een gewone sha256 is daarvoor te
// zwak: alle IPv4-adressen zijn in minuten na te rekenen. Daarom een HMAC met
// een geheim dat alleen de server kent. Zo is de hash zonder dat geheim niet
// terug te rekenen (AVG: dataminimalisatie en pseudonimisering).
//
// Geheim: CLUB_REM_GEHEIM als die gezet is, anders de service-sleutel van de
// database (die staat altijd op de server en komt nooit in de browser).
// Wisselt het geheim, dan beginnen de remmen opnieuw te tellen; dat is prima.

import { createHmac } from 'node:crypto'

/** Alleen voor tests en lokaal zonder omgeving; op de server is er altijd een sleutel. */
const ZONDER_GEHEIM = 'club-rem-lokaal-zonder-geheim'

export function remGeheim(omgeving: Readonly<Record<string, string | undefined>> = process.env): string {
  const eigen = omgeving.CLUB_REM_GEHEIM?.trim()
  if (eigen && eigen.length >= 16) return eigen
  const dienst = omgeving.LIFEOS_SERVICE_ROLE_KEY?.trim()
  if (dienst && dienst !== 'undefined') return dienst
  return ZONDER_GEHEIM
}

/** HMAC-SHA256 als 64 hextekens (past op de bestaande databasechecks). */
export function remSleutel(doel: string, waarde: string, geheim: string = remGeheim()): string {
  return createHmac('sha256', `club-rem|${geheim}`).update(`${doel}|${waarde}`).digest('hex')
}
