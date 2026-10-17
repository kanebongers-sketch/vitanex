import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, vereisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { coachingSleutel, coachingVoor } from '@/lib/club/training/coaching'
import { coachingUitRij } from '@/lib/club/training/coaching/invoer'
import type { Coaching } from '@/lib/club/training/coaching/typen'

// GET /api/club/training/coaching?naam=Back%20squat
//   De coaching van een oefening: de eigen coaching van de sportschool als die
//   er is, anders de standaardcoaching. { coaching, eigen } (coaching null als
//   er geen is).
// GET /api/club/training/coaching?kern=Back%20squat&kern=Lat%20pulldown
//   Alleen de kernpunten van meerdere oefeningen, voor het geprinte schema.

const MAX_NAAM = 80
const MAX_KERN = 60

/** Eigen coaching van de sportschool, per naam (kleine letters). Een query voor alle gevraagde namen. */
async function eigenCoaching(t: ClubToegang, namen: readonly string[]): Promise<Map<string, Coaching>> {
  const { data, error } = await t.admin.from('club_oefeningen').select('naam, coaching').eq('user_id', t.userId).not('coaching', 'is', null).in('naam', [...namen])
  if (error) console.error('[club/training] eigen coaching lezen mislukt', error.message)
  const uit = new Map<string, Coaching>()
  for (const rij of data ?? []) {
    const c = coachingUitRij(rij.coaching)
    if (c && typeof rij.naam === 'string') uit.set(coachingSleutel(rij.naam), c)
  }
  return uit
}

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const zoek = req.nextUrl.searchParams

  const kern = zoek.getAll('kern').map((n) => n.trim()).filter(Boolean)
  if (kern.length > 0) {
    if (kern.length > MAX_KERN || kern.some((n) => n.length > MAX_NAAM)) return clubFout('Te veel oefeningen.', 400)
    const eigen = await eigenCoaching(t, kern)
    const kernpunten = Object.fromEntries(
      kern.flatMap((naam) => {
        const c = eigen.get(coachingSleutel(naam)) ?? coachingVoor(naam)
        return c ? [[naam, c.kernpunten.map((k) => k.punt)]] : []
      }),
    )
    return clubJson({ kernpunten })
  }

  const naam = zoek.get('naam')?.trim() ?? ''
  if (!naam || naam.length > MAX_NAAM) return clubFout('Onbekende oefening.', 400)
  const eigen = (await eigenCoaching(t, [naam])).get(coachingSleutel(naam))
  return clubJson({ coaching: eigen ?? coachingVoor(naam), eigen: eigen !== undefined })
}
