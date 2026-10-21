// ─── Club: JSON uit een verzoek lezen met een grens (SERVER) ────────────────
// Leest nooit meer dan `maxBytes`: een te grote body wordt geweigerd voordat
// hij helemaal in het geheugen staat. 'te-groot' = weigeren met 413.

import { NextResponse, type NextRequest } from 'next/server'
import { GEEN_CACHE } from '@/lib/club/kern/verzoek'

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

/** Zoals leesJsonBegrensd, maar een te grote body wordt meteen een 413-antwoord. */
export async function leesJsonOfTeGroot(req: NextRequest, maxBytes: number): Promise<{ body: unknown } | NextResponse> {
  const body = await leesJsonBegrensd(req, maxBytes)
  if (body === 'te-groot') return NextResponse.json({ fout: 'Het verzoek is te groot.' }, { status: 413, headers: GEEN_CACHE })
  return { body }
}
