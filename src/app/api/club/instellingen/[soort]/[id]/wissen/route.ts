import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { leesJson } from '@/lib/club/rooster/api'
import { isUuid } from '@/lib/club/rooster/invoer'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'
import { MEDEWERKER_AL_GEWIST, magMedewerkerWissen, medewerkerNaamKlopt, medewerkerWisBlokkade } from '@/lib/club/personeel/avg'
import { haalMedewerkerAvgStaat, wisMedewerker } from '@/lib/club/personeel/avg-opslag'

// POST /api/club/instellingen/medewerkers/[id]/wissen  { bevestiging: "<naam>" }
// Wissen (AVG) van een medewerker die uit dienst is: naam wordt "Oud-medewerker
// XXXX", e-mail, inlog, beschikbaarheid en notities gaan weg; diensten en uren
// blijven (fiscale bewaarplicht). Direct en onomkeerbaar. Alleen Kane en de
// eigenaar; anderen een 404. De database schrijft zelf een logregel (migratie 449).

export async function POST(req: NextRequest, { params }: { params: Promise<{ soort: string; id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  if (!magMedewerkerWissen(t)) return clubFout('Niet gevonden.', 404)
  const { soort, id } = await params
  if (soort !== 'medewerkers' || !isUuid(id)) return clubFout('Niet gevonden.', 404)
  const buiten = await eisVestigingVanRecord(t, 'club_medewerkers', id)
  if (buiten) return buiten
  const mw = await haalMedewerkerAvgStaat(t.admin, t.userId, id)
  if (!mw) return clubFout('Deze medewerker bestaat niet.', 404)

  const blokkade = medewerkerWisBlokkade(mw)
  if (blokkade) return clubFout(blokkade, 409)
  const body = await leesJson(req)
  const bevestiging = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).bevestiging : null
  if (!medewerkerNaamKlopt(bevestiging, mw.naam)) return clubFout(`Typ de naam "${mw.naam}" om te bevestigen.`, 400)

  const gewist = await wisMedewerker(t.admin, t.userId, id, t.naam)
  if (gewist === null) return clubFout('Wissen lukte niet. Probeer het opnieuw.', 500)
  if (!gewist) return clubFout(MEDEWERKER_AL_GEWIST, 409)
  return clubJson({ ok: true })
}
