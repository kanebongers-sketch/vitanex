// ─── Club, push: een merkje voor deze sessie (SERVER-ONLY) ──────────────────
// De app onthoudt per toestel bij welk merkje het abonnement al aan de server
// is gemeld, zodat hij niet bij elke keer laden opnieuw meldt. Een nieuwe
// sessie (opnieuw ingelogd, ander lid) geeft een ander merkje en dus een
// nieuwe melding. Het merkje is een hash van de sessiehash: niets geheims.

import { createHash } from 'node:crypto'

export function pushSessieMerk(sessieHash: string | null): string | null {
  if (!sessieHash) return null
  return createHash('sha256').update(`club-push:${sessieHash}`).digest('base64url').slice(0, 16)
}
