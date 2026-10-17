// ─── Club: JSON uit een verzoek lezen met een grens (SERVER) ────────────────
// Leest nooit meer dan `maxBytes`: een te grote body wordt geweigerd voordat
// hij helemaal in het geheugen staat. 'te-groot' = weigeren met 413.

import type { NextRequest } from 'next/server'

export async function leesJsonBegrensd(req: NextRequest, maxBytes: number): Promise<unknown | 'te-groot'> {
  const lengte = Number(req.headers.get('content-length') ?? NaN)
  if (Number.isFinite(lengte) && lengte > maxBytes) return 'te-groot'
  const tekst = await req.text().catch(() => '')
  if (tekst.length > maxBytes) return 'te-groot'
  try {
    return JSON.parse(tekst) as unknown
  } catch {
    return null
  }
}
