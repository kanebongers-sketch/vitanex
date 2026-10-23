import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisPlatformEigenaar } from '@/lib/club/toegang'
import { MAX_NAAM } from '@/lib/club/kern/organisatie-invoer'
import { ORGANISATIE_COOKIE } from '@/lib/club/kern/organisatie'
import { ADRES_COOKIE } from '@/lib/club/kern/pad-adres'
import { maakOrganisatie } from '@/lib/club/kern/organisatie-opslag'

// POST /api/club/organisatie/nieuw  { naam }
// Een nieuwe sportschool met de beheerder als eigenaar. Daarna staat die
// sportschool meteen open (cookie), zodat je vestigingen en huisstijl invult.

const MAX_SPORTSCHOLEN = 25

export async function POST(req: NextRequest) {
  const t = await vereisPlatformEigenaar(req)
  if (t instanceof NextResponse) return t
  const body: unknown = await req.json().catch(() => null)
  const ruw = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).naam : null
  const naam = typeof ruw === 'string' ? ruw.trim().replace(/\s+/g, ' ') : ''
  if (!naam) return clubFout('Vul de naam van de sportschool in.', 400)
  if (naam.length > MAX_NAAM) return clubFout(`De naam mag maximaal ${MAX_NAAM} tekens zijn.`, 400)
  if (t.organisaties.length >= MAX_SPORTSCHOLEN) return clubFout(`Maximaal ${MAX_SPORTSCHOLEN} sportscholen.`, 400)
  const uit = await maakOrganisatie(t, naam)
  if (!uit.ok) return clubFout(uit.fout, uit.status)
  await logActie(t, 'Sportschool aangemaakt', naam, null)
  const antwoord = clubJson({ id: uit.id }, 201)
  antwoord.cookies.set(ORGANISATIE_COOKIE, uit.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  })
  // De gekozen sportschool gaat voor de laatst geopende omgeving (aiyourgym.com/<slug>, pad-adres.ts).
  antwoord.cookies.delete(ADRES_COOKIE)
  return antwoord
}
