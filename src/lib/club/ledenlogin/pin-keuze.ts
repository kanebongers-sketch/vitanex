// ─── Club, ledenlogin: een pincode kiezen (PUUR) ────────────────────────────
// Een lid kiest zelf een pincode. De pincodes die iedereen als eerste probeert
// (allemaal dezelfde cijfers, een reeks, een herhaald patroon) weigeren we:
// met 30 pogingen voordat een link dichtgaat, zouden die anders te raden zijn.

const BEKEND: ReadonlySet<string> = new Set(['123456', '654321', '123123', '112233', '121212', '696969', '159753', '147258', '258369', '102030', '010203', '000123'])

/** Is deze (geldige, 6-cijferige) pincode te makkelijk te raden? */
export function isZwakkePin(pin: string): boolean {
  if (!/^\d{6}$/.test(pin)) return true
  if (BEKEND.has(pin)) return true
  if (new Set(pin).size === 1) return true
  const cijfers = [...pin].map(Number)
  const stappen = cijfers.slice(1).map((c, i) => (c - cijfers[i] + 10) % 10)
  // Oplopend of aflopend (ook rond: 890123).
  if (stappen.every((s) => s === 1) || stappen.every((s) => s === 9)) return true
  // Twee of drie cijfers herhaald: 121212, 123123.
  if (pin.slice(0, 2).repeat(3) === pin || pin.slice(0, 3).repeat(2) === pin) return true
  return false
}
