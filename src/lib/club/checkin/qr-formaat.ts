// ─── Club, check-in: vorm van de QR-code uit de ledenapp (PUUR, ook browser) ─
// Alleen herkennen, nooit controleren: de handtekening controleert de server
// (./qr-code.ts). Zo weet het baliescherm of een scan een app-code is.
//
//   FFC1.<lid>.<sportschool>.<tijdvak>.<handtekening>
//
// lid en sportschool: de uuid als 16 bytes in base64url (22 tekens), tijdvak
// in grondtal 36, handtekening 16 bytes HMAC-SHA256 in base64url.

export const QR_VOORVOEGSEL = 'FFC1'
/** Ruim boven de echte lengte (ongeveer 80 tekens); langer is nooit een code. */
export const QR_MAX_LENGTE = 160

const VORM = /^FFC1\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{22}\.[0-9a-z]{1,12}\.[A-Za-z0-9_-]{22}$/

/** Lijkt deze tekst op een check-in code uit de app? */
export function lijktOpCheckinCode(tekst: string): boolean {
  const t = tekst.trim()
  return t.length <= QR_MAX_LENGTE && VORM.test(t)
}
