// ─── Club, push: base64url zonder opvulling (PUUR, node) ────────────────────
// Web Push gebruikt overal base64url zonder '='. Lezen is streng: alleen het
// juiste alfabet, anders null.

const B64U = /^[A-Za-z0-9_-]*={0,2}$/

export function naarB64u(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url')
}

/** base64url (of gewoon base64 met + en /) naar bytes; null als het geen geldige tekst is. */
export function uitB64u(tekst: string): Buffer | null {
  const genormaliseerd = tekst.replace(/\+/g, '-').replace(/\//g, '_')
  if (!B64U.test(genormaliseerd)) return null
  return Buffer.from(genormaliseerd.replace(/=+$/, ''), 'base64url')
}
