// ─── Club, ledenlogin: paden (PUUR, ook in de browser te gebruiken) ─────────

import { LEDENAPP_PAD } from './contract'

/** Het pad van de persoonlijke link van een lid. */
export function startPad(code: string): string {
  return `${LEDENAPP_PAD}/start/${encodeURIComponent(code)}`
}
