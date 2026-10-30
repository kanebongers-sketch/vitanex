// PATCH /api/club/voeding/regels  { ledenOverschrijven: boolean }
// Mogen leden het voedingsplan van de trainer zelf overschrijven? Standaard nee:
// dan sturen ze een voorstel. Alleen de leiding (Kane, eigenaar, clubmanager;
// rollen/wie.ts), geen trainer: die bepaalt dit niet voor de hele sportschool.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { isLeiding } from '@/lib/club/rollen/wie'
import { bewaarVoedingRegels } from '@/lib/club/voeding/eigen-opslag'

export async function PATCH(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  if (!isLeiding(t)) return clubFout('Niet gevonden.', 404)
  const body = await leesJsonBegrensd(req, 1024)
  const waarde = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).ledenOverschrijven : undefined
  if (typeof waarde !== 'boolean') return clubFout('Ongeldig verzoek.', 400)
  return alsAntwoord(await bewaarVoedingRegels(t, { ledenOverschrijven: waarde }))
}
