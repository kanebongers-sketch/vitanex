import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { coachingVoor } from '@/lib/club/training/coaching'

// GET /api/club/training/coaching?naam=Back%20squat
//   De uitgebreide coaching van een oefening (kernpunten, stappen, fouten).
//   { coaching: null } als die voor deze oefening nog niet geschreven is.
// GET /api/club/training/coaching?kern=Back%20squat&kern=Lat%20pulldown
//   Alleen de kernpunten van meerdere oefeningen, voor het geprinte schema.

const MAX_NAAM = 80
const MAX_KERN = 60

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const zoek = req.nextUrl.searchParams

  const kern = zoek.getAll('kern').map((n) => n.trim()).filter(Boolean)
  if (kern.length > 0) {
    if (kern.length > MAX_KERN || kern.some((n) => n.length > MAX_NAAM)) return clubFout('Te veel oefeningen.', 400)
    const kernpunten = Object.fromEntries(
      kern.flatMap((naam) => {
        const c = coachingVoor(naam)
        return c ? [[naam, c.kernpunten.map((k) => k.punt)]] : []
      }),
    )
    return clubJson({ kernpunten })
  }

  const naam = zoek.get('naam')?.trim() ?? ''
  if (!naam || naam.length > MAX_NAAM) return clubFout('Onbekende oefening.', 400)
  return clubJson({ coaching: coachingVoor(naam) })
}
