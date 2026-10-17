import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, vereisKane } from '@/lib/club/toegang'
import { ORGANISATIE_COOKIE, isUuid } from '@/lib/club/kern/organisatie'

// POST /api/club/organisatie/wissel  { id }
// Wissel van sportschool. Alleen naar een sportschool van deze beheerder; de
// keuze staat in een httpOnly-cookie, de toegang controleert hem elke keer.

export async function POST(req: NextRequest) {
  const t = await vereisKane(req)
  if (t instanceof NextResponse) return t
  const body: unknown = await req.json().catch(() => null)
  const id = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).id : null
  if (!isUuid(id) || !t.organisaties.some((o) => o.id === id)) return clubFout('Onbekende sportschool.', 404)
  const antwoord = clubJson({ ok: true })
  antwoord.cookies.set(ORGANISATIE_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  })
  return antwoord
}
