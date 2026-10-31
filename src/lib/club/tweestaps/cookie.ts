// ─── AI Your Gym, tweestaps: de cookie van de wachtstap (SERVER) ────────────
// Tussen een goed wachtwoord en de code: een httpOnly-cookie met het wachttoken
// (vijf minuten). In productie met __Host-: alleen https, alleen pad /, niet door
// een subdomein te zetten. SameSite strict: alleen ons eigen formulier stuurt hem mee.

import type { NextResponse } from 'next/server'

export function wachtCookie(productie = process.env.NODE_ENV === 'production'): string {
  return productie ? '__Host-ayg_2fa' : 'ayg_2fa'
}

function opties(extra: { expires?: Date; maxAge?: number }) {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/', ...extra }
}

export function zetWachtCookie(res: NextResponse, token: string, verlooptOp: Date): NextResponse {
  res.cookies.set(wachtCookie(), token, opties({ expires: verlooptOp }))
  return res
}

export function wisWachtCookie(res: NextResponse): NextResponse {
  res.cookies.set(wachtCookie(), '', opties({ maxAge: 0 }))
  return res
}
